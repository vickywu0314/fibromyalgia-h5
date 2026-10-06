(()=>{
  const form=document.getElementById("examForm");
  const PATH="fzjc";
  const BACK="../patient-detail.html";
  const NOT_DONE=["cbc_notDone","urine_notDone","stool_notDone","biochem_notDone"];
  // 页面输入 name → 结构体 key 前缀（写 <key>_value / <key>_status），以及所属“未查”组
  const VALUE_FIELDS=[
    ["cbc_wbc","cbc_notDone"],["cbc_rbc","cbc_notDone"],["cbc_hgb","cbc_notDone"],
    ["urine_wbc","urine_notDone"],["urine_rbc","urine_notDone"],["urine_protein","urine_notDone"],["urine_occult","urine_notDone"],
    ["alt","biochem_notDone"],["ast","biochem_notDone"],["bun","biochem_notDone"],["cr","biochem_notDone"],["glucose","biochem_notDone"]
  ];
  // 暂无上传接口：图片以 dataURL 存在草稿里（labReportImages / ecgReportImages）
  const images={labReport:[],ecgReport:[]};
  const MAX_SIDE=1600,QUALITY=0.82;

  function readAsDataURL(file){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      r.readAsDataURL(file);
    });
  }
  // 压缩到最长边 1600px 的 JPEG，避免 localStorage 草稿超出容量
  async function compress(file){
    const src=await readAsDataURL(file);
    try{
      const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
      const scale=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
      const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const c=document.createElement("canvas");c.width=w;c.height=h;
      const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
      const out=c.toDataURL("image/jpeg",QUALITY);
      return out.length<src.length?out:src;
    }catch(e){return src}
  }

  function showPreview(id,previewId){
    const box=document.getElementById(previewId),img=box.querySelector("img");
    const url=images[id][0];
    if(url){img.src=url;box.hidden=false}else{img.removeAttribute("src");box.hidden=true}
  }

  function bindUpload(id,previewId){
    const f=document.getElementById(id);
    f.onchange=async()=>{
      const x=f.files[0];
      if(!x)return;
      if(x.size>5*1024*1024){FmsCase.toast("图片大小不能超过5M");f.value="";return}
      try{images[id]=[await compress(x)]}catch(e){FmsCase.toast("图片读取失败");}
      f.value="";
      showPreview(id,previewId);
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
        if(i.type==="file"){
          images[i.id]=[];
          const p=el.querySelector(".preview");if(p){p.hidden=true;p.querySelector("img").removeAttribute("src")}
        }
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

  function collect(){
    const data={finish:true};
    const notDone=n=>form.elements[n].checked;
    VALUE_FIELDS.forEach(([k,group])=>{
      const v=notDone(group)?"":String(form.elements[k].value||"").trim();
      data[k+"_value"]=v;
      data[k+"_status"]=notDone(group)?"未查":(v?"已查":"");
    });
    // 便常规：只剩潜血；整组未查时写新 key stool_status
    data.stool_occult=notDone("stool_notDone")?"":(form.elements.stool_occult.value||"");
    data.stool_status=notDone("stool_notDone")?"未查":(data.stool_occult?"已查":"");
    data.ecg=form.elements.ecg.value||"";
    data.labReportImages=images.labReport.slice();
    data.ecgReportImages=data.ecg==="未查"?[]:images.ecgReport.slice();
    data.lab_report_url="";
    data.ecg_report_url="";
    return data;
  }

  // 回显：window.fillForm(FmsCase.get("fzjc"))（结构体 key）
  window.fillForm=function(data){
    data=data||{};
    const groupNotDone={};
    VALUE_FIELDS.forEach(([k,group])=>{if(data[k+"_status"]==="未查")groupNotDone[group]=true});
    if(data.stool_status==="未查")groupNotDone.stool_notDone=true;
    NOT_DONE.forEach(n=>{form.elements[n].checked=!!groupNotDone[n]});
    form.elements.ecg.value=data.ecg||"";
    images.labReport=Array.isArray(data.labReportImages)?data.labReportImages.filter(Boolean):[];
    images.ecgReport=Array.isArray(data.ecgReportImages)?data.ecgReportImages.filter(Boolean):[];
    sync();
    VALUE_FIELDS.forEach(([k])=>{
      const el=form.elements[k];
      if(el&&!el.disabled)el.value=data[k+"_value"]!=null?data[k+"_value"]:"";
    });
    if(!form.elements.stool_notDone.checked)form.elements.stool_occult.value=data.stool_occult||"";
    showPreview("labReport","labPreview");
    showPreview("ecgReport","ecgPreview");
  };

  form.onsubmit=e=>{
    e.preventDefault();
    FmsCase.save(PATH,collect(),{back:BACK,button:form.querySelector('button[type="submit"]')});
  };

  window.fillForm(FmsCase.get(PATH));
})();
