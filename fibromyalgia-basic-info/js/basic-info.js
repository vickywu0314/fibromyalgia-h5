(function(){
  const form = document.getElementById("basicInfoForm");
  const diagnosisDetail = document.getElementById("diagnosisDetail");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");
  const submitBtn = form.querySelector('button[type="submit"]');

  // 表单字段名 → 接口 jbxx 字段名
  const FIELDS = {
    name: "name", idCard: "cardNo", phone: "mobile", gender: "gender", province: "province",
    marriage: "marry", education: "education", workStatus: "workStatus",
    smoking: "smoking", smokingYears: "smokingYears", smokingAmount: "smokingAmount",
    drinking: "drinking", drinkingYears: "drinkingYears", drinkType: "drinkType", drinkAmount: "drinkAmount",
    painOnsetDate: "painOnsetDate", diagnosed: "diagnosed", diagnosisDate: "diagnosisDate", hospitalLevel: "hospitalLevel"
  };
  // 子模块入口：页面地址和在 jbxx.ext 中的字段
  const SUBPAGES = {
    "treatment-history": ["../benbing-zhiliaoshi/benbing-zhiliaoshi.html", "benbingTreatment"],
    "disease-history": ["../jiwang-bingshi/index.html", "pastDiseases"],
    "concomitant-medication": ["../hebing-yaowu/index.html", "concomitantDrugs"],
    "csi": ["csi.html", "csi9"],
    "work": ["work.html", "work"],
    "body": ["body-composition.html", "bodyComposition"],
    "tipi": ["tipi.html", "tipi"],
    "sffq": ["sffq.html", "sffq"],
    "tpc": ["tpc.html", "tpc"],
    "fs": ["fs.html", "fs"]
  };

  function toggleDiagnosis(){
    diagnosisDetail.hidden = form.querySelector('input[name="diagnosed"]:checked')?.value !== "是";
    diagnosisDetail.querySelectorAll("input,select").forEach(x => x.disabled = diagnosisDetail.hidden);
  }

  function fill(){
    const s = FmsCase.state();
    const data = { visitDate: s.visitDate };
    for (const [field, key] of Object.entries(FIELDS)) data[field] = s.jbxx[key] ?? "";
    FmsCase.fillForm(form, data);
    toggleDiagnosis();
  }

  function apply(s){
    const data = FmsCase.readForm(form);
    if (data.visitDate) s.visitDate = data.visitDate;
    for (const [field, key] of Object.entries(FIELDS)) s.jbxx[key] = data[field] ?? "";
    s.jbxx.cardNo = s.jbxx.cardNo.toUpperCase();
  }

  function renderStatus(){
    const ext = FmsCase.state().jbxx.ext;
    let done = 0;
    document.querySelectorAll(".menu-row").forEach(btn => {
      const status = FmsCase.status(ext[SUBPAGES[btn.dataset.page][1]]);
      if (status === "done") done++;
      const tag = btn.querySelector(".status");
      tag.className = "status " + (status === "done" ? "done" : "pending");
      tag.textContent = FmsCase.statusText[status];
    });
    document.getElementById("submoduleCount").textContent = done + "/" + Object.keys(SUBPAGES).length;
  }

  fill();
  renderStatus();
  // 从子页面后退回来时页面可能来自缓存，需要重新读取子模块状态。
  addEventListener("pageshow", e => { if (e.persisted) renderStatus(); });

  // 填写过程中随时暂存到本地草稿，进出子页面不丢失；点保存时才提交接口。
  form.addEventListener("change", () => { toggleDiagnosis(); FmsCase.patch(apply); });
  form.addEventListener("input", () => FmsCase.patch(apply));

  function validId(value){
    if (!value) return true;
    return /^\d{15}$/.test(value) || /^\d{17}[\dXx]$/.test(value);
  }
  idCard.addEventListener("blur", () => {
    const ok = validId(idCard.value.trim());
    idCardError.hidden = ok;
    idCard.setAttribute("aria-invalid", String(!ok));
  });

  document.querySelectorAll(".menu-row").forEach(btn => {
    btn.addEventListener("click", () => {
      FmsCase.patch(apply);
      location.href = SUBPAGES[btn.dataset.page][0];
    });
  });

  document.getElementById("signatureBtn").addEventListener("click", () => {
    // 签字板建议由 App 原生或后续独立 H5 签名组件接管。
    NativeBridge.openPage("signature");
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.elements.name.value.trim()) {
      window.alert("请输入姓名");
      form.elements.name.focus();
      return;
    }
    if (!idCard.value.trim() || !validId(idCard.value.trim())) {
      idCardError.hidden = false;
      idCard.focus();
      return;
    }
    FmsCase.run(submitBtn, async () => {
      await FmsCase.save("jbxx", s => { apply(s); s.jbxx.finish = true; });
      FmsCase.back("../patient-detail.html");
    });
  });
})();
