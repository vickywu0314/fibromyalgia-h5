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

  document.querySelectorAll(".menu-row").forEach(btn => {
    btn.addEventListener("click", () => NativeBridge.openPage(btn.dataset.page));
  });

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