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

  // 模块页调用：URL 带 mode=view 时进入查看模式。options.keep 为查看时仍可点击的按钮选择器。
  async init(form, part, options = {}) {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') !== 'view') return;
    const patientId = params.get('patientId') || '';
    const caseId = params.get('caseId') || '';
    document.body.classList.add('is-view');
    this.lock(form, options.keep);
    if (!patientId || !caseId) return this.notice('缺少随诊信息，请从随访记录进入');
    try {
      const data = this.takePrefetch(caseId, part) || await this.fetchPart(patientId, caseId, part);
      this.fill(form, data);
    } catch (error) {
      this.notice(error.name === 'AbortError' ? '请求超时，请返回重试' : error.message);
    }
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
    // 联动脚本可能重新启用控件，回显后再锁一次。
    this.lock(form, this.keep);
  },

  lock(form, keep) {
    this.keep = keep;
    form.querySelectorAll('input,select,textarea,button').forEach(control => {
      if (keep && control.matches(keep)) return;
      control.disabled = true;
    });
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
