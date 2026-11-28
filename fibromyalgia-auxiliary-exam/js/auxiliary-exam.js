(()=>{
  const form=document.getElementById("examForm");
  const PATH="fzjc";
  const BACK="../patient-detail.html";
  // 2026-11-28 改版：每组一个状态 <组>_status = 未查 / 大致正常 / 异常（新增字段），选「异常」才展开该组项目，
  // 项目选填（填写异常的即可，没填的视为正常）。各项目仍写原有字段，按组状态换算：
  //   未查 → 项目状态「未查」；大致正常 → 血尿常规/血脂「已查」、肝肾功「正常」、便常规「正常/阴性」；
  //   异常 → 填了数值的：血尿常规/血脂「已查」、肝肾功「异常」；没填的按正常处理。
  const GROUPS=["cbc","urine","stool","liver","kidney","lipid"];
  // 血常规、尿常规：<key>_value / <key>_status（未查/已查）
  const VALUE_FIELDS=[
    ["cbc_wbc","cbc"],["cbc_rbc","cbc"],["cbc_hgb","cbc"],["cbc_plt","cbc"],
    ["urine_wbc","urine"],["urine_rbc","urine"],["urine_protein","urine"],["urine_occult","urine"]
  ];
  // 肝肾功：<key>_status 为 未查/正常/异常，<key>_value 数值
  const BIOCHEM=[["alt","liver"],["ast","liver"],["bun","kidney"],["cr","kidney"]];
  // 便常规白细胞/红细胞：<key>_status 为 正常/数值/未查，选「数值」时填 <key>_value
  const STOOL_CELLS=["stool_wbc","stool_rbc"];
  // 血脂：值写原有 key（cholesterol 等），<key>_status 为 未查/已查；载脂蛋白A/B 已去掉（提交空串）
  const LIPIDS=["cholesterol","triglyceride","ldl","hdl"];
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
    GROUPS.forEach(g=>setArea(document.getElementById(g+"_abnormal"),radio(g+"_status")==="异常"));
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
    const val=n=>{const el=form.elements[n];return el&&!el.disabled?String(el.value||"").trim():""};
    const gs={};
    GROUPS.forEach(g=>{gs[g]=radio(g+"_status");data[g+"_status"]=gs[g];});
    // 组未选时，项目状态留空
    const itemStatus=(g,checked)=>gs[g]==="未查"?"未查":gs[g]?checked:"";
    VALUE_FIELDS.forEach(([k,g])=>{
      data[k+"_value"]=gs[g]==="异常"?val(k):"";
      data[k+"_status"]=itemStatus(g,"已查");
    });
    if(gs.stool==="异常"){
      data.stool_appearance=radio("stool_appearance");
      STOOL_CELLS.forEach(k=>{data[k+"_status"]=radio(k+"_status");data[k+"_value"]=data[k+"_status"]==="数值"?val(k+"_value"):"";});
      data.stool_occult=radio("stool_occult");
    }else{
      const st=gs.stool==="未查"?"未查":gs.stool==="大致正常"?"正常":"";
      data.stool_appearance=st;
      STOOL_CELLS.forEach(k=>{data[k+"_status"]=st;data[k+"_value"]="";});
      data.stool_occult=gs.stool==="未查"?"未查":gs.stool==="大致正常"?"阴性":"";
    }
    BIOCHEM.forEach(([k,g])=>{
      const v=gs[g]==="异常"?val(k+"_value"):"";
      data[k+"_value"]=v;
      data[k+"_status"]=itemStatus(g,v?"异常":"正常");
    });
    LIPIDS.forEach(k=>{
      data[k]=gs.lipid==="异常"?val(k):"";
      data[k+"_status"]=itemStatus("lipid","已查");
    });
    // 载脂蛋白A/B 已去掉
    ["apoa","apob"].forEach(k=>{data[k]="";data[k+"_status"]="";});
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
    // 组状态：有新字段直接用；旧数据按项目推断（全部未查→未查；有数值/异常→异常；其余已填→大致正常）
    const has=v=>v!=null&&String(v).trim()!=="";
    const infer=(statuses,values,abnormal)=>{
      const st=statuses.filter(has);
      if(!st.length&&!values.some(has))return "";
      if(st.length&&st.every(x=>x==="未查"))return "未查";
      if(values.some(has)||abnormal)return "异常";
      return "大致正常";
    };
    const groupStatus={
      cbc:data.cbc_status||infer(VALUE_FIELDS.filter(x=>x[1]==="cbc").map(([k])=>data[k+"_status"]),VALUE_FIELDS.filter(x=>x[1]==="cbc").map(([k])=>data[k+"_value"])),
      urine:data.urine_status||infer(VALUE_FIELDS.filter(x=>x[1]==="urine").map(([k])=>data[k+"_status"]),VALUE_FIELDS.filter(x=>x[1]==="urine").map(([k])=>data[k+"_value"])),
      stool:data.stool_status||infer([data.stool_appearance,data.stool_wbc_status,data.stool_rbc_status,data.stool_occult],[data.stool_wbc_value,data.stool_rbc_value],
        (has(data.stool_appearance)&&!["正常","未查"].includes(data.stool_appearance))||data.stool_occult==="阳性"),
      liver:data.liver_status||infer(["alt","ast"].map(k=>data[k+"_status"]),["alt","ast"].map(k=>data[k+"_value"]),["alt","ast"].some(k=>data[k+"_status"]==="异常")),
      kidney:data.kidney_status||infer(["bun","cr"].map(k=>data[k+"_status"]),["bun","cr"].map(k=>data[k+"_value"]),["bun","cr"].some(k=>data[k+"_status"]==="异常")),
      lipid:data.lipid_status||infer(LIPIDS.map(k=>data[k+"_status"]),LIPIDS.map(k=>data[k]))
    };
    GROUPS.forEach(g=>setRadio(g+"_status",groupStatus[g]));
    setRadio("stool_appearance",data.stool_appearance);
    setRadio("stool_occult",data.stool_occult);
    STOOL_CELLS.forEach(k=>setRadio(k+"_status",data[k+"_status"]));
    setRadio("ecg",data.ecg);
    // 只回显已上传的 URL（旧草稿里的 base64 不再提交）；数组为空时用 lab_report_url / ecg_report_url
    const urls=(list,one)=>{const a=(Array.isArray(list)?list:[]).filter(x=>x&&!/^data:/.test(x));return a.length?a:(one&&!/^data:/.test(one)?[one]:[])};
    images.labReport=urls(data.labReportImages,data.lab_report_url);
    images.ecgReport=urls(data.ecgReportImages,data.ecg_report_url);
    sync();
    const put=(name,v)=>{const el=form.elements[name];if(el&&!el.disabled)el.value=v!=null?v:""};
    VALUE_FIELDS.forEach(([k])=>put(k,data[k+"_value"]));
    STOOL_CELLS.forEach(k=>put(k+"_value",data[k+"_value"]));
    BIOCHEM.forEach(([k])=>put(k+"_value",data[k+"_value"]));
    LIPIDS.forEach(k=>put(k,data[k]));
    showPreview("labReport","labPreview");
    showPreview("ecgReport","ecgPreview");
  };

  // 进度：6 组状态 + 心电图为必答；「异常」展开的各项目为选填，不计入
  const OPTIONAL_ITEMS=VALUE_FIELDS.map(([k])=>k).concat(BIOCHEM.map(([k])=>k+"_value"),LIPIDS,
    ["stool_appearance","stool_occult"],STOOL_CELLS.map(k=>k+"_status"),STOOL_CELLS.map(k=>k+"_value"));
  const progress=FmsProgress.track(form,{optional:OPTIONAL_ITEMS});

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
