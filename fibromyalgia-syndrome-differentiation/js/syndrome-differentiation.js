(function(){
  const form=document.getElementById("syndromeForm");
  const secondaryBox=document.getElementById("secondaryOptions");
  const secondaryInputs=form.querySelectorAll('input[name="secondarySyndrome"]');
  const PATH="zhpd";
  const BACK="../patient-detail.html";

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
  };

  // 进度：主证、是否有兼证必答；选「是」时兼证也计入（隐藏时不计）
  const progress=FmsProgress.track(form);

  // 边选边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
  form.addEventListener("change",()=>{
    sync();
    progress.refresh();
    try{FmsCase.set(PATH,Object.assign(collect(),{finish:false}))}catch(e){}
  });

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const btn=form.querySelector('button[type="submit"]');
    if(!value("mainSyndrome")){FmsCase.toast("请选择主证");return}
    if(!value("hasSecondary")){FmsCase.toast("请选择是否有兼证");return}
    if(value("hasSecondary")==="是"&&!value("secondarySyndrome")){FmsCase.toast("请选择兼证");return}
    FmsCase.save(PATH,collect(),{back:BACK,button:btn});
  });

  window.fillForm(FmsCase.get(PATH));
  progress.refresh();
})();
