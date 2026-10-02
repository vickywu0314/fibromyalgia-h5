let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
const q = new URLSearchParams(location.search);
const n = prefill.patient?.name || prefill.entered?.name || q.get('name') || '待填写患者';
const code = prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);


const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}
document.querySelectorAll(".module").forEach(x=>x.onclick=()=>tip("进入「"+x.dataset.module+"」录入页面"));
finishBtn.onclick=()=>tip("资料保存功能尚未接入");
