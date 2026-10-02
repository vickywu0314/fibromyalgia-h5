const createBtn = document.getElementById("createBtn");
const nameInput = document.getElementById("name");
const idInput = document.getElementById("idno");
const nameErr = document.getElementById("nameErr");
const idErr = document.getElementById("idErr");



function validID(v) {
  return /^\d{17}[\dXx]$/.test(v);
}

createBtn.addEventListener("click", function () {
  const patientName = nameInput.value.trim();
  const patientId = idInput.value.trim();

  const nameOK = patientName.length > 0;
  const idOK = validID(patientId);

  nameInput.classList.toggle("error", !nameOK);
  nameErr.style.display = nameOK ? "none" : "block";

  idInput.classList.toggle("error", !idOK);
  idErr.style.display = idOK ? "none" : "block";

  if (!nameOK || !idOK) return;

  window.location.href = "./patient-detail.html";
});
