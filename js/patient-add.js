const createBtn = document.getElementById("createBtn");
const nameInput = document.getElementById("name");
const idInput = document.getElementById("idno");
const nameErr = document.getElementById("nameErr");
const idErr = document.getElementById("idErr");



// TODO 新建患者接口待定，暂时跳过：已有患者沿用其 id，新患者先不带 patientId，
// 由 /api/fms/patient/case/add 保存基本信息时按姓名和身份证号建档。
async function createPatient({ patient }) {
  return { id: patient ? (patient.id ?? patient.patientId ?? null) : null };
}

function validID(v) {
  return /^\d{17}[\dXx]$/.test(v);
}

createBtn.addEventListener("click", async function () {
  if (createBtn.disabled) return;
  const patientName = nameInput.value.trim();
  const patientId = idInput.value.trim();

  const nameOK = patientName.length > 0;
  const idOK = validID(patientId);

  nameInput.classList.toggle("error", !nameOK);
  nameErr.style.display = nameOK ? "none" : "block";

  idInput.classList.toggle("error", !idOK);
  idErr.style.display = idOK ? "none" : "block";

  if (!nameOK || !idOK) return;

  createBtn.disabled = true;
  createBtn.textContent = '正在查询患者…';
  try {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    const result = await FmsApi.get('/api/fms/patient/get/cardno', {
      name: patientName, cardno: patientId.toUpperCase(), doctorId
    });
    // 查重失败不能自动解释为患者不存在；成功且无数据时才继续新建。
    if (result.success === false) throw new Error(result.message || '暂时无法确认患者是否存在，请稍后重试');
    const existed = !!(result.data && typeof result.data === 'object' && !Array.isArray(result.data) && Object.keys(result.data).length);
    const patient = existed ? result.data : null;
    const created = await createPatient({ name: patientName, cardNo: patientId.toUpperCase(), patient });
    FmsCase.start({ name: patientName, cardNo: patientId.toUpperCase(), patientId: created.id, patient });
    window.location.href = './patient-detail.html';
  } catch (error) {
    window.alert(error.name === 'AbortError' ? '查询超时，请稍后重试' : error.message);
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = '创建患者档案';
  }
});
