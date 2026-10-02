const q=new URLSearchParams(location.search),n=q.get("name")||"张三",code=q.get("code")||"FM-2026-0018";pname.textContent=n;pid.textContent="研究编号 "+code;avatar.textContent=n.slice(-1);

const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}
document.querySelectorAll(".module").forEach(x=>x.onclick=()=>tip("进入「"+x.dataset.module+"」录入页面"));
finishBtn.onclick=()=>tip("患者资料已保存");
