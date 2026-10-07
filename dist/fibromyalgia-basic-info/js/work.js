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
    } else {
      document.getElementById("q4Tip").hidden = true;
    }
  }

  form.addEventListener("change", updateFlow);
  actualHours.addEventListener("input", updateFlow);
  U.bind({form: form, path: "jbxx.work", update: updateFlow});
  // 进度：当前应答题（第1题选“否”跳过 2~5 题、第4题填 0 跳过第5题）中已答数
  const tracker = FmsProgress.track(form);
  U.autoStore(form, "jbxx.work", () => {
    const d = U.serialize(form), answers = {};
    ["q1", "q2", "q3", "q4", "q5", "q6"].forEach(k => { answers[k] = d[k] != null ? String(d[k]).trim() : ""; });
    return {score: "", result: "", answers: answers};
  });
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };

  // 第5、6题按 PDF 只有两个选项（「没有影响（0-4分）」/「完全无法…（5-10分）」），没有 0~10 的具体分值，
  // 因此 WPAI 只计算缺勤率（仅当前有带薪工作 Q1=是 时）：
  //   缺勤率 absenteeism = Q2/(Q2+Q4)，百分比（0~100，保留 1 位小数）
  // 出勤受损 / 总体工作受损 / 活动受损需要 Q5、Q6 的 0~10 分值，已不再计算和提交。无公认二分判定，score / result 留空。
  function pct(x){ return x == null || isNaN(x) ? "" : String(Math.round(x * 1000) / 10); }
  function numOrNull(v){ return v === undefined || v === "" ? null : Number(v); }
  function wpai(d){
    const r = {absenteeism: ""};
    if (d.q1 !== "是") return r;
    const q2 = numOrNull(d.q2), q4 = numOrNull(d.q4);
    if (q2 != null && q4 != null && q2 + q4 > 0) r.absenteeism = pct(q2 / (q2 + q4));
    return r;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = U.serialize(form);
    if (!d.q1) { FmsCase.toast("请回答第 1 题"); return; }
    if (!d.q6) { FmsCase.toast("请回答第 6 题"); return; }
    // 跳过的题目（第1题否 → 2~5 题；第4题为0 → 第5题）为空串
    const answers = {};
    ["q1", "q2", "q3", "q4", "q5", "q6"].forEach(k => { answers[k] = d[k] != null ? String(d[k]).trim() : ""; });
    const value = Object.assign({finish: true, score: "", result: "", answers: answers}, wpai(answers));
    U.save("jbxx.work", value, {back: "basic-info.html", button: form.querySelector('button[type="submit"]')});
  });
})();
