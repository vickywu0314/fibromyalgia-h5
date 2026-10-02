// 本次录入（病例）的本地草稿与保存。各页面保存时把所属分块提交到 /api/fms/patient/case/add，
// 草稿放在 localStorage，供页面之间回填和 App 内多个 WebView 共用。依赖 fms-api.js。
(function () {
  const KEY = 'fms_case_current';
  const RESEARCH_TYPE = 12;
  // 已有患者回填基本信息时只取这些字段。
  const JBXX_FIELDS = ['gender', 'mobile', 'province', 'marry', 'education', 'workStatus', 'smoking', 'smokingYears',
    'smokingAmount', 'drinking', 'drinkingYears', 'drinkType', 'drinkAmount', 'painOnsetDate', 'diagnosed',
    'diagnosisDate', 'hospitalLevel'];

  function today() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch { return null; }
  }
  function store(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
  function blank() { return { id: null, patientId: null, visitDate: today(), jbxx: { ext: {} } }; }
  function state() {
    const s = load() || blank();
    s.jbxx = s.jbxx || {};
    s.jbxx.ext = s.jbxx.ext || {};
    return s;
  }
  function pickId(value) {
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) return value;
    return null;
  }

  window.FmsCase = {
    state,

    // 新建档案进入患者资料页时调用。同一身份证号继续使用未完成的草稿，否则开始新的录入。
    start({ name, cardNo, patientId, patient }) {
      const old = load();
      if (old && old.jbxx && old.jbxx.cardNo === cardNo) {
        old.jbxx.name = name;
        if (patientId != null) old.patientId = old.jbxx.id = patientId;
        store(old);
        return old;
      }
      const s = blank();
      for (const key of JBXX_FIELDS) {
        if (patient && patient[key] != null && patient[key] !== '') s.jbxx[key] = patient[key];
      }
      Object.assign(s.jbxx, { id: patientId ?? null, name, cardNo });
      s.patientId = patientId ?? null;
      s.researchNo = (patient && (patient.researchNo || patient.patientNo)) || '';
      store(s);
      return s;
    },

    // 只改本地草稿，不请求接口。
    patch(fn) {
      const s = state();
      fn(s);
      store(s);
      return s;
    },

    ext(key) { return state().jbxx.ext[key]; },

    // 修改草稿后，把 part 对应的分块（如 jbxx）提交到后端。首次保存后记住后端返回的病例 id，后续即为更新。
    async save(part, fn) {
      const s = this.patch(fn);
      const doctorId = FmsApi.getDoctorId();
      if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
      const result = await FmsApi.post('/api/fms/patient/case/add', {
        id: s.id,
        patientId: s.patientId,
        doctorId: /^\d+$/.test(doctorId) ? Number(doctorId) : doctorId,
        researchType: RESEARCH_TYPE,
        visitDate: s.visitDate,
        page: 1,
        part: 'part_' + part,
        [part]: s[part]
      });
      if (!result || result.success === false) throw new Error((result && result.message) || '保存失败，请稍后重试');
      const data = result.data;
      const id = pickId(data) ?? pickId(data && (data.id ?? data.caseId));
      const patientId = pickId(data && data.patientId);
      this.patch(x => {
        if (id != null && x.id == null) x.id = id;
        if (patientId != null && x.patientId == null) x.patientId = x.jbxx.id = patientId;
      });
      return result;
    },

    // 基本信息下的子页面都存在 jbxx.ext 里，随 jbxx 一起提交。
    saveExt(key, value) {
      return this.save('jbxx', s => { s.jbxx.ext[key] = value; });
    },

    // done：已完成；partial：填了一部分；pending：未填写。数组类（既往病史、合并药物）有记录即算完成。
    status(item) {
      if (Array.isArray(item)) return item.length ? 'done' : 'pending';
      if (!item) return 'pending';
      return item.finish ? 'done' : 'partial';
    },
    statusText: { done: '已完成', partial: '未完成', pending: '未填写' },

    // 表单 → 对象。复选框总是数组，被禁用的控件不收集。
    readForm(form) {
      const data = {};
      for (const el of form.elements) {
        if (!el.name || el.disabled || ['file', 'submit', 'button'].includes(el.type)) continue;
        if (el.type === 'checkbox') {
          data[el.name] = data[el.name] || [];
          if (el.checked) data[el.name].push(el.value);
        } else if (el.type === 'radio') {
          if (el.checked) data[el.name] = el.value;
          else if (!(el.name in data)) data[el.name] = '';
        } else {
          data[el.name] = el.value.trim();
        }
      }
      return data;
    },

    fillForm(form, data) {
      if (!data) return;
      for (const el of form.elements) {
        if (!el.name || !(el.name in data) || el.type === 'file') continue;
        const value = data[el.name];
        if (el.type === 'checkbox') el.checked = [].concat(value).includes(el.value);
        else if (el.type === 'radio') el.checked = el.value === value;
        else el.value = value ?? '';
      }
    },

    // 保存期间禁用按钮；失败弹出原因并返回 false。
    async run(button, fn) {
      if (button.disabled) return false;
      const text = button.textContent;
      button.disabled = true;
      button.textContent = '保存中…';
      try {
        await fn();
        return true;
      } catch (error) {
        window.alert(error.name === 'AbortError' ? '保存超时，请稍后重试' : error.message);
        return false;
      } finally {
        button.disabled = false;
        button.textContent = text;
      }
    },

    // 从 href 页面进来的就后退（保留页面栈），否则直接替换到 href。
    back(href) {
      const target = new URL(href, location.href);
      let from = '';
      try { from = document.referrer ? new URL(document.referrer).pathname : ''; } catch {}
      if (from === target.pathname && history.length > 1) history.back();
      else location.replace(target.href);
    }
  };
})();
