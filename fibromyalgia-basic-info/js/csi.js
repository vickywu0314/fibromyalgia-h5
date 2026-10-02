(function(){
  const form = document.getElementById("csiForm");
  const result = document.getElementById("resultText");
  const scoreMap = {"从不":0,"很少":1,"有时":2,"经常":3,"总是":4};

  function calculate(){
    let score = 0, answered = 0;
    for(let i=1;i<=9;i++){
      const checked = form.querySelector('input[name="q'+i+'"]:checked');
      if(checked){ score += scoreMap[checked.value]; answered++; }
    }
    const finish = answered === 9;
    result.textContent = finish ? (score > 18 ? "是" : "否") : "--";
    return {finish, score: finish ? String(score) : "", result: finish ? result.textContent : ""};
  }

  FmsCase.fillForm(form, FmsCase.ext("csi9")?.answers);
  calculate();
  form.addEventListener("change", calculate);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    FmsCase.run(form.querySelector('button[type="submit"]'), async () => {
      await FmsCase.saveExt("csi9", {...calculate(), answers: FmsCase.readForm(form)});
      FmsCase.back("basic-info.html");
    });
  });
})();
