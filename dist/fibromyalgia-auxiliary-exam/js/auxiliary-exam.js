(()=>{
  const form=document.getElementById("examForm");
  const PATH="fzjc";
  const BACK="../patient-detail.html";
  // 血常规、尿常规：整组「未查」开关（写 <key>_status = 未查/已查）
  const NOT_DONE=["cbc_notDone","urine_notDone"];
  const VALUE_FIELDS=[
    ["cbc_wbc","cbc_notDone"],["cbc_rbc","cbc_notDone"],["cbc_hgb","cbc_notDone"],
    ["urine_wbc","urine_notDone"],["urine_rbc","urine_notDone"],["urine_protein","urine_notDone"],["urine_occult","urine_notDone"]
  ];
  // 生化肝肾功能：<key>_status 为 未查/正常/异常，异常时填 <key>_value
  const BIOCHEM=["alt","ast","bun","cr"];
  // 便常规白细胞/红细胞：<key>_status 为 正常/数值/未查，选「数值」时填 <key>_value
  const STOOL_CELLS=["stool_wbc","stool_rbc"];
  // 血脂：值写结构体原有 key（cholesterol 等），<key>_status 为 未查/已查
  const LIPIDS=["cholesterol","triglyceride","ldl","hdl","apob","apoa"];
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

  const radio=n=>{const el=form.querySelector(`input[name="${n}"]:checked`);return el?el.value:""};
  function setRadio(n,v){form.querySelectorAll(`input[name="${n}"]`).forEach(i=>{i.checked=v!=null&&v!==""&&i.value===String(v)})}

  function sync(){
    NOT_DONE.forEach(n=>{
      const cb=form.elements[n];
      cb.closest(".badge-toggle").classList.toggle("is-checked",cb.checked);
      setArea(document.getElementById(n+"Body"),!cb.checked);
    });
    LIPIDS.forEach(k=>{
      const cb=form.elements[k+"_notDone"];
      cb.closest(".badge-toggle").classList.toggle("is-checked",cb.checked);
      setArea(document.getElementById(k+"_notDoneBody"),!cb.checked);
    });
    // 条件数值：.value[data-when="name=值"] 仅在对应单选选中时显示
    form.querySelectorAll(".value[data-when]").forEach(v=>{
      const i=v.dataset.when.indexOf("=");
      setArea(v,radio(v.dataset.when.slice(0,i))===v.dataset.when.slice(i+1));
    });
    setArea(document.getElementById("ecgUploadBody"),radio("ecg")!=="未查");
  }
  form.addEventListener("change",e=>{if(e.target.type==="radio"||e.target.type==="checkbox")sync()});

  function collect(){
    const data={finish:true};
    const notDone=n=>form.elements[n].checked;
    const val=n=>{const el=form.elements[n];return el&&!el.disabled?String(el.value||"").trim():""};
    VALUE_FIELDS.forEach(([k,group])=>{
      const v=notDone(group)?"":val(k);
      data[k+"_value"]=v;
      data[k+"_status"]=notDone(group)?"未查":(v?"已查":"");
    });
    data.stool_appearance=radio("stool_appearance");
    STOOL_CELLS.forEach(k=>{
      data[k+"_status"]=radio(k+"_status");
      data[k+"_value"]=data[k+"_status"]==="数值"?val(k+"_value"):"";
    });
    data.stool_occult=radio("stool_occult");
    BIOCHEM.forEach(k=>{
      data[k+"_status"]=radio(k+"_status");
      data[k+"_value"]=data[k+"_status"]==="异常"?val(k+"_value"):"";
    });
    LIPIDS.forEach(k=>{
      const nd=notDone(k+"_notDone");
      data[k]=nd?"":val(k);
      data[k+"_status"]=nd?"未查":(data[k]?"已查":"");
    });
    data.ecg=radio("ecg");
    data.labReportImages=images.labReport.slice();
    data.ecgReportImages=data.ecg==="未查"?[]:images.ecgReport.slice();
    data.lab_report_url="";
    data.ecg_report_url="";
    return data;
  }

  // 回显：window.fillForm(FmsCase.get("fzjc"))（结构体 key）。先恢复单选/未查开关，再写数值
  window.fillForm=function(data){
    data=data||{};
    const groupNotDone={};
    VALUE_FIELDS.forEach(([k,group])=>{if(data[k+"_status"]==="未查")groupNotDone[group]=true});
    NOT_DONE.forEach(n=>{form.elements[n].checked=!!groupNotDone[n]});
    LIPIDS.forEach(k=>{form.elements[k+"_notDone"].checked=data[k+"_status"]==="未查"});
    setRadio("stool_appearance",data.stool_appearance);
    setRadio("stool_occult",data.stool_occult);
    STOOL_CELLS.concat(BIOCHEM).forEach(k=>setRadio(k+"_status",data[k+"_status"]));
    setRadio("ecg",data.ecg);
    images.labReport=Array.isArray(data.labReportImages)?data.labReportImages.filter(Boolean):[];
    images.ecgReport=Array.isArray(data.ecgReportImages)?data.ecgReportImages.filter(Boolean):[];
    sync();
    const put=(name,v)=>{const el=form.elements[name];if(el&&!el.disabled)el.value=v!=null?v:""};
    VALUE_FIELDS.forEach(([k])=>put(k,data[k+"_value"]));
    STOOL_CELLS.concat(BIOCHEM).forEach(k=>put(k+"_value",data[k+"_value"]));
    LIPIDS.forEach(k=>put(k,data[k]));
    showPreview("labReport","labPreview");
    showPreview("ecgReport","ecgPreview");
  };

  form.onsubmit=e=>{
    e.preventDefault();
    FmsCase.save(PATH,collect(),{back:BACK,button:form.querySelector('button[type="submit"]')});
  };

  window.fillForm(FmsCase.get(PATH));
})();
