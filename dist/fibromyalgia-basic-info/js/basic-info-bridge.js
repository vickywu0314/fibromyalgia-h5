window.NativeBridge = window.NativeBridge || {
  openPage: function(page){
    // 正式接入 App 时，由原生 WebView bridge 接管。
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.openPage) {
      window.webkit.messageHandlers.openPage.postMessage({page: page});
      return;
    }
    if (window.Android && typeof window.Android.openPage === "function") {
      window.Android.openPage(page);
      return;
    }
    // 无原生桥（浏览器直接打开）时，回退为跳转到同目录下对应的 H5 页面
    var url = (window.NativeBridge.pageUrls || {})[page];
    if (url) { window.location.href = url; return; }
    console.log("[NativeBridge] openPage:", page);
  },
  save: function(payload){
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saveForm) {
      window.webkit.messageHandlers.saveForm.postMessage(payload);
      return true;
    }
    if (window.Android && typeof window.Android.saveForm === "function") {
      window.Android.saveForm(JSON.stringify(payload));
      return true;
    }
    console.log("[NativeBridge] save:", payload);
    return false;
  }
};
// 子模块 page 标识 → 相对 H5 页面（仅在无原生桥时使用）
window.NativeBridge.pageUrls = window.NativeBridge.pageUrls || {
  csi: "csi.html",
  work: "work.html",
  body: "body-composition.html",
  tipi: "tipi.html",
  sffq: "sffq.html"
};
