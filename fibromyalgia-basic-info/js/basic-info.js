(function(){
  const U = window.FormUtils;
  const form = document.getElementById("basicInfoForm");
  const nameInput = document.getElementById("name");
  const nameError = document.getElementById("nameError");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");
  const province = document.getElementById("province");
  const city = document.getElementById("city");
  const visitDate = document.getElementById("visitDate");

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
    return /^\d{15}$/.test(value) || /^\d{17}[\dXx]$/.test(value);
  }
  idCard.addEventListener("blur", () => {
    const v = idCard.value.trim();
    const ok = !v || validId(v);
    idCardError.hidden = ok;
    idCard.setAttribute("aria-invalid", String(!ok));
  });
  nameInput.addEventListener("input", () => { if (nameInput.value.trim()) nameError.hidden = true; });

  // 子模块入口：显示完成状态（读草稿 jbxx.<key>.finish），点击直接跳对应 html
  const rows = document.querySelectorAll(".menu-row");
  let done = 0;
  rows.forEach(btn => {
    // 合并疾病 / 合并药物是数组，完成标记分别为 jbxx.diseaseHistoryFinish / concomitantMedicationFinish
    const key = btn.dataset.key;
    const finished = (key === "diseaseHistory" || key === "concomitantMedication")
      ? !!FmsCase.get("jbxx." + key + "Finish")
      : !!(FmsCase.get("jbxx." + key) || {}).finish;
    if (finished) done++;
    const status = btn.querySelector(".status");
    if (status) {
      status.textContent = finished ? "已完成" : "未填写";
      status.classList.toggle("done", finished);
      status.classList.toggle("pending", !finished);
    }
    // 进入子模块前把本页已填内容暂存到草稿（不提交、不改完成状态），返回时能回显
    btn.addEventListener("click", () => { FmsCase.set("jbxx", collect(), true); NativeBridge.openPage(btn.dataset.page); });
  });
  const count = document.getElementById("submoduleCount");
  if (count) count.textContent = done + "/" + rows.length;

  // 回显：草稿 jbxx（姓名 / 身份证号由新增患者页带入；就诊时间默认 jbxx.visitDate）
  function toFormData(j){
    j = Object.assign({}, j || {});
    let types = Array.isArray(j.drinkTypes) ? j.drinkTypes : (typeof j.drinkType === "string" && j.drinkType ? j.drinkType.split(/[、,，]/) : []);
    j.drinkType = types;
    delete j.drinkTypes;
    return j;
  }
  const jbxx = FmsCase.get("jbxx") || {};
  const initial = toFormData(jbxx);
  U.fill(form, initial);
  if (!visitDate.value) visitDate.value = jbxx.visitDate || (FmsCase.load().visitDate || "");
  update();
  renderCities(initial.city || "");
  // 原生回显（保留兼容）
  window.setFormData = function(data){
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { return; } }
    form.reset();
    const d = toFormData(data);
    U.fill(form, d);
    update();
    renderCities(d.city || "");
  };

  function num(v){
    if (v === undefined || v === null || String(v).trim() === "") return "";
    const n = Number(v);
    return isNaN(n) ? String(v) : n;
  }

  // 本页字段（不含 finish）
  function collect(){
    const d = U.serialize(form);
    const drinkTypes = Array.isArray(d.drinkType) ? d.drinkType : (d.drinkType ? [d.drinkType] : []);
    // 隐藏区域的字段也显式写空，避免 merge 时残留旧值
    const value = {
      visitDate: d.visitDate || "",
      name: nameInput.value.trim(),
      idCard: idCard.value.trim().toUpperCase(),
      gender: d.gender || "",
      province: d.province || "",
      city: d.city || "",
      marriage: d.marriage || "",
      education: d.education || "",
      workStatus: d.workStatus || "",
      smoking: d.smoking || "",
      smokingYears: num(d.smokingYears),
      smokingAmount: d.smokingAmount || "",
      drinking: d.drinking || "",
      drinkingYears: num(d.drinkingYears),
      drinkType: drinkTypes.join("、"),
      drinkTypes: drinkTypes,
      drinkAmount: num(d.drinkAmount)
    };
    return value;
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const id = idCard.value.trim();
    if (!name) { nameError.hidden = false; nameInput.focus(); FmsCase.toast("请输入姓名"); return; }
    if (!validId(id)) { idCardError.hidden = false; idCard.focus(); FmsCase.toast("请输入正确的身份证号"); return; }
    const value = Object.assign(collect(), {finish: true});
    // merge：保留 jbxx 下各子模块（csi/tpc/fs/work/bodyComposition/tipi/sffq/treatmentHistory/diseaseHistory/concomitantMedication）
    FmsCase.save("jbxx", value, {merge: true, back: "../patient-detail.html", button: form.querySelector('button[type="submit"]')});
  });
})();
