// 静态页面共用的 Native / API 边界。生产环境使用同源 /api 反向代理。
window.FmsApi = {
  // 医生 ID：App 内用 WenwenClass.getUserId()；浏览器测试时用网址参数 ?userId=xxx，
  // 记到 sessionStorage，同一标签页跳到其他页面不用再带；localhost 开发默认 5065。
  getDoctorId() {
    const native = window.WenwenClass;
    if (native && typeof native.getUserId === 'function') {
      const id = native.getUserId();
      return id == null ? '' : String(id).trim();
    }
    const KEY = 'fms_doctor_id';
    const query = (new URLSearchParams(location.search).get('userId') || '').trim();
    try {
      if (query) sessionStorage.setItem(KEY, query);
      const cached = sessionStorage.getItem(KEY);
      if (cached) return cached;
    } catch (e) {
      if (query) return query;
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
  }
};
