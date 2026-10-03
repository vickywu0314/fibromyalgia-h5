(function(){
  const form = document.getElementById("basicInfoForm");
  const diagnosisDetail = document.getElementById("diagnosisDetail");
  const idCard = document.getElementById("idCard");
  const idCardError = document.getElementById("idCardError");

  document.querySelectorAll('input[name="diagnosed"]').forEach(el => {
    el.addEventListener("change", () => {
      diagnosisDetail.hidden = el.value !== "是";
      diagnosisDetail.querySelectorAll("input,select").forEach(x => x.disabled = diagnosisDetail.hidden);
    });
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

  // 查看模式（URL 带 mode=view）：子模块打开对应 H5 查看页，并带上该子模块的数据（jbxx 中的同名字段）。
  const SUB_VIEWS = {
    "treatment-history": ["treatmentHistory", "../benbing-zhiliaoshi/kaiyao-huizong.html"],
    "disease-history": ["diseaseHistory", "../jiwang-bingshi/view.html"],
    "concomitant-medication": ["concomitantMedication", "../hebing-yaowu/view.html"],
    "csi": ["csi", "csi.html"],
    "work": ["work", "work.html"],
    "body": ["bodyComposition", "body-composition.html"],
    "tipi": ["tipi", "tipi.html"],
    "sffq": ["sffq", "sffq.html"],
    "tpc": ["tpc", "tpc.html"],
    "fs": ["fs", "fs.html"]
  };
  const viewing = window.CaseView && CaseView.context().isView;

  document.querySelectorAll(".menu-row").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!viewing) return NativeBridge.openPage(btn.dataset.page);
      const [key, url] = SUB_VIEWS[btn.dataset.page];
      CaseView.openView(url, "jbxx." + key, CaseView.data ? (CaseView.data[key] ?? {}) : undefined);
    });
  });

  // 查看模式下按数据标记子模块「已填写 / 未填写」。
  window.basicInfoSubStatus = function(data){
    let done = 0;
    document.querySelectorAll(".menu-row").forEach(btn => {
      const filled = !CaseView.isEmpty(data[SUB_VIEWS[btn.dataset.page][0]]);
      const status = btn.querySelector(".status");
      status.textContent = filled ? "已填写" : "未填写";
      status.classList.toggle("pending", !filled);
      status.classList.toggle("done", filled);
      if (filled) done++;
    });
    document.querySelector(".submodule-count strong").textContent = done + "/" + Object.keys(SUB_VIEWS).length;
  };

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
    const data = Object.fromEntries(new FormData(form).entries());
    NativeBridge.save({type:"basicInfo", data});
  });
})();