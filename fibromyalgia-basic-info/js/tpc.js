/* 压痛点（TPC）：9 对（左/右）共 18 个压痛点。
   score = 阳性压痛点个数（0~18）；result 按 1990 年 ACR 纤维肌痛分类标准：≥11 个压痛点阳性为“是”，否则“否”。
   写入病例草稿 jbxx.tpc：{ finish, score, result, answers:{ q1:[...], ..., q9:[...] } } */
(function(){
  const form = document.getElementById("tpcForm");
  const questions = [...form.querySelectorAll(".question")];

  function progress(){
    const done = questions.filter(q => q.querySelector("input:checked")).length;
    const pct = Math.round(done / questions.length * 100);
    document.getElementById("progressBar").style.width = pct + "%";
    document.getElementById("progressText").textContent = "已完成" + pct + "%";
  }

  // “左”和“右”可同时选择；选择“无”时取消左右，选择左右时取消“无”。
  questions.forEach(question => {
    question.addEventListener("change", e => {
      if(e.target.type !== "checkbox") return;
      const boxes = [...question.querySelectorAll('input[type="checkbox"]')];
      const none = boxes.find(x => x.dataset.none !== undefined);

      if(e.target === none && none.checked){
        boxes.forEach(x => { if(x !== none) x.checked = false; });
      }else if(e.target !== none && e.target.checked && none){
        none.checked = false;
      }
      progress();
    });
  });

  const saved = FmsCase.get("jbxx.tpc");
  if(saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  progress();

  form.addEventListener("submit", e => {
    e.preventDefault();
    const answers = {};
    let score = 0;
    for(let i = 1; i <= questions.length; i++){
      const vals = [...form.querySelectorAll('input[name="q'+i+'"]:checked')].map(x => x.value);
      if(!vals.length){ FmsCase.toast("请完成第" + i + "项"); return; }
      answers["q"+i] = vals;
      score += vals.filter(v => v === "左" || v === "右").length;
    }
    FmsCase.save("jbxx.tpc", {
      finish: true,
      score: String(score),
      result: score >= 11 ? "是" : "否",
      answers
    }, { back: "../fibromyalgia-condition-history/condition-history.html", button: document.getElementById("saveBtn") });
  });
})();
