(function(){
  const form = document.getElementById("basicInfoForm");
  const diagnosisDetail = document.getElementById("diagnosisDetail");
  const smokingDetail = document.getElementById("smokingDetail");
  const drinkingDetail = document.getElementById("drinkingDetail");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");
  const province = document.getElementById("province");
  const city = document.getElementById("city");
  const submoduleCount = document.getElementById("submoduleCount");

  // 显示/隐藏条件区域，隐藏时禁用并清空其中的输入，避免提交无效数据
  function toggleSection(section, show){
    section.hidden = !show;
    section.querySelectorAll("input,select").forEach(x => {
      x.disabled = !show;
      if (show) return;
      if (x.type === "radio" || x.type === "checkbox") x.checked = false;
      else x.value = "";
    });
  }
  function setInput(input, enabled){
    input.disabled = !enabled;
    if (!enabled) input.value = "";
  }

  // 是否曾确诊 → 确诊时间 / 确诊医疗机构级别
  document.querySelectorAll('input[name="diagnosed"]').forEach(el => {
    el.addEventListener("change", () => toggleSection(diagnosisDetail, el.value === "是"));
  });

  // 吸烟史：经常有 → 年数 + 每日支数
  document.querySelectorAll('input[name="smoking"]').forEach(el => {
    el.addEventListener("change", () => {
      const regular = el.value === "经常有";
      setInput(document.getElementById("smokingYears"), regular);
      toggleSection(smokingDetail, regular);
    });
  });

  // 饮酒史：经常有 → 年数 + 酒类（多选），每种酒类各自填写每天用量
  function syncDrinkAmount(box){
    setInput(document.getElementById(box.dataset.amount), box.checked && !box.disabled);
  }
  document.querySelectorAll('input[name="drinking"]').forEach(el => {
    el.addEventListener("change", () => {
      const regular = el.value === "经常有";
      setInput(document.getElementById("drinkingYears"), regular);
      toggleSection(drinkingDetail, regular);
      drinkingDetail.querySelectorAll('input[name="drinkType"]').forEach(syncDrinkAmount);
    });
  });
  drinkingDetail.querySelectorAll('input[name="drinkType"]').forEach(box => {
    box.addEventListener("change", () => syncDrinkAmount(box));
  });

  // 常住地：省 → 市 二级联动
  const regions = window.REGION_DATA || [];
  regions.forEach(p => province.add(new Option(p.name, p.name)));
  province.addEventListener("change", () => {
    city.length = 1;
    const item = regions.find(p => p.name === province.value);
    city.disabled = !item;
    if (!item) return;
    item.cities.forEach(c => city.add(new Option(c, c)));
    if (item.cities.length === 1) city.value = item.cities[0];
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

  // 子模块入口及完成数
  const rows = [...document.querySelectorAll(".submodule-row")];
  function updateCount(){
    const done = rows.filter(r => r.querySelector(".status.done")).length;
    submoduleCount.textContent = done + "/" + rows.length;
  }
  rows.forEach(btn => {
    btn.addEventListener("click", () => NativeBridge.openPage(btn.dataset.page));
  });
  // 供原生 App 在子模块保存后回调：BasicInfoPage.setSubmoduleStatus("csi", true)
  window.BasicInfoPage = {
    setSubmoduleStatus: function(page, done){
      const row = rows.find(r => r.dataset.page === page);
      const status = row && row.querySelector(".status");
      if (!status) return;
      status.classList.toggle("done", !!done);
      status.classList.toggle("pending", !done);
      status.textContent = done ? "已填写" : "未填写";
      updateCount();
    }
  };
  updateCount();

  document.getElementById("signatureBtn").addEventListener("click", () => {
    // 签字板建议由 App 原生或后续独立 H5 签名组件接管。
    NativeBridge.openPage("signature");
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!validId(idCard.value.trim())) {
      idCardError.hidden = false;
      idCard.focus();
      return;
    }
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.drinkType = fd.getAll("drinkType");
    NativeBridge.save({type:"basicInfo", data});
  });
})();
