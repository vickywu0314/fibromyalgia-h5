(function(){
  const U = window.FormUtils;
  const form = document.getElementById("csiForm");
  const scoreText = document.getElementById("scoreText");
  const result = document.getElementById("resultText");
  const scoreInput = document.getElementById("scoreInput");
  const over18Input = document.getElementById("over18Input");

  // 每题 0=从不 1=很少 2=有时 3=经常 4=总是；总分 ≥18 分判定为“是”
  function calculate(){
    let score = 0, answered = 0;
    for (let i = 1; i <= 9; i++) {
      const checked = form.querySelector('input[name="q' + i + '"]:checked');
      if (checked) { score += Number(checked.value); answered++; }
    }
    const done = answered === 9;
    scoreText.textContent = answered ? String(score) : "--";
    result.textContent = done ? (score >= 18 ? "是" : "否") : "--";
    scoreInput.value = done ? String(score) : "";
    over18Input.value = done ? (score >= 18 ? "是" : "否") : "";
  }

  function answers(){
    const a = {};
    for (let i = 1; i <= 9; i++) {
      const c = form.querySelector('input[name="q' + i + '"]:checked');
      a["q" + i] = c ? c.value : "";
    }
    return a;
  }

  form.addEventListener("change", calculate);
  U.bind({form: form, path: "jbxx.csi", update: calculate});
  // 进度：已答题数 / 9；作答中暂存草稿（入口显示「填写中」）
  const tracker = FmsProgress.track(form);
  U.autoStore(form, "jbxx.csi", () => ({score: "", result: "", answers: answers()}));
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };
  form.addEventListener("submit", function(e){
    e.preventDefault();
    calculate();
    if (!scoreInput.value) { FmsCase.toast("请完成全部 9 道题目"); return; }
    // 总分 0~36；判定阈值：≥18 分为“是”（存在中枢敏化），否则“否”；未答完则 score/result 为空
    U.save("jbxx.csi", {
      finish: true,
      score: scoreInput.value,
      result: over18Input.value,
      answers: answers()
    }, {back: "basic-info.html", button: form.querySelector('button[type="submit"]')});
  });
})();
