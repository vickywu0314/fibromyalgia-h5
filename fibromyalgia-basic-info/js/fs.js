(function(){
  document.querySelectorAll(".module-row").forEach(link=>{
    link.addEventListener("click",e=>{
      const page=link.dataset.page;
      if(window.webkit?.messageHandlers?.openPage){
        e.preventDefault();
        window.webkit.messageHandlers.openPage.postMessage({page:page});
      }else if(window.Android && typeof window.Android.openPage==="function"){
        e.preventDefault();
        window.Android.openPage(page);
      }
      // 浏览器预览时不拦截，直接使用 href 打开对应 HTML。
    });
  });

  document.getElementById("backBtn").addEventListener("click",()=>{
    if(window.webkit?.messageHandlers?.closePage){
      window.webkit.messageHandlers.closePage.postMessage({});
    }else if(window.Android && typeof window.Android.closePage==="function"){
      window.Android.closePage();
    }else{
      history.back();
    }
  });
})();