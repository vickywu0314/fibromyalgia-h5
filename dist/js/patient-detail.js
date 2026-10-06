// 患者资料（本次病例）：模块完成状态取自病例草稿，完成后整体提交。
const draft = FmsCase.load();
let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
const q = new URLSearchParams(location.search);
const n = draft.jbxx.name || prefill.patient?.name || prefill.entered?.name || q.get('name') || '待填写患者';
const code = prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);

const modules = [...document.querySelectorAll('.module[data-part]')];
let done = 0;
modules.forEach(m => {
  const finished = !!(draft[m.dataset.part] && draft[m.dataset.part].finish);
  if (finished) done++;
  const state = m.querySelector('.state');
  state.classList.toggle('done', finished);
  state.textContent = finished ? '✓' : '○';
});
progressNum.textContent = done + ' / ' + modules.length;
progressBar.style.width = (done / modules.length * 100).toFixed(1) + '%';

finishBtn.onclick = async () => {
  const missing = modules.filter(m => !(draft[m.dataset.part] && draft[m.dataset.part].finish))
    .map(m => FmsCase.PART_NAMES[m.dataset.part]);
  if (missing.length && !confirm('以下模块尚未完成：\n' + missing.join('、') + '\n\n确定提交本次资料吗？')) return;
  finishBtn.disabled = true;
  finishBtn.textContent = '正在提交…';
  try {
    FmsCase.set('page', 1);
    await FmsCase.submit('all');
    FmsCase.clear();
    sessionStorage.removeItem('fms_patient_prefill');
    FmsCase.toast('本次资料已提交');
    setTimeout(() => { location.href = './patient-list.html'; }, 600);
  } catch (e) {
    FmsCase.toast(e.message || '提交失败，请稍后重试');
    finishBtn.disabled = false;
    finishBtn.textContent = '完成本次资料录入';
  }
};
