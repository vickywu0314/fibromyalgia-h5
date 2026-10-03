// 随诊详情查看模式：录入开始页预取 /api/fms/patient/case/detail，各模块页回显并只读。
// 接口说明见 docs/api/case-detail.md。依赖 fms-api.js。
window.CaseView = {
  PREFETCH_KEY: 'fms_case_detail_prefetch',

  // parts：jbxx 基本信息 / bsbq 病史病情 / zhpd 证候判断 / fzjc 辅助检查 / bqpg 病情评估 / zlfa 治疗方案 / blsj 不良反应
  ALL_PARTS: ['jbxx', 'bsbq', 'zhpd', 'fzjc', 'bqpg', 'zlfa', 'blsj'],
  async fetchParts(patientId, caseId, parts) {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    const result = await FmsApi.get('/api/fms/patient/case/detail', { patientId, doctorId, caseId, parts: parts.join(',') });
    if (!result || result.success !== true) throw new Error((result && result.message) || '随诊详情加载失败，请稍后重试');
    return result.data || {};
  },
  async fetchPart(patientId, caseId, part) {
    return (await this.fetchParts(patientId, caseId, [part]))[part] || {};
  },

  // path 为模块代码，或「模块.子模块」形式（如 jbxx.csi、jbxx.fs.wpi），子模块数据嵌在模块数据里。
  async fetchPath(patientId, caseId, path) {
    const [part, ...rest] = path.split('.');
    return rest.reduce((data, key) => (data && data[key]) || {}, await this.fetchPart(patientId, caseId, part));
  },

  savePrefetch(caseId, part, data) {
    try { sessionStorage.setItem(this.PREFETCH_KEY, JSON.stringify({ caseId: String(caseId), part, savedAt: Date.now(), data })); } catch {}
  },
  // 一次性使用，同一随诊、同一模块且 60 秒内有效。
  takePrefetch(caseId, part) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.PREFETCH_KEY) || 'null');
      sessionStorage.removeItem(this.PREFETCH_KEY);
      if (saved && saved.caseId === String(caseId) && saved.part === part && Date.now() - saved.savedAt < 60000) return saved.data;
    } catch {}
    return null;
  },

  // 当前页面的查看参数：URL 带 mode=view 时为查看模式。
  context() {
    const params = new URLSearchParams(location.search);
    return { isView: params.get('mode') === 'view', patientId: params.get('patientId') || '', caseId: params.get('caseId') || '' };
  },

  // 查看页取数据：优先用上一页带过来的，没有则自己请求。
  async load(path) {
    const { patientId, caseId } = this.context();
    if (!patientId || !caseId) throw new Error('缺少随诊信息，请从随访记录进入');
    return this.takePrefetch(caseId, path) || await this.fetchPath(patientId, caseId, path);
  },

  // 带着子模块数据跳到子模块查看页（data 为 undefined 时不预取，由子页自己请求）。
  openView(url, path, data) {
    const { patientId, caseId } = this.context();
    if (data !== undefined) this.savePrefetch(caseId, path, data);
    location.href = url + (url.includes('?') ? '&' : '?') + new URLSearchParams({ patientId, caseId, mode: 'view' });
  },

  // 模块页调用：URL 带 mode=view 时进入查看模式。
  // options.keep：查看时仍可点击的按钮选择器；options.onData(data)：数据回显后的回调。
  async init(form, path, options = {}) {
    if (!this.context().isView) return;
    document.body.classList.add('is-view');
    this.lock(form, options.keep);
    try {
      const data = await this.load(path);
      this.data = data;
      this.fill(form, data);
      if (options.onData) options.onData(data);
    } catch (error) {
      this.notice(error.name === 'AbortError' ? '请求超时，请返回重试' : error.message);
    }
  },

  isEmpty(value) {
    return value == null || value === '' || (Array.isArray(value) && !value.length) || (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length);
  },

  // 按字段名回显：字段名与表单控件 name 一致，多选字段为数组（对应 name 或 name[]）。
  fill(form, data) {
    Object.entries(data || {}).forEach(([key, value]) => {
      const controls = form.querySelectorAll(`[name="${CSS.escape(key)}"],[name="${CSS.escape(key + '[]')}"]`);
      if (!controls.length || value == null) return;
      const values = (Array.isArray(value) ? value : [value]).map(String);
      controls.forEach(control => {
        if (control.type === 'checkbox' || control.type === 'radio') {
          control.checked = values.includes(control.value);
          // 触发页面原有的联动（如确诊后显示确诊信息、兼证选项）。
          if (control.checked) control.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (control.tagName === 'SELECT') {
          if (![...control.options].some(o => o.value === values[0])) control.add(new Option(values[0], values[0]));
          control.value = values[0];
        } else {
          control.value = control.type === 'date' ? FmsApi.formatDate(values[0]) : values[0];
        }
      });
    });
    // 查看模式下联动脚本可能重新启用控件，回显后再锁一次。
    if (this.locked) this.lock(form, this.keep);
  },

  lock(form, keep) {
    this.locked = true;
    this.keep = keep;
    form.querySelectorAll('input,select,textarea,button').forEach(control => {
      if (keep && control.matches(keep)) return;
      control.disabled = true;
    });
  },

  // 查看模式下在 anchor 前显示已上传的图片（urls 为 URL 数组或单个 URL）。
  images(anchor, title, urls) {
    const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
    if (!anchor || !list.length) return;
    const box = document.createElement('section');
    box.className = 'case-view-images';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const row = document.createElement('div');
    list.forEach(src => { const img = document.createElement('img'); img.src = src; img.alt = title; row.append(img); });
    box.append(heading, row);
    anchor.before(box);
  },

  notice(message) {
    let bar = document.getElementById('caseViewNotice');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'caseViewNotice';
      bar.className = 'case-view-notice';
      document.querySelector('main').prepend(bar);
    }
    bar.textContent = message;
  }
};
