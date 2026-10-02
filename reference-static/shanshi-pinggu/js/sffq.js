(()=>{const f=document.querySelector('#sffqForm'),status=document.querySelector('#saveStatus'),storageKey='sffq:first-half';
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const [name,value] of Object.entries(saved)){const fields=f.elements.namedItem(name);if(!fields)continue;const matches=f.querySelectorAll(`[name="${CSS.escape(name)}"]`);if(matches[0]?.type==='radio'){for(const radio of matches)radio.checked=radio.value===value}else if(matches[0])matches[0].value=value}}catch{}
const update=()=>{f.querySelectorAll('.extra[data-for]').forEach(label=>{const group=f.elements.namedItem(label.dataset.for),chosen=group?.value||'';const show=chosen.includes('以上')||chosen.includes('其他用量');label.classList.toggle('visible',show);label.querySelector('input').disabled=!show})};
const data=()=>Object.fromEntries(new FormData(f));
f.addEventListener('change',()=>{update();try{localStorage.setItem(storageKey,JSON.stringify(data()))}catch{status.textContent='自动暂存失败，请检查浏览器存储空间'}});
f.addEventListener('input',()=>{try{localStorage.setItem(storageKey,JSON.stringify(data()))}catch{status.textContent='自动暂存失败，请检查浏览器存储空间'}});
update();
f.addEventListener('submit',e=>{e.preventDefault();for(const label of f.querySelectorAll('.extra.visible')){const input=label.querySelector('input');if(!input.value||!input.checkValidity()){input.focus();status.textContent='请填写所选的具体用量';return}}const payload={type:'sffq',stage:'complete',data:data()};try{localStorage.setItem(storageKey,JSON.stringify(payload.data))}catch{}if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);else if(window.Android?.saveForm)window.Android.saveForm(JSON.stringify(payload));else{console.log('[SFFQ]',payload);status.textContent='问卷已保存在此浏览器'}});
})();
