(function(){
  const form=document.getElementById("syndromeForm");
  const secondary=document.getElementById("secondaryOptions");

  // 兼证不可与主证相同：禁用与主证相同的兼证选项
  function updateSecondary(){
    const main=form.querySelector('input[name="mainSyndrome"]:checked')?.value;
    secondary.querySelectorAll("input").forEach(input=>{
      const same=input.value===main;
      input.disabled=same;
      input.parentElement.classList.toggle("is-disabled",same);
      if(same) input.checked=false;
    });
  }

  form.querySelectorAll('input[name="mainSyndrome"]').forEach(input=>{
    input.addEventListener("change",updateSecondary);
  });
  updateSecondary();

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const payload={type:"syndrome-differentiation",data};

    if(window.webkit?.messageHandlers?.saveForm){
      window.webkit.messageHandlers.saveForm.postMessage(payload);
    }else if(window.Android && typeof window.Android.saveForm==="function"){
      window.Android.saveForm(JSON.stringify(payload));
    }else{
      console.log("[SYNDROME]",payload);
      history.back();
    }
  });
})();
