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
  // 已保存且已成功提交到后端才算完成；本地有未提交的改动时显示「待同步」
  const saved = !!(draft[m.dataset.part] && draft[m.dataset.part].finish);
  const finished = saved && FmsCase.isSynced(m.dataset.part);
  if (finished) done++;
  const state = m.querySelector('.state');
  state.classList.toggle('done', finished);
  state.textContent = finished ? '✓' : '○';
  if (saved && !finished) state.title = '有改动尚未提交，点击完成录入时会自动提交';
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
    // 按模块逐个提交（part 为各模块 key），不再使用汇总的 part
    await FmsCase.syncAll((i, total) => { finishBtn.textContent = '正在提交 ' + i + '/' + total + '…'; });
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
