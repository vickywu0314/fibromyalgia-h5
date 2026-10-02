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