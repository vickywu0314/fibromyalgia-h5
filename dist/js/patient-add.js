const createBtn = document.getElementById("createBtn");
const nameInput = document.getElementById("name");
const idInput = document.getElementById("idno");
const nameErr = document.getElementById("nameErr");
const idErr = document.getElementById("idErr");



const existNotice = document.getElementById("existNotice");

function showExisting(p, enteredName, cardNo) {
  const name = p.name || p.patientName || enteredName;
  const masked = cardNo.slice(0, 6) + '********' + cardNo.slice(-4);
  existNotice.querySelector('.exist-who').textContent = name + '（' + masked + '）';
  existNotice.querySelector('#backToList').href = './patient-list.html?' + new URLSearchParams({ keyword: name });
  // 直接进入该患者的随访记录，在那里「新增随访记录」录入病情变化；查不到患者 id 时退回患者列表
  const pid = p.patientId ?? p.id ?? '';
  existNotice.querySelector('#goFollowUp').href = pid !== ''
    ? './follow-up-list.html?' + new URLSearchParams({ patientId: pid, name, cardno: p.cardno || p.cardNo || cardNo })
    : './patient-list.html?' + new URLSearchParams({ keyword: name });
  existNotice.hidden = false;
  existNotice.querySelector('#goFollowUp').focus();
}

// 弹框：点「取消」、遮罩或按 Esc 关闭，可修改身份证号后重新查询
function closeExisting() {
  existNotice.hidden = true;
  idInput.focus();
}
document.getElementById('existClose').addEventListener('click', closeExisting);
existNotice.addEventListener('click', e => { if (e.target === existNotice) closeExisting(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !existNotice.hidden) closeExisting(); });

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
    // 身份证号已建档：不再新建，弹框提示「当前患者已经存在」，引导到该患者的随访记录中增加病情变化
    if (existed) {
      showExisting(result.data, patientName, patientId.toUpperCase());
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
