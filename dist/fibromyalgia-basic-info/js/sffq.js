(function(){
  const f = document.querySelector("#sffqForm"), status = document.querySelector("#saveStatus");
  const PATH = "jbxx.sffq";

  function value(name){
    const el = f.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  // 条件显示：隐藏时禁用并清空，避免脏数据
  function toggle(el, show){
    if (!el) return;
    el.hidden = !show;
    if (el.classList.contains("extra")) el.classList.toggle("visible", show);
    el.querySelectorAll("input").forEach(x => {
      x.disabled = !show;
      if (!show) { if (x.type === "radio" || x.type === "checkbox") x.checked = false; else x.value = ""; }
    });
  }
  function update(){
    toggle(document.querySelector("#dhaProducts"), value("dha_used") === "有");
    toggle(document.querySelector("#otherFoods"), value("other_food_used") === "有");
    // “5两以上 / 4个以上 / 大于500ml / 其他用量 / 其他产品”选中后才出现数字或文本输入
    f.querySelectorAll(".extra[data-for]").forEach(label => {
      toggle(label, value(label.dataset.for) === label.dataset.when);
    });
  }
  function serialize(){
    const d = {};
    for (const [k, v] of new FormData(f).entries()) d[k] = v;
    return d;
  }
  function fill(data){
    if (!data) return;
    Object.keys(data).forEach(name => {
      const els = f.querySelectorAll('[name="' + name + '"]');
      els.forEach(el => {
        if (el.type === "radio" || el.type === "checkbox") el.checked = el.value === String(data[name]);
        else if (data[name] != null && typeof data[name] !== "object") el.value = data[name];
      });
    });
  }
  // 问卷较长：作答过程中暂存到病例草稿（只写草稿不提交，完成状态沿用原值），点保存时才提交
  let storeTimer = null;
  function store(){
    clearTimeout(storeTimer);
    storeTimer = setTimeout(() => {
      const prev = FmsCase.get(PATH) || {};
      try { FmsCase.set(PATH, {finish: !!prev.finish, score: "", result: "", answers: serialize()}); } catch (e) {}
    }, 300);
  }

  const saved = FmsCase.get(PATH);
  fill(saved && saved.answers);
  update();
  window.setFormData = function(data){
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return; } }
    f.reset(); fill(data); update();
  };

  // 进度：当前可见的题目（DHA「有」后的品牌/剂量、选中「其他/以上」后的数量输入等条件题出现才计入）中已答数；
  // 「其他食物」选「有」后，5 行食物名称/重量合计一题：至少一行填写完整且没有只填一半的行才算已答
  const otherRows = [...f.querySelectorAll(".other-food-row")];
  const otherNames = otherRows.flatMap(r => [...r.querySelectorAll("input")].map(x => x.name));
  const tracker = FmsProgress.track(f, {optional: otherNames, extra: () => {
    if (value("other_food_used") !== "有") return {answered: 0, total: 0};
    const filled = otherRows.filter(r => [...r.querySelectorAll("input")].some(x => x.value.trim()));
    const ok = filled.length && filled.every(r => [...r.querySelectorAll("input")].every(x => x.value.trim()));
    return {answered: ok ? 1 : 0, total: 1};
  }});
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };

  f.addEventListener("change", () => { update(); store(); });
  f.addEventListener("input", store);
  f.addEventListener("submit", e => {
    e.preventDefault();
    for (const label of f.querySelectorAll(".extra.visible")) {
      const input = label.querySelector("input");
      if (!input.value || !input.checkValidity()) { input.focus(); status.textContent = "请填写所选项的具体数量/名称"; return; }
    }
    if (value("other_food_used") === "有") {
      const rows = [...f.querySelectorAll(".other-food-row")];
      const filled = rows.filter(r => [...r.querySelectorAll("input")].some(x => x.value.trim()));
      const bad = filled.find(r => [...r.querySelectorAll("input")].some(x => !x.value.trim()));
      if (!filled.length || bad) {
        status.textContent = "请填写食物名称与重量";
        ((bad || rows[0]).querySelector("input:placeholder-shown") || rows[0].querySelector("input")).focus();
        return;
      }
    }
    status.textContent = "";
    clearTimeout(storeTimer);
    // SFFQ 无标准总分及判定，score / result 留空，answers 保存全部作答
    FmsCase.save(PATH, {finish: true, score: "", result: "", answers: serialize()}, {back: "basic-info.html", button: f.querySelector('button[type="submit"]')});
  });
})();
