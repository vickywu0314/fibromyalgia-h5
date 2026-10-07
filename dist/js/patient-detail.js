let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
const q = new URLSearchParams(location.search);
const n = prefill.patient?.name || prefill.entered?.name || q.get('name') || '待填写患者';
const code = prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);


const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}
document.querySelectorAll(".module").forEach(x=>x.onclick=()=>tip("进入「"+x.dataset.module+"」录入页面"));
finishBtn.onclick=()=>tip("资料保存功能尚未接入");

// 病情评估：根据各量表自动保存的完成情况显示状态（✓ 全部完成 / x/9 部分完成）
(function(){
  const link=document.querySelector('a.module[href="bingqing-pinggu/index.html"]');
  if(!link) return;
  function render(){
    let status={};
    try{status=JSON.parse(localStorage.getItem('bingqing_status')||'{}')||{};}catch{}
    const total=9;
    const done=Object.values(status).filter(s=>s&&s.total&&s.answered>=s.total).length;
    const started=Object.values(status).some(s=>s&&s.answered>0);
    const state=link.querySelector('.state');
    if(done>=total){state.textContent='✓';state.title='已完成';}
    else if(started){state.textContent=done+'/'+total;state.title='部分完成';}
    else{state.textContent='○';state.title='未填写';}
  }
  render();
  window.addEventListener('pageshow',render);
})();
