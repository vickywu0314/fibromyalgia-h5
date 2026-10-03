(function(){
  // 查看模式（URL 带 mode=view）：数据为 jbxx.fs，含 wpi、sss 两部分，点击带数据打开对应查看页。
  const viewing=window.CaseView&&CaseView.context().isView;
  let fsData;
  if(viewing){
    document.body.classList.add("is-view");
    CaseView.load("jbxx.fs").then(data=>{
      fsData=data;
      document.querySelectorAll(".module-row").forEach(link=>{
        const filled=!CaseView.isEmpty(data[link.dataset.page]);
        const status=link.querySelector(".status");
        status.textContent=filled?"已填写":"未填写";
        status.classList.toggle("pending",!filled);
        status.classList.toggle("done",filled);
      });
    }).catch(error=>CaseView.notice(error.message));
  }

  document.querySelectorAll(".module-row").forEach(link=>{
    link.addEventListener("click",e=>{
      const page=link.dataset.page;
      if(viewing){
        e.preventDefault();
        CaseView.openView(link.getAttribute("href"),"jbxx.fs."+page,fsData?(fsData[page]??{}):undefined);
        return;
      }
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