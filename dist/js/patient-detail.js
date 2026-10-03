// 随诊录入入口：新患者（新增患者流程）、老患者新增随访、修改已有随诊都进入这里。
// URL 参数：patientId、caseId（修改时）、name、t（一次录入的标识，返回本页时用于保留已生成的随诊 ID）。
// 新增患者流程从 sessionStorage.fms_patient_prefill 取查重结果。接口说明见 docs/api/case-add.md。
let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
const q = new URLSearchParams(location.search);
const existed = prefill.existed && prefill.patient && prefill.patient.id;
const fromAdd = !q.get('patientId') && prefill.entered;
const ctx = CaseEdit.start({
  token: q.get('t') || (fromAdd ? 'add:' + (prefill.entered.cardNo || '') : 'detail'),
  patientId: q.get('patientId') || (existed ? prefill.patient.id : null),
  caseId: q.get('caseId') || null,
  name: q.get('name') || prefill.patient?.name || prefill.entered?.name || '',
  newPatient: fromAdd && !existed ? { name: prefill.entered.name, idCard: prefill.entered.cardNo } : null
});
const n = ctx.name || '待填写患者';
const code = prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);

const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}

// 按已保存的数据标记模块完成情况。
async function refreshStatus() {
  const current = CaseEdit.context();
  const modules = [...document.querySelectorAll('.module[data-part]')];
  let data = {};
  if (current && current.caseId && current.patientId) {
    try { data = await CaseView.fetchParts(current.patientId, current.caseId, CaseView.ALL_PARTS); }
    catch (error) { tip('完成情况加载失败：' + error.message); }
  }
  let done = 0;
  modules.forEach(link => {
    const filled = !CaseView.isEmpty(data[link.dataset.part]);
    const state = link.querySelector('.state');
    state.textContent = filled ? '✓' : '○';
    state.classList.toggle('done', filled);
    if (filled) done++;
  });
  document.getElementById('progressNum').textContent = `${done} / ${modules.length}`;
  document.getElementById('progressBar').style.width = (done / modules.length * 100) + '%';
}

// 新患者没有患者 ID 时，必须先保存基本信息（后端据此建档）。
document.querySelectorAll('.module[data-part]').forEach(link => link.addEventListener('click', event => {
  const current = CaseEdit.context();
  if (!current.patientId && link.dataset.part !== 'jbxx') { event.preventDefault(); tip('新患者请先填写并保存基本信息'); }
}));

document.getElementById('history').onclick = () => {
  const current = CaseEdit.context();
  if (!current.patientId) return tip('新患者暂无随访记录');
  location.href = './follow-up-list.html?' + new URLSearchParams({ id: current.patientId, name: current.name });
};
finishBtn.onclick = () => {
  const current = CaseEdit.context();
  if (!current.caseId) return tip('请至少保存一个模块');
  location.href = './follow-up-list.html?' + new URLSearchParams({ id: current.patientId, name: current.name || n });
};

// 从模块页返回（含浏览器后退缓存）时刷新完成情况。
window.addEventListener('pageshow', refreshStatus);
