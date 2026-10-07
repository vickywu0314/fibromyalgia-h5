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
    // 饮酒史：每种酒勾选后才出现「每天用量」，取消勾选时清空
    form.querySelectorAll('input[name="drinkType"]').forEach(cb => {
      const amount = document.getElementById(cb.dataset.amount);
      U.toggle(amount && amount.closest(".drink-amount"), cb.checked && !cb.disabled);
    });
  }
  form.addEventListener("change", e => {
    if (e.target.name === "smoking" || e.target.name === "drinking" || e.target.name === "drinkType") update();
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
    sizeCanvas();
    showSignature(typeof d.signature === "string" ? d.signature : "");
  };

  function num(v){
    if (v === undefined || v === null || String(v).trim() === "") return "";
    const n = Number(v);
    return isNaN(n) ? String(v) : n;
  }

  // 患者知情同意告知与签署：电子签字（canvas 手写，存为 PNG dataURL → jbxx.signature）
  const sigPad = document.getElementById("signaturePad");
  const sigCanvas = document.getElementById("signatureCanvas");
  const sigImg = document.getElementById("signatureImg");
  const sigHolder = document.getElementById("signaturePlaceholder");
  const sigClear = document.getElementById("signatureClear");
  let signature = typeof jbxx.signature === "string" ? jbxx.signature : "";
  let drawing = false, drawn = false, last = null;
  const ctx = sigCanvas.getContext("2d");
  function sizeCanvas(){
    const r = sigPad.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    sigCanvas.width = Math.max(1, Math.round(r.width * ratio));
    sigCanvas.height = Math.max(1, Math.round(r.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#222";
    drawn = false;
  }
  function showSignature(src){
    signature = src || "";
    sigImg.hidden = !signature;
    if (signature) sigImg.src = signature; else sigImg.removeAttribute("src");
    sigHolder.hidden = !!signature;
  }
  function pos(e){ const r = sigCanvas.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }
  function readonly(){ return !!(window.FmsCase && FmsCase.isViewMode && FmsCase.isViewMode()); }
  sigCanvas.addEventListener("pointerdown", e => {
    if (readonly() || signature) return;
    e.preventDefault();
    drawing = true; last = pos(e);
    try { sigCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    sigHolder.hidden = true;
    ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2); ctx.fillStyle = "#222"; ctx.fill();
    drawn = true;
  });
  sigCanvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; drawn = true;
  });
  function endStroke(){ drawing = false; }
  sigCanvas.addEventListener("pointerup", endStroke);
  sigCanvas.addEventListener("pointercancel", endStroke);
  sigClear.addEventListener("click", () => {
    if (readonly()) return;
    showSignature("");
    sizeCanvas();
  });
  // 有已保存签名时显示图片（重新签字才清空）；查看模式不可签
  sizeCanvas();
  showSignature(signature);
  if (readonly()) sigClear.hidden = true;
  function currentSignature(){
    if (signature) return signature;
    if (!drawn) return "";
    try { return sigCanvas.toDataURL("image/png"); } catch (e) { return ""; }
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
      // 每种酒每天用量（ml），未勾选的酒类为空串
      baijiuAmount: num(d.baijiuAmount),
      beerAmount: num(d.beerAmount),
      wineAmount: num(d.wineAmount),
      drinkAmount: "",
      signature: currentSignature()
    };
    // drinkAmount（原结构体字段）保留为三种酒每天用量之和，都没填时为空串
    const amounts = [value.baijiuAmount, value.beerAmount, value.wineAmount].filter(v => typeof v === "number");
    if (amounts.length) value.drinkAmount = Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100;
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
