(function(){
  const form=document.getElementById("syndromeForm");
  const secondaryInputs=form.querySelectorAll('input[name="secondarySyndrome"]');

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

  function collect(){
    const main=form.querySelector('input[name="mainSyndrome"]:checked')?.value||"";
    const secondary=[...secondaryInputs].filter(i=>i.checked&&!i.disabled).map(i=>i.value);
    return {mainSyndrome:main,secondarySyndrome:secondary};
  }

  // 回显：window.fillForm({mainSyndrome:"肝郁气滞证",secondarySyndrome:["寒湿痹阻证"]})
  window.fillForm=function(data){
    data=data||{};
    form.querySelectorAll('input[name="mainSyndrome"]').forEach(i=>{i.checked=i.value===data.mainSyndrome});
    const sec=[].concat(data.secondarySyndrome||[]);
    secondaryInputs.forEach(i=>{i.checked=sec.includes(i.value)});
    syncSecondary();
  };

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const payload={type:"syndrome-differentiation",data:collect()};

    if(window.webkit?.messageHandlers?.saveForm){
      window.webkit.messageHandlers.saveForm.postMessage(payload);
    }else if(window.Android && typeof window.Android.saveForm==="function"){
      window.Android.saveForm(JSON.stringify(payload));
    }else{
      console.log("[SYNDROME]",payload);
      history.back();
    }
  });

  syncSecondary();
})();
