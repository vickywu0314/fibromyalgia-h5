// 静态页面共用的 Native / API 边界。生产环境使用同源 /api 反向代理。
// 医生 ID：老前端菜单跳转时以明文 GET 参数带入，?doctorId=xxx 或 ?userId=xxx 都可以
// （如 index.html?doctorId=5065）。读到后记到 sessionStorage，同一标签页跳到其他页面不用再带。
(function () {
  var KEY = 'fms_doctor_id', LAST = 'fms_last_doctor_id';
  try {
    var q = new URLSearchParams(location.search);
    var id = (q.get('doctorId') || q.get('userId') || '').trim();
    if (!/^\d+$/.test(id)) return;
    sessionStorage.setItem(KEY, id);
    // 换了医生：清掉上一位医生未提交的病例草稿（草稿存在 localStorage），避免数据串到别人名下
    var prev = localStorage.getItem(LAST);
    if (prev && prev !== id) ['fms_case_draft', 'fms_case_unsynced'].forEach(function (k) { localStorage.removeItem(k); });
    localStorage.setItem(LAST, id);
  } catch (e) {}
})();

window.FmsApi = {
  // 取值顺序：App 内 WenwenClass.getUserId() → 网址参数带入的 doctorId / userId → localhost 开发默认 5065
  getDoctorId() {
    const native = window.WenwenClass;
    if (native && typeof native.getUserId === 'function') {
      const id = native.getUserId();
      if (id != null && String(id).trim()) return String(id).trim();
    }
    const q = new URLSearchParams(location.search);
    const query = (q.get('doctorId') || q.get('userId') || '').trim();
    if (/^\d+$/.test(query)) return query;
    try {
      const cached = sessionStorage.getItem('fms_doctor_id');
      if (cached) return cached;
    } catch (e) {}
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
  }
};
