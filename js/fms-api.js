// 静态页面共用的 Native / API 边界。生产环境使用同源 /api 反向代理。
window.FmsApi = {
  getDoctorId() {
    const native = window.WenwenClass;
    if (native && typeof native.getUserId === 'function') {
      const id = native.getUserId();
      return id == null ? '' : String(id).trim();
    }
    return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? '5065' : '';
  },
  async get(path, params) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(path + '?' + new URLSearchParams(params), {
        credentials: 'include', signal: controller.signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!response.ok) throw new Error('请求失败，请稍后重试');
      return await response.json();
    } finally { clearTimeout(timer); }
  },

  // 患者列表，接口说明见 docs/api/patient-list.md。
  // 返回 { patients, totalCount, totalPages }；success 不为 true 时按空列表处理。
  async fetchPatientList(doctorId) {
    const result = await this.get('/api/fms/patient/list', {
      pageNo: 1, pageSize: 100, doctorId, researchType: 12
    });
    const rows = result && result.success === true && Array.isArray(result.data) ? result.data : [];
    return {
      patients: rows.map(row => ({
        id: row.id,
        name: row.name || '未命名患者',
        lastFollowUpDate: this.formatDate(row.lastFollowUpDate),
        followUpCount: Number(row.followUpCount) || 0
      })),
      totalCount: Number(result && result.totalCount) || rows.length,
      totalPages: Number(result && result.totalPages) || 1
    };
  },

  // 兼容 "2020-11-04"、"2020-11-04 10:20:30"、ISO 字符串和毫秒时间戳，统一成 年-月-日。
  formatDate(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const date = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  },

  // 上一页预取的列表通过 sessionStorage 带到列表页，一次性使用，60 秒内且同一医生才有效。
  PREFETCH_KEY: 'fms_patient_list_prefetch',
  savePatientListPrefetch(doctorId, list) {
    try { sessionStorage.setItem(this.PREFETCH_KEY, JSON.stringify({ doctorId, savedAt: Date.now(), list })); } catch {}
  },
  takePatientListPrefetch(doctorId) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.PREFETCH_KEY) || 'null');
      sessionStorage.removeItem(this.PREFETCH_KEY);
      if (saved && saved.doctorId === doctorId && Date.now() - saved.savedAt < 60000) return saved.list;
    } catch {}
    return null;
  }
};
