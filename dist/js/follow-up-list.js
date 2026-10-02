const params=new URLSearchParams(location.search),name=params.get("name")||"患者";patientName.textContent="当前患者："+name;

const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}
document.querySelectorAll(".visit-card").forEach(r=>r.onclick=()=>tip(name+" · "+r.dataset.date+" 随访记录"));
addVisit.onclick=()=>tip("为 "+name+" 新增随访记录");
