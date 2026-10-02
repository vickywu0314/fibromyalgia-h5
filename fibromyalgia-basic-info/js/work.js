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

  // 按跳题规则，可见的题目都答了才算完成。
  function isFinished(data){
    if(!data.q1||!data.q6) return false;
    if(data.q1==="否") return true;
    if(data.q2===""||data.q3===""||data.q4==="") return false;
    return Number(data.q4)===0 || !!data.q5;
  }

  FmsCase.fillForm(form,FmsCase.ext("work")?.answers);
  updateFlow();
  form.addEventListener("change",updateFlow);
  actualHours.addEventListener("input",updateFlow);

  form.addEventListener("submit",e=>{
    e.preventDefault();
    FmsCase.run(form.querySelector('button[type="submit"]'),async()=>{
      const answers=FmsCase.readForm(form);
      await FmsCase.saveExt("work",{finish:isFinished(answers),score:"",result:"",answers});
      FmsCase.back("basic-info.html");
    });
  });
})();
