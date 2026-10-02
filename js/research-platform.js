const toast=document.getElementById("toast");function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1600)}
enterBtn.onclick=()=>{const v=serial.value.trim();tip(v?`正在进入研究：${v}`:"请选择下方数据库，或输入研究序列号")};
serial.addEventListener("keydown",e=>{if(e.key==="Enter")enterBtn.click()});
document.querySelectorAll(".platform").forEach(x=>x.onclick=()=>{if(x.id==="fibroPlatform"){location.href="./patient-list.html"}else{tip("进入 "+x.dataset.name)}});
