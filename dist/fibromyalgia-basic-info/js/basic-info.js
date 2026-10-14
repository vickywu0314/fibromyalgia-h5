(function(){
  const U = window.FormUtils;
  const form = document.getElementById("basicInfoForm");
  const nameInput = document.getElementById("name");
  const nameError = document.getElementById("nameError");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");
  const phone = document.getElementById("phone");
  const phoneError = document.getElementById("phoneError");
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
    // 是否曾确诊：选「是」才出现确诊时间、确诊医疗机构级别
    U.toggle(document.getElementById("diagnosedDetail"), checked("diagnosed") === "是");
    // 民族：选「其他」才出现填写框
    U.toggle(document.getElementById("nationOtherWrap"), checked("nationType") === "其他");
    // 饮酒史：每种酒勾选后才出现「每天用量」，取消勾选时清空
    form.querySelectorAll('input[name="drinkType"]').forEach(cb => {
      const amount = document.getElementById(cb.dataset.amount);
      U.toggle(amount && amount.closest(".drink-amount"), cb.checked && !cb.disabled);
    });
  }
  form.addEventListener("change", e => {
    if (["smoking", "drinking", "drinkType", "diagnosed", "nationType"].indexOf(e.target.name) !== -1) update();
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
  // 手机号：选填，填了就校验 11 位大陆手机号
  function validPhone(value){
    return /^1[3-9]\d{9}$/.test(value);
  }
  phone.addEventListener("input", () => { phone.value = phone.value.replace(/\D/g, "").slice(0, 11); if (!phone.value || validPhone(phone.value)) phoneError.hidden = true; });
  phone.addEventListener("blur", () => {
    const v = phone.value.trim();
    const ok = !v || validPhone(v);
    phoneError.hidden = ok;
    phone.setAttribute("aria-invalid", String(!ok));
  });
  nameInput.addEventListener("input", () => { if (nameInput.value.trim()) nameError.hidden = true; });

  // 子模块入口：显示完成状态（未填写 / 填写中 / 已完成），点击直接跳对应 html
  //   普通子模块：jbxx.<key> 对象，finish=true 为已完成，有其他已填内容为填写中
  //   合并疾病 / 合并药物：jbxx.<key> 是数组，完成标记分别为 jbxx.diseaseHistoryFinish / concomitantMedicationFinish；
  //   其「无/有」等附属字段（jbxx 下名称含该 key 的字段，如 hasDiseaseHistory）有值也算填写中
  const rows = document.querySelectorAll(".menu-row");
  function entryState(key){
    const j = FmsCase.get("jbxx") || {};
    if (key === "diseaseHistory" || key === "concomitantMedication") {
      const lower = key.toLowerCase();
      const related = Object.keys(j).filter(k => k !== key + "Finish" && k.toLowerCase().indexOf(lower) !== -1).map(k => j[k]);
      return U.entryState(related, !!j[key + "Finish"]);
    }
    const v = j[key];
    return U.entryState(v, !!(v && typeof v === "object" && v.finish));
  }
  // 已完成数：只统计必填子模块；人体成分分析、SFFQ 为选填（data-optional），不计入
  const requiredRows = Array.prototype.filter.call(rows, btn => !btn.dataset.optional);
  let entriesDone = 0;
  function renderEntries(){
    entriesDone = 0;
    rows.forEach(btn => {
      const state = entryState(btn.dataset.key);
      if (state === "done" && !btn.dataset.optional) entriesDone++;
      U.renderStatus(btn.querySelector(".status"), state);
    });
    const count = document.getElementById("submoduleCount");
    if (count) count.textContent = entriesDone + "/" + requiredRows.length;
  }
  rows.forEach(btn => {
    // 进入子模块前把本页已填内容暂存到草稿（不提交、不改完成状态），返回时能回显
    btn.addEventListener("click", async () => {
      // 进入子模块前先把已手写但未上传的签名传上去，草稿里只存图片 URL
      try { await uploadSignature(); } catch (e) { FmsCase.toast(e.message || "签名上传失败"); return; }
      FmsCase.set("jbxx", collect(), true); NativeBridge.openPage(btn.dataset.page);
    });
  });
  renderEntries();

  // 回显：草稿 jbxx（姓名 / 身份证号由新增患者页带入；就诊时间默认 jbxx.visitDate）
  function toFormData(j){
    j = Object.assign({}, j || {});
    let types = Array.isArray(j.drinkTypes) ? j.drinkTypes : (typeof j.drinkType === "string" && j.drinkType ? j.drinkType.split(/[、,，]/) : []);
    j.drinkType = types;
    delete j.drinkTypes;
    // 民族：jbxx.nation 为「汉族」或具体民族名 → 拆成单选 + 其他填写框
    const nation = typeof j.nation === "string" ? j.nation.trim() : "";
    j.nationType = !nation ? "" : nation === "汉族" ? "汉族" : "其他";
    j.nationOther = nation && nation !== "汉族" ? nation : "";
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
    showSignature(typeof d.signature === "string" && !/^data:/.test(d.signature) ? d.signature : "");
    tracker.refresh();
  };

  function num(v){
    if (v === undefined || v === null || String(v).trim() === "") return "";
    const n = Number(v);
    return isNaN(n) ? String(v) : n;
  }

  // 患者知情同意告知与签署：电子签字（canvas 手写 → 上传 /api/upload/image → jbxx.signature 存图片 URL）
  const sigPad = document.getElementById("signaturePad");
  const sigCanvas = document.getElementById("signatureCanvas");
  const sigImg = document.getElementById("signatureImg");
  const sigHolder = document.getElementById("signaturePlaceholder");
  const sigClear = document.getElementById("signatureClear");
  // 旧草稿里的 base64 签名不再使用，需重新签字
  let signature = typeof jbxx.signature === "string" && !/^data:/.test(jbxx.signature) ? jbxx.signature : "";
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
  // 提交和草稿里只放已上传的签名 URL
  function currentSignature(){ return signature; }
  // 手写了但还没上传时，把画布转成 PNG 上传，成功后显示为图片
  let sigUploading = null;
  function uploadSignature(){
    if (signature || !drawn || readonly()) return Promise.resolve(signature);
    if (!sigUploading) {
      sigUploading = FmsUpload.canvasToBlob(sigCanvas)
        .then(blob => FmsUpload.image(blob, {compress: false, filename: "signature.png"}))
        .then(url => { showSignature(url); drawn = false; tracker.refresh(); return url; })
        .finally(() => { sigUploading = null; });
    }
    return sigUploading;
  }

  // 进度：本页直填字段（可见、可用的题目，含电子签名）+ 已完成的子模块入口
  //   分子 = 已填直填字段 + 已完成入口数；分母 = 当前应填直填字段 + 入口总数
  const tracker = FmsProgress.track(form, {
    extra: () => ({answered: entriesDone + (signature || drawn ? 1 : 0), total: requiredRows.length + 1})
  });
  sigCanvas.addEventListener("pointerup", () => tracker.refresh());
  sigClear.addEventListener("click", () => tracker.refresh());
  // 从子模块返回（含 bfcache 恢复）时刷新入口状态与进度
  window.addEventListener("pageshow", () => { renderEntries(); tracker.refresh(); });

  // 本页字段（不含 finish）
  function collect(){
    const d = U.serialize(form);
    const drinkTypes = Array.isArray(d.drinkType) ? d.drinkType : (d.drinkType ? [d.drinkType] : []);
    // 隐藏区域的字段也显式写空，避免 merge 时残留旧值
    const value = {
      visitDate: d.visitDate || "",
      name: nameInput.value.trim(),
      idCard: idCard.value.trim().toUpperCase(),
      phone: phone.value.trim(),
      gender: d.gender || "",
      // 民族：选汉族为「汉族」，选其他为填写的民族名
      nation: d.nationType === "汉族" ? "汉族" : d.nationType === "其他" ? String(d.nationOther || "").trim() : "",
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
      // 与病史病情页共用的 jbxx 字段；未选「是」时确诊时间、机构级别写空
      painOnsetDate: d.painOnsetDate || "",
      diagnosed: d.diagnosed || "",
      diagnosisDate: d.diagnosed === "是" ? (d.diagnosisDate || "") : "",
      hospitalLevel: d.diagnosed === "是" ? (d.hospitalLevel || "") : "",
      signature: currentSignature()
    };
    // drinkAmount（原结构体字段）保留为三种酒每天用量之和，都没填时为空串
    const amounts = [value.baijiuAmount, value.beerAmount, value.wineAmount].filter(v => typeof v === "number");
    if (amounts.length) value.drinkAmount = Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100;
    return value;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const id = idCard.value.trim();
    if (!name) { nameError.hidden = false; nameInput.focus(); FmsCase.toast("请输入姓名"); return; }
    if (!validId(id)) { idCardError.hidden = false; idCard.focus(); FmsCase.toast("请输入正确的身份证号"); return; }
    if (phone.value.trim() && !validPhone(phone.value.trim())) { phoneError.hidden = false; phone.focus(); FmsCase.toast("请输入正确的手机号"); return; }
    if (checked("nationType") === "其他" && !document.getElementById("nationOther").value.trim()) { document.getElementById("nationOther").focus(); FmsCase.toast("请填写民族"); return; }
    const btn = form.querySelector('button[type="submit"]');
    if (drawn && !signature) {
      btn.disabled = true;
      FmsCase.toast("签名上传中…");
      try { await uploadSignature(); }
      catch (err) { FmsCase.toast(err.message || "签名上传失败，请重试"); return; }
      finally { btn.disabled = false; }
    }
    const value = Object.assign(collect(), {finish: true});
    // merge：保留 jbxx 下各子模块（csi/tpc/fs/work/bodyComposition/tipi/sffq/treatmentHistory/diseaseHistory/concomitantMedication）
    FmsCase.save("jbxx", value, {merge: true, back: "../patient-detail.html", button: form.querySelector('button[type="submit"]')});
  });
})();
