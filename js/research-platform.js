const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1600)}
enterBtn.onclick=()=>{const v=serial.value.trim();tip(v?`正在进入研究：${v}`:"请选择下方数据库，或输入研究序列号")};
serial.addEventListener("keydown",e=>{if(e.key==="Enter")enterBtn.click()});
// 点击纤维肌痛入口时先请求患者列表，带着数据跳转；预取失败也照常跳转，由列表页自行重试。
let entering=false;
async function enterFibro(){
  if(entering)return;entering=true;tip("正在加载患者列表…");
  try{const doctorId=FmsApi.getDoctorId();if(doctorId)FmsApi.savePatientListPrefetch(doctorId,await FmsApi.fetchPatientList(doctorId))}catch{}
  location.href="./patient-list.html";
}
document.querySelectorAll(".platform").forEach(x=>x.onclick=()=>{if(x.id==="fibroPlatform"){enterFibro()}else{tip("进入 "+x.dataset.name)}});
