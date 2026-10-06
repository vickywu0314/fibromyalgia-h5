const createBtn = document.getElementById("createBtn");
const nameInput = document.getElementById("name");
const idInput = document.getElementById("idno");
const nameErr = document.getElementById("nameErr");
const idErr = document.getElementById("idErr");



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
    // 已建档的患者不再新建首诊病例：进入该患者的随访记录，在那里新增随访
    if (existed) {
      const p = result.data;
      const pid = p.patientId ?? p.id ?? '';
      if (window.confirm('该患者已建档（' + (p.name || patientName) + '），将进入其随访记录，可在那里新增随访。')) {
        window.location.href = './follow-up-list.html?' + new URLSearchParams({ patientId: pid, name: p.name || patientName, cardno: p.cardno || p.cardNo || patientId.toUpperCase() });
      }
      return;
    }
    sessionStorage.setItem('fms_patient_prefill', JSON.stringify({
      existed, patient: existed ? result.data : {},
      entered: { name: patientName, cardNo: patientId.toUpperCase() }
    }));
    // 开始新的病例草稿，姓名 / 身份证号带入基本信息页，无需再次输入
    sessionStorage.removeItem('fms_case_from');
    FmsCase.startNew({ name: patientName, idCard: patientId.toUpperCase(), patient: existed ? result.data : {} });
    window.location.href = './fibromyalgia-basic-info/basic-info.html';
  } catch (error) {
    window.alert(error.name === 'AbortError' ? '查询超时，请稍后重试' : error.message);
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = '下一步';
  }
});
