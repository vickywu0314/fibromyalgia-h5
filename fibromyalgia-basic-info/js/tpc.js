(function(){
  const form = document.getElementById("tpcForm");

  // “左”和“右”可同时选择；选择“无”时取消左右，选择左右时取消“无”。
  form.querySelectorAll(".question").forEach(question => {
    question.addEventListener("change", e => {
      if(e.target.type !== "checkbox") return;
      const boxes = [...question.querySelectorAll('input[type="checkbox"]')];
      const none = boxes.find(x => x.dataset.none !== undefined);

      if(e.target === none && none.checked){
        boxes.forEach(x => { if(x !== none) x.checked = false; });
      }else if(e.target !== none && e.target.checked && none){
        none.checked = false;
      }
    });
  });

  FmsCase.fillForm(form, FmsCase.ext("tpc")?.answers);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const answers = FmsCase.readForm(form);
    const items = Object.values(answers);
    // 分数为阳性压痛点个数（左右各计 1 个，共 18 个）；结果按 ACR 1990 标准 ≥11 个为“是”。
    const finish = items.every(x => x.length > 0);
    const score = items.flat().filter(x => x !== "无").length;
    FmsCase.run(form.querySelector('button[type="submit"]'), async () => {
      await FmsCase.saveExt("tpc", {
        finish, score: finish ? String(score) : "", result: finish ? (score >= 11 ? "是" : "否") : "", answers
      });
      FmsCase.back("basic-info.html");
    });
  });
})();
