(()=>{
  const f=document.querySelector("#adverseForm"),details=document.querySelector("#eventDetails");
  const start=f.elements.startDate,end=f.elements.endDate;

  // 选“有”才显示症状及后续字段；否则隐藏 + 禁用 + 清空
  function sync(){
    const show=f.elements.hasAdverseEvent.value==="有";
    details.hidden=!show;
    details.querySelectorAll("input,textarea").forEach(x=>{
      x.disabled=!show;
      if(!show){if(x.type==="radio"||x.type==="checkbox")x.checked=false;else x.value=""}
    });
    syncDates();
  }
  function syncDates(){
    end.min=start.value||"";
    start.max=end.value||"";
  }
  f.elements.hasAdverseEvent.forEach(x=>x.addEventListener("change",sync));
  start.addEventListener("change",syncDates);
  end.addEventListener("change",syncDates);

  // SAE类别为单选，但非SAE时允许不选：再次点击已选项可取消
  f.querySelectorAll('input[name="saeCategory"]').forEach(r=>{
    r.closest("label").addEventListener("pointerdown",()=>{r.dataset.was=r.checked?"1":""});
    r.addEventListener("click",()=>{if(r.dataset.was==="1"){r.checked=false;r.dataset.was=""}});
  });

  // 回显：window.fillForm({hasAdverseEvent:"有",adverseEvents:["头晕"],startDate:"2026-06-01",...})
  window.fillForm=function(data){
    data=data||{};
    f.elements.hasAdverseEvent.value=data.hasAdverseEvent||"";
    sync();
    if(data.hasAdverseEvent!=="有")return;
    const ev=[].concat(data.adverseEvents||[]);
    f.querySelectorAll('input[name="adverseEvents"]').forEach(c=>{c.checked=ev.includes(c.value)});
    ["startDate","endDate","otherMeasures","adverseEventDetails"].forEach(k=>{f.elements[k].value=data[k]||""});
    f.elements.saeCategory.value=data.saeCategory||"";
    f.elements.drugMeasure.value=data.drugMeasure||"";
    syncDates();
  };

  f.onsubmit=e=>{
    e.preventDefault();
    if(start.value&&end.value&&end.value<start.value){alert("结束日期不能早于发生日期");return}
    const fd=new FormData(f),data={};
    for(const [k,v] of fd){if(k==="adverseEvents"){(data[k]??=[]).push(v)}else data[k]=v}
    const payload={type:"adverse-reaction",data};
    if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);
    else if(window.Android&&typeof window.Android.saveForm==="function")window.Android.saveForm(JSON.stringify(payload));
    else{console.log("[ADVERSE REACTION]",payload);history.back()}
  };
  sync();
})();
