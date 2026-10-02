const rows=[...document.querySelectorAll(".patient-row")],empty=document.getElementById("empty"),toast=document.getElementById("toast");
function tip(t){toast.textContent=t;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),1500)}

rows.forEach(r=>r.onclick=()=>location.href="./follow-up-list.html?name="+encodeURIComponent(r.dataset.name));
search.oninput=e=>{let q=e.target.value.trim();let n=0;rows.forEach(r=>{let show=!q||r.dataset.name.includes(q);r.style.display=show?"":"none";if(show)n++});empty.style.display=n?"none":"block"};
addPatient.onclick=()=>location.href="./patient-add.html";
