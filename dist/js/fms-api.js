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
  }
};
