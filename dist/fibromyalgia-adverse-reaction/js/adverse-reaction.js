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

  // 回显：window.fillForm(FmsCase.get("blsj"))，如 {hasAdverseEvent:"有",adverseEvents:["头晕"],startDate:"2026-06-01",...}
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

  // 结构体 blsj：adverseEvents 存不带百分比的名称（checkbox value）
  function collect(){
    const has=f.elements.hasAdverseEvent.value||"";
    const on=has==="有";
    const val=k=>on?String(f.elements[k].value||"").trim():"";
    return {
      finish:true,
      hasAdverseEvent:has,
      adverseEvents:on?[...f.querySelectorAll('input[name="adverseEvents"]:checked')].map(c=>c.value):[],
      startDate:val("startDate"),
      endDate:val("endDate"),
      saeCategory:val("saeCategory"),
      drugMeasure:val("drugMeasure"),
      otherMeasures:val("otherMeasures"),
      adverseEventDetails:val("adverseEventDetails")
    };
  }

  f.onsubmit=e=>{
    e.preventDefault();
    if(start.value&&end.value&&end.value<start.value){FmsCase.toast("结束日期不能早于发生日期");return}
    FmsCase.save("blsj",collect(),{back:"../patient-detail.html",button:f.querySelector('button[type="submit"]')});
  };
  sync();
  window.fillForm(FmsCase.get("blsj"));
})();
