(function(){
  const f = document.querySelector("#sffqForm"), status = document.querySelector("#saveStatus");
  const STORAGE_KEY = "fibromyalgia:sffq";

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
        else el.value = data[name];
      });
    });
  }
  function store(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize())); } catch (e) {}
  }

  try { fill(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch (e) {}
  update();
  window.setFormData = function(data){
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return; } }
    f.reset(); fill(data); update();
  };

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
    const payload = {type: "sffq", data: serialize()};
    store();
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saveForm) window.webkit.messageHandlers.saveForm.postMessage(payload);
    else if (window.Android && typeof window.Android.saveForm === "function") window.Android.saveForm(JSON.stringify(payload));
    else { console.log("[SFFQ]", payload); status.textContent = "问卷已保存在此浏览器"; }
  });
})();
