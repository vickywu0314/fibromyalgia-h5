// 子模块入口跳转：浏览器 / WebView 内直接跳到同目录下对应的 H5 页面。
// 病例草稿存在 WebView 的 localStorage 中，必须在同一 WebView 内跳转，子模块才能读写同一份草稿；
// 只有 pageUrls 中没有对应页面时，才回退给原生 openPage。
// 保存统一走 FmsCase.save（../js/fms-case.js），这里不再提供原生 saveForm 保存。
window.NativeBridge = window.NativeBridge || {};
// 子模块 page 标识 → 相对 H5 页面
window.NativeBridge.pageUrls = window.NativeBridge.pageUrls || {
  csi: "csi.html",
  work: "work.html",
  body: "body-composition.html",
  tipi: "tipi.html",
  sffq: "sffq.html"
};
window.NativeBridge.openPage = function(page){
  var url = (window.NativeBridge.pageUrls || {})[page];
  if (url) { window.location.href = url; return; }
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.openPage) {
    window.webkit.messageHandlers.openPage.postMessage({page: page});
    return;
  }
  if (window.Android && typeof window.Android.openPage === "function") {
    window.Android.openPage(page);
    return;
  }
  console.log("[NativeBridge] openPage:", page);
};
