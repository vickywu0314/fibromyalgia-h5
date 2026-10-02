(function(){
 const form=document.getElementById('conditionForm');
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
