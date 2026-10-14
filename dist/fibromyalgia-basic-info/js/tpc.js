/* 压痛点（TPC）：9 对（左/右）共 18 个压痛点。
   score = 阳性压痛点个数（0~18）；result 按 1990 年 ACR 纤维肌痛分类标准：≥11 个压痛点阳性为“是”，否则“否”。
   写入病例草稿 jbxx.tpc：{ finish, score, result, answers:{ q1:[...], ..., q9:[...] } } */
(function(){
  const form = document.getElementById("tpcForm");
  const questions = [...form.querySelectorAll(".question")];

  function collect(){
    const answers = {};
    for(let i = 1; i <= questions.length; i++){
      answers["q"+i] = [...form.querySelectorAll('input[name="q'+i+'"]:checked')].map(x => x.value);
    }
    return answers;
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
    });
  });

  const saved = FmsCase.get("jbxx.tpc");
  if(saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  // 进度：已作答的压痛点（每对左/右/无为一题）/ 9；作答中暂存草稿（入口显示「填写中」）
  FmsProgress.track(form);
  FormUtils.autoStore(form, "jbxx.tpc", () => ({ score: "", result: "", answers: collect() }));

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
    }, { back: "basic-info.html", button: document.getElementById("saveBtn") });
  });
})();
