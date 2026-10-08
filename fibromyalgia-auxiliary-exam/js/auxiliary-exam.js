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
  // 选图后先上传到 /api/upload/image，草稿和提交里只存返回的图片 URL（labReportImages / ecgReportImages，同时写 lab_report_url / ecg_report_url）
  const images={labReport:[],ecgReport:[]};
  let uploading=0;

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
      f.value="";
      const box=document.getElementById(previewId),img=box.querySelector("img");
      const local=URL.createObjectURL(x);
      img.src=local;box.hidden=false;uploading++;
      FmsCase.toast("图片上传中…");
      try{images[id]=[await FmsUpload.image(x)];FmsCase.toast("图片已上传");}
      catch(e){FmsCase.toast(e.message||"图片上传失败");}
      finally{uploading--;URL.revokeObjectURL(local);}
      showPreview(id,previewId);
      autosave();
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
    data.lab_report_url=data.labReportImages[0]||"";
    data.ecg_report_url=data.ecgReportImages[0]||"";
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
    // 只回显已上传的 URL（旧草稿里的 base64 不再提交）；数组为空时用 lab_report_url / ecg_report_url
    const urls=(list,one)=>{const a=(Array.isArray(list)?list:[]).filter(x=>x&&!/^data:/.test(x));return a.length?a:(one&&!/^data:/.test(one)?[one]:[])};
    images.labReport=urls(data.labReportImages,data.lab_report_url);
    images.ecgReport=urls(data.ecgReportImages,data.ecg_report_url);
    sync();
    const put=(name,v)=>{const el=form.elements[name];if(el&&!el.disabled)el.value=v!=null?v:""};
    VALUE_FIELDS.forEach(([k])=>put(k,data[k+"_value"]));
    STOOL_CELLS.concat(BIOCHEM).forEach(k=>put(k+"_value",data[k+"_value"]));
    LIPIDS.forEach(k=>put(k,data[k]));
    showPreview("labReport","labPreview");
    showPreview("ecgReport","ecgPreview");
  };

  // 进度：每个单选题（含「数值/异常」时的数值）各算一题；血常规、尿常规、血脂的每个数值各算一题，
  // 勾选该组「未查」即视为已答；上传图片不计
  const GROUP_VALUES=VALUE_FIELDS.concat(LIPIDS.map(k=>[k,k+"_notDone"]));
  const progress=FmsProgress.track(form,{
    optional:NOT_DONE.concat(GROUP_VALUES.map(([k])=>k),LIPIDS.map(k=>k+"_notDone")),
    extra:()=>({
      total:GROUP_VALUES.length,
      answered:GROUP_VALUES.filter(([k,group])=>form.elements[group].checked||String(form.elements[k].value||"").trim()!=="").length
    })
  });

  // 边填边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
  let timer=0;
  function autosave(){
    clearTimeout(timer);
    timer=setTimeout(()=>{try{FmsCase.set(PATH,Object.assign(collect(),{finish:false}))}catch(e){}},300);
  }
  form.addEventListener("change",autosave);
  form.addEventListener("input",autosave);

  form.onsubmit=e=>{
    e.preventDefault();
    if(uploading>0){FmsCase.toast("图片还在上传，请稍候");return}
    clearTimeout(timer);
    FmsCase.save(PATH,collect(),{back:BACK,button:form.querySelector('button[type="submit"]')});
  };

  window.fillForm(FmsCase.get(PATH));
  progress.refresh();
})();
