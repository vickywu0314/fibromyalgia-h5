(function(){
  const form=document.getElementById("syndromeForm");
  const secondary=document.getElementById("secondaryOptions");

  function updateSecondary(){
    const value=form.querySelector('input[name="hasSecondary"]:checked')?.value;
    const disabled=value==="否";
    secondary.classList.toggle("is-disabled",disabled);
    secondary.querySelectorAll("input").forEach(input=>{
      input.disabled=disabled;
      if(disabled) input.checked=false;
    });
  }

  form.querySelectorAll('input[name="hasSecondary"]').forEach(input=>{
    input.addEventListener("change",updateSecondary);
  });

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