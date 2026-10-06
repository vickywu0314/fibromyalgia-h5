(function(){
  const U = window.FormUtils;
  const form = document.getElementById("basicInfoForm");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");
  const province = document.getElementById("province");
  const city = document.getElementById("city");
  const STORAGE_KEY = "fibromyalgia:basicInfo";

  // 常住地：省 → 市 两级联动
  const regionMap = {};
  (window.REGIONS || []).forEach(([p, cities]) => {
    regionMap[p] = cities;
    province.add(new Option(p, p));
  });
  function renderCities(keep){
    const cities = regionMap[province.value] || [];
    const prev = keep !== undefined ? keep : city.value;
    city.length = 1;
    cities.forEach(c => city.add(new Option(c, c)));
    city.disabled = !cities.length;
    city.value = cities.indexOf(prev) !== -1 ? prev : (cities.length === 1 ? cities[0] : "");
  }
  province.addEventListener("change", () => renderCities(""));

  // 条件显示：吸烟史 / 饮酒史 选“经常有”才出现追问
  function checked(name){
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function update(){
    U.toggle(document.getElementById("smokingDetail"), checked("smoking") === "经常有");
    U.toggle(document.getElementById("drinkingDetail"), checked("drinking") === "经常有");
  }
  form.addEventListener("change", e => {
    if (e.target.name === "smoking" || e.target.name === "drinking") update();
  });

  function validId(value){
    if (!value) return true;
    return /^\d{15}$/.test(value) || /^\d{17}[\dXx]$/.test(value);
  }
  idCard.addEventListener("blur", () => {
    const ok = validId(idCard.value.trim());
    idCardError.hidden = ok;
    idCard.setAttribute("aria-invalid", String(!ok));
  });

  // 子模块入口：优先原生 openPage，无原生桥时回退为直接跳转对应 html
  document.querySelectorAll(".menu-row").forEach(btn => {
    btn.addEventListener("click", () => NativeBridge.openPage(btn.dataset.page));
  });

  // 回显：本地暂存 / 原生 setFormData
  U.bind({
    form: form,
    key: STORAGE_KEY,
    update: function(data){
      update();
      renderCities(data.city || "");
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validId(idCard.value.trim())) {
      idCardError.hidden = false;
      idCard.focus();
      return;
    }
    const data = U.serialize(form);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (err) {}
    NativeBridge.save({type: "basicInfo", data: data});
  });
})();
