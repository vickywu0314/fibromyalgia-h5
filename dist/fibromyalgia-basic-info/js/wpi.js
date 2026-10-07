(function(){
  const form=document.querySelector("form");
  const countText=document.getElementById("wpiCountText");
  const scoreInput=document.getElementById("wpiScore");
  // WPI = 勾选的疼痛部位数（0-19）
  function updateCount(){
    const n=form.querySelectorAll('input[name="painArea"]:checked').length;
    countText.textContent=String(n);
    scoreInput.value=String(n);
  }
  form.addEventListener("change",updateCount);
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const fd=new FormData(form), data={};
    for(const [k,v] of fd.entries()){
      if(data[k]===undefined)data[k]=v;
      else if(Array.isArray(data[k]))data[k].push(v);
      else data[k]=[data[k],v];
    }
    const payload={type:document.body.dataset.type||document.title,data};
    if(window.webkit?.messageHandlers?.saveForm) window.webkit.messageHandlers.saveForm.postMessage(payload);
    else if(window.Android&&typeof window.Android.saveForm==="function") window.Android.saveForm(JSON.stringify(payload));
    else console.log("[FS] save",payload);
  });
})();