// 随诊录入（新增 / 修改）：所有模块都提交到 POST /api/fms/patient/case/add，后端按 id 判断新增或修改。
// 接口说明见 docs/api/case-add.md。依赖 fms-api.js、case-view.js。
//
// 录入上下文存放在 sessionStorage（fms_case_edit），由录入入口页 patient-detail.html 建立：
//   { token, patientId, caseId, name, visitDate, newPatient: { name, idCard } }
// 各模块页从上下文取患者和随诊 ID；第一次保存后后端返回随诊 ID（新患者还会返回患者 ID），写回上下文。
// 没有上下文时（直接打开页面预览），各页面保持原来的本地演示行为，不调用接口。
window.CaseEdit = {
  KEY: 'fms_case_edit',

  context() {
    try { return JSON.parse(sessionStorage.getItem(this.KEY) || 'null'); } catch { return null; }
  },
  setContext(ctx) {
    try { sessionStorage.setItem(this.KEY, JSON.stringify(ctx)); } catch {}
    return ctx;
  },
  // 在录入流程中（有上下文且不是查看模式）。
  active() {
    return !!this.context() && !(window.CaseView && CaseView.context().isView);
  },
  today() {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  // 录入入口页调用。token 标识一次录入：同一 token 返回入口页时保留已生成的随诊 ID，新 token 重新开始。
  start({ token, patientId, caseId, name, visitDate, newPatient }) {
    const old = this.context();
    if (old && old.token === token) {
      if (caseId) old.caseId = caseId;
      return this.setContext(old);
    }
    return this.setContext({
      token, patientId: patientId || null, caseId: caseId || null, name: name || '',
      visitDate: visitDate || this.today(), newPatient: newPatient || null
    });
  },

  // 修改时读取已保存的数据（path 同 CaseView：jbxx、jbxx.csi、bqpg.vas…）；新随诊返回 null。
  async load(path) {
    const ctx = this.context();
    if (!ctx || !ctx.caseId || !ctx.patientId) return null;
    return CaseView.fetchPath(ctx.patientId, ctx.caseId, path);
  },

  // 保存一个模块。partData 只需包含本次修改的一级 key，后端按一级 key 合并，未提交的 key 保持不变。
  async save(part, partData) {
    const ctx = this.context();
    if (!ctx) throw new Error('缺少录入信息，请从患者列表进入');
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    if (!ctx.patientId && part !== 'jbxx') throw new Error('新患者请先填写并保存基本信息');
    if (part === 'jbxx' && partData.visitDate) ctx.visitDate = partData.visitDate;
    const body = {
      id: ctx.caseId || null,
      patientId: ctx.patientId || null,
      doctorId: Number(doctorId) || doctorId,
      researchType: 12,
      visitDate: ctx.visitDate || this.today(),
      part,
      [part]: partData
    };
    const result = await FmsApi.post('/api/fms/patient/case/add', body);
    if (!result || result.success !== true) throw new Error((result && result.message) || '保存失败，请稍后重试');
    const data = result.data || {};
    if (data.id) ctx.caseId = data.id;
    if (data.patientId) ctx.patientId = data.patientId;
    this.setContext(ctx);
    return data;
  },

  // 表单取值：多选（checkbox）始终为数组，name 去掉 []；空值不提交；数字框转 number。
  collect(form) {
    const data = {};
    const multi = new Set([...form.querySelectorAll('input[type=checkbox][name]')].map(x => x.name.replace(/\[\]$/, '')));
    multi.forEach(key => { data[key] = []; });
    for (const control of form.querySelectorAll('[name]')) {
      if (control.disabled || !control.name || control.type === 'file' || control.type === 'submit') continue;
      const key = control.name.replace(/\[\]$/, '');
      if (control.type === 'checkbox') { if (control.checked) data[key].push(control.value); continue; }
      if (control.type === 'radio') { if (control.checked) data[key] = control.value; continue; }
      const value = control.value.trim();
      if (value === '') continue;
      data[key] = control.type === 'number' || control.type === 'range' ? Number(value) : value;
    }
    return data;
  },

  // 单表单模块页：修改时回显已保存数据（可编辑）。返回已保存数据或 null。
  async prefill(form, path) {
    if (!this.active()) return null;
    try {
      const data = await this.load(path);
      if (data) CaseView.fill(form, data);
      return data;
    } catch (error) {
      CaseView.notice('已保存的数据加载失败：' + error.message);
      return null;
    }
  },

  // 提交按钮通用处理：防重复提交、显示错误，成功后返回上一页。
  async submit(form, task) {
    const button = form.querySelector('[type=submit]');
    if (button && button.disabled) return;
    const text = button && button.textContent;
    if (button) { button.disabled = true; button.textContent = '正在保存...'; }
    try {
      await task();
      history.back();
    } catch (error) {
      window.alert(error.name === 'AbortError' ? '保存超时，请稍后重试' : error.message);
    } finally {
      if (button) { button.disabled = false; button.textContent = text; }
    }
  },

  // 单表单模块的标准接法：回显 + 提交时保存。
  //   path：jbxx / bsbq / jbxx.csi / bqpg.vas …（最多两级：part.key）
  //   options.build(data, saved)：提交前整理数据（可返回 Promise）；返回 false 表示校验不通过、不提交。
  //   options.nested：子模块再下一级 key（如 FS 的 wpi），提交时与已保存的同级数据合并。
  bindForm(form, path, options = {}) {
    if (!this.active()) return false;
    const [part, sub] = path.split('.');
    let saved = null, parent = null;
    const ready = (async () => {
      if (options.nested) {
        parent = (await this.load(`${part}.${sub}`).catch(() => null)) || {};
        saved = parent[options.nested] || null;
        if (saved) CaseView.fill(form, saved);
      } else {
        saved = await this.prefill(form, path);
      }
      if (options.onLoad) options.onLoad(saved || {});
    })();
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.submit(form, async () => {
        await ready;
        let data = this.collect(form);
        if (options.build) data = await options.build(data, saved || {});
        if (data === false) throw new Error(options.invalidMessage || '请检查填写内容');
        data.finish = true;
        let partData;
        if (options.nested) partData = { [sub]: { ...parent, [options.nested]: data } };
        else partData = sub ? { [sub]: data } : data;
        await this.save(part, partData);
      });
    }, true);
    return true;
  },

  // ---------- 列表类模块（本地工作副本 + 同步） ----------
  // 原页面用 localStorage 存列表；录入流程中列表页打开时先用服务端数据覆盖本地，增删改后整组提交。
  LISTS: {
    'benbing_xiyao_records': ['jbxx', 'treatmentHistory', 'xiyao'],
    'benbing_zhongyao-tangji_records': ['jbxx', 'treatmentHistory', 'zhongyaoTangji'],
    'benbing_fei-yaowu-liaofa_records': ['jbxx', 'treatmentHistory', 'feiYaowuLiaofa'],
    'benbing_zhongchengyao_records': ['jbxx', 'treatmentHistory', 'zhongchengyao'],
    'jiwang_bingshi_records': ['jbxx', 'diseaseHistory'],
    'hebing_yaowu_records': ['jbxx', 'concomitantMedication'],
    'zhiliao-fangan:xiyao': ['zlfa', 'xiyao'],
    'zhiliao-fangan:zhongchengyao': ['zlfa', 'zhongchengyao'],
    'zhiliao-fangan:zhongyao-yinpian': ['zlfa', 'zhongyaoYinpian'],
    'zhiliao-fangan:fei-yaowu': ['zlfa', 'feiYaowu']
  },
  // 合并药物：页面本地存字符串，接口为 [{ name }]。
  toServer(key, list) {
    return key === 'hebing_yaowu_records' ? list.map(name => ({ name })) : list;
  },
  toLocal(key, list) {
    return key === 'hebing_yaowu_records' ? list.map(x => (typeof x === 'string' ? x : x.name)) : list;
  },
  readLocal(key) {
    try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  },

  // 列表页调用：录入流程中先把服务端数据写入本地（新随诊写空列表），再加载页面原脚本。
  async boot(keys, scripts) {
    if (this.active()) {
      try {
        const ctx = this.context();
        const parts = [...new Set(keys.map(k => this.LISTS[k][0]))];
        const data = ctx.caseId ? await CaseView.fetchParts(ctx.patientId, ctx.caseId, parts) : {};
        keys.forEach(key => {
          const [part, a, b] = this.LISTS[key];
          const value = b ? data[part]?.[a]?.[b] : data[part]?.[a];
          localStorage.setItem(key, JSON.stringify(this.toLocal(key, Array.isArray(value) ? value : [])));
        });
      } catch (error) {
        CaseView.notice('已保存的数据加载失败：' + error.message);
      }
    }
    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src; script.onload = resolve; script.onerror = reject;
        document.body.append(script);
      });
    }
  },

  // 新增 / 修改 / 删除列表项后调用：把该组（或同一分组下的全部列表）提交到服务端。
  async commit(key) {
    if (!this.active()) return;
    const [part, a, b] = this.LISTS[key];
    let partData;
    if (b) {
      // 本病治疗史 4 类同属 treatmentHistory，按一级 key 合并，需整组提交。
      const group = { finish: true };
      Object.entries(this.LISTS).forEach(([k, [p, ga, gb]]) => {
        if (p === part && ga === a) group[gb] = this.toServer(k, this.readLocal(k));
      });
      partData = { [a]: group };
    } else {
      partData = { [a]: this.toServer(key, this.readLocal(key)) };
    }
    await this.save(part, partData);
  },

  // 列表页保存后跳转：录入流程中先提交，失败提示且不跳转。
  commitThen(key, go, onError) {
    if (!this.active()) return go();
    this.commit(key).then(go).catch(error => {
      const message = error.name === 'AbortError' ? '保存超时，请稍后重试' : error.message;
      if (onError) onError(message); else window.alert(message);
    });
  },

  // 图片上传字段：选择后立即上传（录入流程中）或本地预览（预览模式），box 内显示缩略图和删除按钮。
  // 返回 { urls, set(urls) }，提交时取 urls。
  imageField(input, box) {
    const state = { urls: [] };
    const render = () => {
      box.hidden = !state.urls.length;
      box.classList.add('case-edit-images');
      box.replaceChildren(...state.urls.map((url, index) => {
        const item = document.createElement('div');
        const img = document.createElement('img');
        img.src = url; img.alt = '已上传图片';
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = '删除';
        remove.onclick = () => { state.urls.splice(index, 1); render(); };
        item.append(img, remove);
        return item;
      }));
    };
    state.set = urls => { state.urls = (Array.isArray(urls) ? urls : [urls]).filter(Boolean); render(); };
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        window.alert('请选择不超过 5MB 的 JPG、PNG 或 GIF 图片');
        return;
      }
      try {
        state.urls.push(this.active() ? await FmsApi.upload(file) : URL.createObjectURL(file));
        render();
      } catch (error) {
        window.alert(error.name === 'AbortError' ? '图片上传超时，请重试' : error.message);
      }
    });
    render();
    return state;
  },

  // dataURL（页面压缩后的图片）上传为图片 URL；已是 URL 的原样返回。
  async uploadDataUrl(value, name) {
    if (!value || !String(value).startsWith('data:')) return value || '';
    const blob = await (await fetch(value)).blob();
    return FmsApi.upload(new File([blob], name || 'image.jpg', { type: blob.type }));
  }
};
