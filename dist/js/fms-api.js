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

  // 患者列表（分页），接口说明见 docs/api/patient-list.md。
  // 返回 { patients, pageNo, hasMore, totalCount }；success 不为 true 时按空页处理。
  PATIENT_PAGE_SIZE: 20,
  async fetchPatientList(doctorId, pageNo = 1) {
    const pageSize = this.PATIENT_PAGE_SIZE;
    const result = await this.get('/api/fms/patient/list', { pageNo, pageSize, doctorId, researchType: 12 });
    const ok = result && result.success === true && Array.isArray(result.data);
    const rows = ok ? result.data : [];
    const totalPages = Number(result && result.totalPages);
    return {
      patients: rows.map(row => ({
        id: row.id,
        name: row.name || '未命名患者',
        lastFollowUpDate: this.formatDate(row.lastFollowUpDate),
        followUpCount: Number(row.followUpCount) || 0
      })),
      pageNo,
      // 优先用 totalPages 判断；后端没给时，本页取满说明可能还有下一页。
      hasMore: ok && (totalPages > 0 ? pageNo < totalPages : rows.length >= pageSize),
      totalCount: Number(result && result.totalCount) || 0
    };
  },

  // 患者随诊列表（分页），接口说明见 docs/api/follow-up-list.md。
  // 返回 { followUps, pageNo, hasMore, totalCount }；success 不为 true 时按空页处理。
  FOLLOW_UP_PAGE_SIZE: 20,
  async fetchFollowUpList(doctorId, patientId, pageNo = 1) {
    const pageSize = this.FOLLOW_UP_PAGE_SIZE;
    const result = await this.get('/api/fms/patient/followup/list', { pageNo, pageSize, patientId, doctorId, researchType: 12 });
    const ok = result && result.success === true;
    const data = ok ? result.data : null;
    // 文档里 data 为对象，兼容直接返回数组或 { list, totalPages, totalCount } 两种结构。
    const rows = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : []);
    const paging = Array.isArray(data) ? result : (data || {});
    const totalPages = Number(paging.totalPages);
    return {
      followUps: rows.map(row => ({
        id: row.id,
        followUpDate: this.formatDate(row.followUpDate),
        sortTime: this.toTime(row.followUpDate)
      })),
      pageNo,
      hasMore: ok && (totalPages > 0 ? pageNo < totalPages : rows.length >= pageSize),
      totalCount: Number(paging.totalCount) || 0
    };
  },

  // 日期转毫秒，用于排序；无法解析返回 0（排在最后）。
  toTime(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number' || /^\d+$/.test(value)) return Number(value);
    const time = new Date(String(value).replace(' ', 'T')).getTime();
    return Number.isNaN(time) ? 0 : time;
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

  // 上一页预取的第 1 页列表通过 sessionStorage 带到列表页，一次性使用，60 秒内且同一医生才有效。
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
