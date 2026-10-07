(function(){
  const U = window.FormUtils;
  const form = document.getElementById("tipiForm");

  // TIPI 计分（Gosling 2003；中国版 TIPI-C 同）：每题 1~7 分，反向题记 8 - x，
  // 每个维度 = (正向题 + 反向题) / 2，范围 1~7：
  //   外向性 1、6R；宜人性 2R、7；尽责性 3、8R；情绪稳定性 4R、9；开放性 5、10R
  // 无公认二分判定，result 留空；score（总分）留空，仅给五个维度分。
  const DIMS = {
    extraversion: [1, -6],
    agreeableness: [-2, 7],
    conscientiousness: [3, -8],
    emotionalStability: [-4, 9],
    openness: [5, -10]
  };

  function answer(i){
    const el = form.querySelector('input[name="q' + i + '"]:checked');
    return el ? Number(el.value) : null;
  }

  U.bind({form: form, path: "jbxx.tipi"});
  // 进度：已答题数 / 10；作答中暂存草稿（入口显示「填写中」）
  const tracker = FmsProgress.track(form);
  U.autoStore(form, "jbxx.tipi", () => {
    const answers = {};
    for (let i = 1; i <= 10; i++) { const v = answer(i); answers["q" + i] = v == null ? "" : String(v); }
    return {score: "", result: "", answers: answers};
  });
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const answers = {};
    let missing = 0;
    for (let i = 1; i <= 10; i++) {
      const v = answer(i);
      answers["q" + i] = v == null ? "" : String(v);
      if (v == null) missing++;
    }
    if (missing) { FmsCase.toast("请完成全部 10 道题目"); return; }
    const value = {finish: true, score: "", result: "", answers: answers};
    Object.keys(DIMS).forEach(k => {
      const sum = DIMS[k].reduce((s, q) => s + (q > 0 ? answer(q) : 8 - answer(-q)), 0);
      value[k] = String(sum / 2);
    });
    U.save("jbxx.tipi", value, {back: "basic-info.html", button: form.querySelector('button[type="submit"]')});
  });
})();
