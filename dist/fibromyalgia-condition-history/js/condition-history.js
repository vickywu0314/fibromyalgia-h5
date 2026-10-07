(function(){
 const form=document.getElementById('conditionForm');
 const details=document.getElementById('menstrualDetails');
 // 经期/经色/经量/痛经 按 PDF 仅在 围绝经期 时填写；其他分期隐藏并清空
 function syncMenstrual(){
   const stage=form.querySelector('input[name="menstrualStage"]:checked')?.value;
   const hide=stage!=='围绝经期';
   details.classList.toggle('is-hidden',hide);
   details.querySelectorAll('input').forEach(function(x){x.disabled=hide;if(hide)x.checked=false;});
 }
 form.querySelectorAll('input[name="menstrualStage"]').forEach(function(x){x.addEventListener('change',syncMenstrual);});
 syncMenstrual();
 form.addEventListener('submit',function(e){
   e.preventDefault();
   const fd=new FormData(form), data={};
   for(const [k,v] of fd.entries()){
     if(data[k]===undefined)data[k]=v;
     else if(Array.isArray(data[k]))data[k].push(v);
     else data[k]=[data[k],v];
   }
   const payload={type:'condition-history',data};
   if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);
   else if(window.Android&&typeof window.Android.saveForm==='function')window.Android.saveForm(JSON.stringify(payload));
   else { console.log('[CONDITION HISTORY]',payload); history.back(); }
 });
})();
