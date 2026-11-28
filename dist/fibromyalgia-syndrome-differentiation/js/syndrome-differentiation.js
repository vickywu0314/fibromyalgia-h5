(function(){
  const form=document.getElementById("syndromeForm");
  const secondaryBox=document.getElementById("secondaryOptions");
  const secondaryInputs=form.querySelectorAll('input[name="secondarySyndrome"]');
  const PATH="zhpd";
  const BACK="../patient-detail.html";

  // 2026-11-28 原「病史病情-全身症状」移到这里：主证、兼证每一项后面跟随相应症状（多选、选填）。
  // 症状仍存 bsbq.systemic（数组，主证 + 兼证所选症状），后端字段不变；主证 / 兼证本身仍必选。
  const SYMPTOMS={
    "肝郁气滞证":["焦虑易怒","胸胁胀闷或刺痛","寐差多梦","脘闷嗳气","腹痛","不思饮食","疲乏无力"],
    "寒湿痹阻证":["四肢重着无力","每遇寒则冷痛，遇温痛减"],
    "痰热扰心证":["惊悸不安","口苦心烦","头痛失眠","渴喜冷饮","性情急躁","反复梦魇","恶心纳呆"],
    "肝肾不足证":["肌肉无力","腰膝痠软，劳累加重","筋缩，手足不遂","畏寒肢冷","肢体麻木","失眠健忘"]
  };
  const SYM_NAME={mainSyndrome:"mainSymptoms",secondarySyndrome:"secondarySymptoms"};
  // 每个证型选项下面插入它的症状勾选框（选中该证型时才显示）
  Object.keys(SYM_NAME).forEach(group=>{
    form.querySelectorAll('input[name="'+group+'"]').forEach(radio=>{
      const box=document.createElement("div");
      box.className="symptoms";box.hidden=true;box.dataset.for=group+"="+radio.value;
      const tip=document.createElement("p");tip.className="symptoms-tip";tip.textContent="相应症状（可多选，选填）";box.appendChild(tip);
      (SYMPTOMS[radio.value]||[]).forEach(sym=>{
        const l=document.createElement("label"),i=document.createElement("input");
        i.type="checkbox";i.name=SYM_NAME[group];i.value=sym;l.append(i,document.createTextNode(sym));box.appendChild(l);
      });
      radio.closest("label").insertAdjacentElement("afterend",box);
    });
  });
  function syncSymptoms(){
    form.querySelectorAll(".symptoms").forEach(box=>{
      const [group,val]=box.dataset.for.split("=");
      const r=form.querySelector('input[name="'+group+'"][value="'+val+'"]');
      const show=!!(r&&r.checked&&!r.disabled);
      box.hidden=!show;
      box.querySelectorAll("input").forEach(i=>{i.disabled=!show;if(!show)i.checked=false;});
    });
  }
  function checkedSymptoms(){
    return [...form.querySelectorAll('input[name="mainSymptoms"]:checked,input[name="secondarySymptoms"]:checked')].map(i=>i.value);
  }
  // 症状写回病史病情的全身症状（只写 bsbq.systemic，不改病史病情的完成状态）
  function storeSymptoms(){ try{FmsCase.set("bsbq.systemic",checkedSymptoms())}catch(e){} }

  function value(name){
    return form.querySelector('input[name="'+name+'"]:checked')?.value||"";
  }

  // 按产品原型：是否有兼证选「是」才显示兼证（单选）；选「否」或未选时隐藏并清空。
  // 兼证不能与主证相同：主证选中的那一项在兼证中禁用并取消选择。
  function sync(){
    const main=value("mainSyndrome");
    const show=value("hasSecondary")==="是";
    secondaryBox.hidden=!show;
    secondaryInputs.forEach(input=>{
      const same=input.value===main;
      input.disabled=!show||same;
      if(!show||same) input.checked=false;
      input.closest("label").classList.toggle("is-disabled",same);
    });
    syncSymptoms();
  }

  // 结构体：secondarySyndrome 为字符串；secondarySyndromes 数组保留（兼容旧的多选数据，现在最多 1 项）
  function collect(){
    const main=value("mainSyndrome");
    const has=value("hasSecondary");
    const secondary=has==="是"?value("secondarySyndrome"):"";
    return {
      finish:true,
      mainSyndrome:main,
      hasSecondary:has,
      secondarySyndrome:secondary,
      secondarySyndromes:secondary?[secondary]:[]
    };
  }

  // 回显：window.fillForm(FmsCase.get("zhpd"))。旧数据兼证是多选的，回显第一项。
  window.fillForm=function(data){
    data=data||{};
    let sec=Array.isArray(data.secondarySyndromes)&&data.secondarySyndromes.length?data.secondarySyndromes:data.secondarySyndrome;
    if(typeof sec==="string") sec=sec?sec.split(/[、,，]/):[];
    sec=[].concat(sec||[]).filter(Boolean);
    const has=data.hasSecondary||(sec.length?"是":"");
    form.querySelectorAll('input[name="mainSyndrome"]').forEach(i=>{i.checked=i.value===data.mainSyndrome});
    form.querySelectorAll('input[name="hasSecondary"]').forEach(i=>{i.checked=i.value===has});
    sync();
    secondaryInputs.forEach(i=>{i.checked=!i.disabled&&i.value===sec[0]});
    syncSymptoms();
    // 回显症状：bsbq.systemic 中属于当前主证 / 兼证的症状
    const sys=(FmsCase.get("bsbq")||{}).systemic||[];
    form.querySelectorAll('input[name="mainSymptoms"],input[name="secondarySymptoms"]').forEach(i=>{i.checked=!i.disabled&&sys.includes(i.value)});
  };

  // 进度：主证、是否有兼证必答；选「是」时兼证也计入（隐藏时不计）
  const progress=FmsProgress.track(form,{optional:["mainSymptoms","secondarySymptoms"]});

  // 边选边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
  form.addEventListener("change",()=>{
    sync();
    progress.refresh();
    try{FmsCase.set(PATH,Object.assign(collect(),{finish:false}))}catch(e){}
    storeSymptoms();
  });

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const btn=form.querySelector('button[type="submit"]');
    if(!value("mainSyndrome")){FmsCase.toast("请选择主证");return}
    if(!value("hasSecondary")){FmsCase.toast("请选择是否有兼证");return}
    if(value("hasSecondary")==="是"&&!value("secondarySyndrome")){FmsCase.toast("请选择兼证");return}
    storeSymptoms(); // 先写入 bsbq.systemic，保存时与证候判断一起提交
    FmsCase.save(PATH,collect(),{back:BACK,button:btn});
  });

  window.fillForm(FmsCase.get(PATH));
  progress.refresh();
})();
