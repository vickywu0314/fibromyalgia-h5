(function(){
  const form=document.getElementById("syndromeForm");
  const secondaryInputs=form.querySelectorAll('input[name="secondarySyndrome"]');
  const PATH="zhpd";
  const BACK="../patient-detail.html";

  // 兼证不能与主证相同：主证选中的那一项在兼证中禁用并取消勾选
  function syncSecondary(){
    const main=form.querySelector('input[name="mainSyndrome"]:checked')?.value;
    secondaryInputs.forEach(input=>{
      const same=input.value===main;
      input.disabled=same;
      if(same) input.checked=false;
      input.closest("label").classList.toggle("is-disabled",same);
    });
  }

  form.querySelectorAll('input[name="mainSyndrome"]').forEach(input=>{
    input.addEventListener("change",syncSecondary);
  });

  // 结构体：secondarySyndrome 为字符串（多选用“、”拼接），另存数组 secondarySyndromes；hasSecondary 按是否选兼证得出
  function collect(){
    const main=form.querySelector('input[name="mainSyndrome"]:checked')?.value||"";
    const secondary=[...secondaryInputs].filter(i=>i.checked&&!i.disabled).map(i=>i.value);
    return {
      finish:true,
      mainSyndrome:main,
      secondarySyndrome:secondary.join("、"),
      secondarySyndromes:secondary,
      hasSecondary:secondary.length?"是":(main?"否":"")
    };
  }

  // 回显：window.fillForm(FmsCase.get("zhpd"))
  window.fillForm=function(data){
    data=data||{};
    form.querySelectorAll('input[name="mainSyndrome"]').forEach(i=>{i.checked=i.value===data.mainSyndrome});
    let sec=Array.isArray(data.secondarySyndromes)?data.secondarySyndromes:data.secondarySyndrome;
    if(typeof sec==="string") sec=sec?sec.split(/[、,，]/):[];
    sec=[].concat(sec||[]);
    secondaryInputs.forEach(i=>{i.checked=sec.includes(i.value)});
    syncSecondary();
  };

  // 进度：主证必答；兼证可不选（无兼证），不计入
  const progress=FmsProgress.track(form,{optional:["secondarySyndrome"]});

  // 边选边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
  form.addEventListener("change",()=>{try{FmsCase.set(PATH,Object.assign(collect(),{finish:false}))}catch(e){}});

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const btn=form.querySelector('button[type="submit"]');
    if(!form.querySelector('input[name="mainSyndrome"]:checked')){FmsCase.toast("请选择主证");return}
    FmsCase.save(PATH,collect(),{back:BACK,button:btn});
  });

  window.fillForm(FmsCase.get(PATH));
  progress.refresh();
})();
