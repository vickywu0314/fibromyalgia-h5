(function(){
  const U = window.FormUtils;
  const form = document.getElementById("workForm");
  const workQuestions = document.getElementById("workQuestions");
  const q5 = document.getElementById("q5");
  const actualHours = document.getElementById("actualHours");

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
  U.bind({form: form, path: "jbxx.work", update: updateFlow});

  // WPAI 标准计分（WPAI-GH v2.0），结果为百分比（0~100，保留 1 位小数）：
  //   缺勤率 absenteeism = Q2/(Q2+Q4)
  //   出勤受损 presenteeism = Q5/10
  //   总体工作受损 workImpairment = Q2/(Q2+Q4) + [1 - Q2/(Q2+Q4)] × Q5/10
  //   活动受损 activityImpairment = Q6/10
  // 前三项仅在当前有带薪工作（Q1=是）时计算；无公认二分判定，score / result 留空。
  function pct(x){ return x == null || isNaN(x) ? "" : String(Math.round(x * 1000) / 10); }
  function numOrNull(v){ return v === undefined || v === "" ? null : Number(v); }
  function wpai(d){
    const r = {absenteeism: "", presenteeism: "", workImpairment: "", activityImpairment: ""};
    const q6 = numOrNull(d.q6Score);
    if (q6 != null) r.activityImpairment = pct(q6 / 10);
    if (d.q1 !== "是") return r;
    const q2 = numOrNull(d.q2), q4 = numOrNull(d.q4), q5 = numOrNull(d.q5Score);
    let abs = null;
    if (q2 != null && q4 != null && q2 + q4 > 0) { abs = q2 / (q2 + q4); r.absenteeism = pct(abs); }
    if (q5 != null && q4 > 0) r.presenteeism = pct(q5 / 10);
    if (abs != null) {
      if (abs === 1) r.workImpairment = pct(1);
      else if (q5 != null) r.workImpairment = pct(abs + (1 - abs) * q5 / 10);
    }
    return r;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = U.serialize(form);
    if (!d.q1) { FmsCase.toast("请回答第 1 题"); return; }
    if (d.q6Score === undefined) { FmsCase.toast("请完成第 6 题评分"); return; }
    const value = Object.assign({finish: true, score: "", result: "", answers: d}, wpai(d));
    U.save("jbxx.work", value, {back: "basic-info.html", button: form.querySelector('button[type="submit"]')});
  });
})();
