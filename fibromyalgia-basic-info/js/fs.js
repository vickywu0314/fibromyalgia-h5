(function(){
  function render(){
    const ext=FmsCase.state().jbxx.ext;
    document.querySelectorAll(".module-row").forEach(link=>{
      const status=FmsCase.status(ext[link.dataset.page]);
      const tag=link.querySelector(".status");
      tag.className="status "+(status==="done"?"done":"pending");
      tag.textContent=FmsCase.statusText[status];
    });
  }
  render();
  // 从 WPI / SSS 后退回来时页面可能来自缓存，需要重新读取状态。
  addEventListener("pageshow",e=>{ if(e.persisted) render(); });

  document.getElementById("backBtn").addEventListener("click",()=>FmsCase.back("basic-info.html"));
})();
