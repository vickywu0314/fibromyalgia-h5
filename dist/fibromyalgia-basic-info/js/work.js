(function(){
  const form=document.getElementById("workForm");
  const workQuestions=document.getElementById("workQuestions");
  const q5=document.getElementById("q5");
  const q6=document.getElementById("q6");
  const actualHours=document.getElementById("actualHours");

  function clearSection(section){
    section.querySelectorAll("input").forEach(el=>{
      if(el.type==="radio"||el.type==="checkbox") el.checked=false;
      else el.value="";
    });
  }

  function updateFlow(){
    const employed=form.querySelector('input[name="q1"]:checked')?.value;
    const skipWork=employed==="否";
    workQuestions.classList.toggle("is-skipped",skipWork);
    workQuestions.querySelectorAll("input").forEach(x=>x.disabled=skipWork);
    if(skipWork){ clearSection(workQuestions); return; }

    const zero=actualHours.value!=="" && Number(actualHours.value)===0;
    q5.classList.toggle("is-skipped",zero);
    q5.querySelectorAll("input").forEach(x=>x.disabled=zero);
    if(zero) clearSection(q5);
  }

  form.addEventListener("change",updateFlow);
  actualHours.addEventListener("input",updateFlow);

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const payload={type:"work-productivity",data};
    if(window.webkit?.messageHandlers?.saveForm) window.webkit.messageHandlers.saveForm.postMessage(payload);
    else if(window.Android&&typeof window.Android.saveForm==="function") window.Android.saveForm(JSON.stringify(payload));
    else console.log("[WORK] save",payload);
  });
})();