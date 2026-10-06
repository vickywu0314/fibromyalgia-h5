(()=>{
  const form=document.getElementById("examForm");
  const NOT_DONE=["cbc_notDone","urine_notDone","stool_notDone","biochem_notDone"];

  function bindUpload(id,previewId){
    const f=document.getElementById(id),box=document.getElementById(previewId),img=box.querySelector("img");
    f.onchange=()=>{
      const x=f.files[0];
      if(!x){box.hidden=true;return}
      if(x.size>5*1024*1024){alert("图片大小不能超过5M");f.value="";return}
      img.src=URL.createObjectURL(x);box.hidden=false;
    };
  }
  bindUpload("labReport","labPreview");
  bindUpload("ecgReport","ecgPreview");

  // 隐藏区域：hidden + 禁用 + 清空
  function setArea(el,show){
    el.hidden=!show;
    el.querySelectorAll("input").forEach(i=>{
      i.disabled=!show;
      if(!show){
        if(i.type==="radio"||i.type==="checkbox")i.checked=false;else i.value="";
        if(i.type==="file"){const p=el.querySelector(".preview");if(p){p.hidden=true;p.querySelector("img").removeAttribute("src")}}
      }
    });
  }

  function sync(){
    NOT_DONE.forEach(n=>{
      const cb=form.elements[n];
      cb.closest(".badge-toggle").classList.toggle("is-checked",cb.checked);
      setArea(document.getElementById(n+"Body"),!cb.checked);
    });
    setArea(document.getElementById("ecgUploadBody"),form.elements.ecg.value!=="未查");
  }
  form.addEventListener("change",e=>{if(NOT_DONE.includes(e.target.name)||e.target.name==="ecg")sync()});

  // 回显：window.fillForm({cbc_notDone:"未查", alt:"30", ecg:"正常", ...})
  window.fillForm=function(data){
    data=data||{};
    NOT_DONE.forEach(n=>{form.elements[n].checked=data[n]==="未查"||data[n]===true});
    form.elements.ecg.value=data.ecg||"";
    sync();
    for(const [k,v] of Object.entries(data)){
      if(NOT_DONE.includes(k)||k==="ecg")continue;
      const el=form.elements[k];
      if(!el||el.disabled)continue;
      if(el instanceof RadioNodeList)el.value=v;else if(el.type!=="file")el.value=v;
    }
  };

  form.onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(form),data={};
    for(const [k,v] of fd){if(!(v instanceof File))data[k]=v}
    const payload={type:"auxiliary-exam",data};
    if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);
    else if(window.Android&&typeof window.Android.saveForm==="function")window.Android.saveForm(JSON.stringify(payload));
    else{console.log("[AUXILIARY EXAM]",payload);history.back()}
  };

  sync();
})();
