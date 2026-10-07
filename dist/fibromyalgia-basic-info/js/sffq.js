(()=>{const f=document.querySelector("#sffqForm");
// 选中“…以上/大于…/其他…”时显示并启用对应的数字/文本输入；“有”时展开鱼油品牌与剂量、其他食物；隐藏的输入禁用后不会进入 FormData。
const val=n=>f.querySelector(`input[name="${n}"]:checked`)?.value||"";
const update=()=>{f.querySelectorAll(".conditional").forEach(box=>{const show=val(box.dataset.showName)===box.dataset.showValue;box.hidden=!show;box.querySelectorAll("input").forEach(i=>i.disabled=!show)});
f.querySelectorAll(".extra[data-for]").forEach(l=>{const v=val(l.dataset.for),input=l.querySelector("input");const show=!input.closest(".conditional[hidden]")&&/以上|大于|其他/.test(v);l.hidden=!show;input.disabled=!show})};
f.addEventListener("change",update);update();
f.onsubmit=e=>{e.preventDefault();update();const data=Object.fromEntries(new FormData(f));const payload={type:"sffq",data};if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);else if(window.Android?.saveForm)window.Android.saveForm(JSON.stringify(payload));else console.log("[SFFQ]",payload)}})();
