(function(){
  const U = window.FormUtils;
  const form = document.getElementById("workForm");
  const workQuestions = document.getElementById("workQuestions");
  const q5 = document.getElementById("q5");
  const actualHours = document.getElementById("actualHours");
  const STORAGE_KEY = "fibromyalgia:workProductivity";

  function checked(name){
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  // 第5、6题：选端点后出现对应分数段（没有影响→0-4分，完全无法→5-10分）
  function updateScores(q, lowValue){
    const val = checked(q);
    U.toggle(document.getElementById(q + "Low"), val !== "" && val === lowValue);
    U.toggle(document.getElementById(q + "High"), val !== "" && val !== lowValue);
  }

  function updateFlow(){
    // 第1题选“否”：跳到第6题（2~5题隐藏并清空）
    const skipWork = checked("q1") === "否";
    document.getElementById("q1Tip").hidden = !skipWork;
    U.toggle(workQuestions, !skipWork);
    if (!skipWork) {
      // 第4题填0小时：跳到第6题（第5题隐藏并清空）
      const zero = actualHours.value !== "" && Number(actualHours.value) === 0;
      document.getElementById("q4Tip").hidden = !zero;
      U.toggle(q5, !zero);
      if (!zero) updateScores("q5", "健康问题对我的工作没有影响");
    } else {
      document.getElementById("q4Tip").hidden = true;
    }
    updateScores("q6", "健康问题对我的日常活动没有影响");
  }

  form.addEventListener("change", e => {
    // 切换端点时清空原来的分值
    if (e.target.name === "q5" || e.target.name === "q6") {
      form.querySelectorAll('input[name="' + e.target.name + 'Score"]').forEach(x => x.checked = false);
    }
    updateFlow();
  });
  actualHours.addEventListener("input", updateFlow);
  U.bind({form: form, key: STORAGE_KEY, update: updateFlow});

  form.addEventListener("submit", e => {
    e.preventDefault();
    U.save("work-productivity", U.serialize(form), STORAGE_KEY);
  });
})();
