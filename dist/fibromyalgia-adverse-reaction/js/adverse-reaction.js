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
    syncOther();
    syncDates();
  }
  // 症状选“其他”时填写名称（adverseEventOther）
  function syncOther(){
    const box=document.getElementById("adverseOtherBox"),inp=f.elements.adverseEventOther;
    const on=!details.hidden&&!!f.querySelector('input[name="adverseEvents"][value="其他"]:checked');
    box.hidden=!on;inp.disabled=!on;if(!on)inp.value="";
  }
  function syncDates(){
    end.min=start.value||"";
    start.max=end.value||"";
  }
  f.elements.hasAdverseEvent.forEach(x=>x.addEventListener("change",sync));
  f.querySelectorAll('input[name="adverseEvents"]').forEach(x=>x.addEventListener("change",syncOther));
  start.addEventListener("change",syncDates);
  end.addEventListener("change",syncDates);

  // SAE类别为单选，但非SAE时允许不选：再次点击已选项可取消
  f.querySelectorAll('input[name="saeCategory"]').forEach(r=>{
    r.closest("label").addEventListener("pointerdown",()=>{r.dataset.was=r.checked?"1":""});
    r.addEventListener("click",()=>{if(r.dataset.was==="1"){r.checked=false;r.dataset.was="";f.dispatchEvent(new Event("change"))}});
  });

  // 回显：window.fillForm(FmsCase.get("blsj"))，如 {hasAdverseEvent:"有",adverseEvents:["头晕"],startDate:"2026-06-01",...}
  window.fillForm=function(data){
    data=data||{};
    f.elements.hasAdverseEvent.value=data.hasAdverseEvent||"";
    sync();
    if(data.hasAdverseEvent!=="有")return;
    const ev=[].concat(data.adverseEvents||[]);
    f.querySelectorAll('input[name="adverseEvents"]').forEach(c=>{c.checked=ev.includes(c.value)});
    syncOther();
    if(ev.includes("其他"))f.elements.adverseEventOther.value=data.adverseEventOther||"";
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
      adverseEventOther:on&&!f.elements.adverseEventOther.disabled?String(f.elements.adverseEventOther.value||"").trim():"",
      startDate:val("startDate"),
      endDate:val("endDate"),
      saeCategory:val("saeCategory"),
      drugMeasure:val("drugMeasure"),
      otherMeasures:val("otherMeasures"),
      adverseEventDetails:val("adverseEventDetails")
    };
  }

  // 进度：每个 name 一题（选「有」后才计入症状、日期、措施等）；SAE类别（非SAE可不选）、其他措施为选填
  const progress=FmsProgress.track(f,{optional:["saeCategory","otherMeasures"]});

  // 边填边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
  let timer=0;
  const autosave=()=>{clearTimeout(timer);timer=setTimeout(()=>{try{FmsCase.set("blsj",Object.assign(collect(),{finish:false}))}catch(e){}},300)};
  f.addEventListener("change",autosave);
  f.addEventListener("input",autosave);

  f.onsubmit=e=>{
    e.preventDefault();
    clearTimeout(timer);
    if(!f.elements.hasAdverseEvent.value){FmsCase.toast("请选择有无不良反应");return}
    if(start.value&&end.value&&end.value<start.value){FmsCase.toast("结束日期不能早于发生日期");return}
    FmsCase.save("blsj",collect(),{back:"../patient-detail.html",button:f.querySelector('button[type="submit"]')});
  };
  sync();
  window.fillForm(FmsCase.get("blsj"));
  progress.refresh();

  // 上次随访的不良反应：取同一患者在当前记录之前的最近一条记录，若其中有不良反应，显示「上次随访时间」与症状（「、」分隔）；
  // 没有上一条记录或上次无不良反应时不显示。列表：/api/fms/patient/followup/list；详情：/api/fms/patient/case/detail（parts=blsj）
  (async function showLastVisit(){
    try{
      const c=FmsCase.load(), pid=c.patientId, did=FmsApi.getDoctorId();
      if(pid==null||pid===""||!did) return;
      const pick=(o,ks)=>{for(const k of ks)if(o&&o[k]!=null&&o[k]!=="")return o[k];return ""};
      const list=await FmsApi.get("/api/fms/patient/followup/list",{pageNo:1,pageSize:100,patientId:pid,doctorId:did,researchType:12});
      const d=list&&list.data, rows=[d,d&&d.list,d&&d.records,d&&d.rows].find(Array.isArray)||[];
      const curId=c.id!=null?String(c.id):"", curDate=String(c.visitDate||"").slice(0,10);
      const idNum=r=>Number(pick(r,["caseId","id","followupId"]))||0, dateOf=r=>String(pick(r,["visitDate","followupDate","followUpDate","createTime"])).slice(0,10);
      // 当前记录之前的记录：排除自己；日期更早，或同一天但编号更小（新建未保存的随访没有编号，取全部已有记录）
      const prev=rows.filter(r=>{
        const id=String(pick(r,["caseId","id","followupId"]));
        if(!id||id===curId) return false;
        if(!curId) return true;
        const dt=dateOf(r);
        return dt<curDate||(dt===curDate&&idNum(r)<Number(curId));
      }).sort((a,b)=>dateOf(b).localeCompare(dateOf(a))||idNum(b)-idNum(a))[0];
      if(!prev) return;
      const det=await FmsApi.get("/api/fms/patient/case/detail",{patientId:pid,doctorId:did,caseId:pick(prev,["caseId","id","followupId"]),parts:"blsj"});
      let b=det&&det.data&&det.data.blsj;
      if(typeof b==="string"){try{b=JSON.parse(b)}catch(e){b=null}}
      if(!b||b.hasAdverseEvent!=="有") return;
      const ev=(Array.isArray(b.adverseEvents)?b.adverseEvents:String(b.adverseEvents||"").split(/[、,，]/)).filter(Boolean)
        .map(x=>x==="其他"&&b.adverseEventOther?b.adverseEventOther:x);
      if(!ev.length) return;
      document.getElementById("lastVisitDate").textContent=dateOf(prev)||String(pick(det.data,["visitDate"])).slice(0,10);
      document.getElementById("lastVisitEvents").textContent=ev.join("、");
      document.getElementById("lastVisit").hidden=false;
    }catch(e){/* 查询失败时不显示，不影响填写 */}
  })();
})();
