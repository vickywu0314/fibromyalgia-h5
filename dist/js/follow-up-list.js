// 随访记录：挂在患者（patientId）下。新增随访 = 为该患者新建一条病例（visitType 随诊），模块录入同新增患者。
const params = new URLSearchParams(location.search);
const name = params.get('name') || '患者';
const patientId = params.get('patientId') || '';
const cardno = params.get('cardno') || '';
patientName.textContent = '当前患者：' + name;

// 随访记录列表：后端列表接口待提供，接入后在这里渲染（每条点击进入该次随访的资料页）
empty.textContent = '暂无随访记录';

addVisit.onclick = () => {
  if (!patientId) { FmsCase.toast('缺少患者 id，请从患者列表进入'); return; }
  sessionStorage.removeItem('fms_patient_prefill'); // 清掉上次新增患者的查重信息，避免显示别人的研究编号
  FmsCase.startFollowUp({ patientId, name, idCard: cardno });
  location.href = './patient-detail.html';
};
