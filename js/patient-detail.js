const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}

// 各模块的完成状态取自本次录入草稿中对应分块的 finish。
function render() {
  const s = FmsCase.state();
  const n = s.jbxx.name || '待填写患者';
  pname.textContent = n; avatar.textContent = n.slice(-1);
  pid.textContent = '研究编号 ' + (s.researchNo || '待分配');
  const modules = [...document.querySelectorAll('.module[data-part]')];
  let done = 0;
  for (const module of modules) {
    const finished = !!s[module.dataset.part]?.finish;
    if (finished) done++;
    const state = module.querySelector('.state');
    state.classList.toggle('done', finished);
    state.textContent = finished ? '✓' : '○';
  }
  progressNum.textContent = done + ' / ' + modules.length;
  progressBar.style.width = (done / modules.length * 100) + '%';
}
render();
// 从子页面后退回来时页面可能来自缓存，需要重新读取草稿。
addEventListener('pageshow', e => { if (e.persisted) render(); });
finishBtn.onclick=()=>tip("资料保存功能尚未接入");
