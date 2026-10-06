(function(){
 const form=document.getElementById('conditionForm');
 const STORAGE_KEY='condition_history_form';
 const reveals=[...form.querySelectorAll('.reveal[data-when]')];

 function isChosen(rule){
   const i=rule.indexOf('='),name=rule.slice(0,i),value=rule.slice(i+1);
   return [...form.elements].some(el=>el.name===name&&el.value===value&&el.checked);
 }

 // 条件显示：父选项未选中时隐藏子区域，并禁用 + 清空其中的输入，避免脏数据提交。
 function refresh(){
   reveals.forEach(box=>{
     const show=isChosen(box.dataset.when);
     box.hidden=!show;
     box.querySelectorAll('input,select,textarea').forEach(el=>{
       el.disabled=!show;
       if(!show){ if(el.type==='checkbox'||el.type==='radio')el.checked=false; else el.value=''; }
     });
   });
 }

 // 互斥选项（如“无”“男性”）：选中它时取消同组其他项；选中其他项时取消它。
 form.addEventListener('change',e=>{
   const t=e.target;
   if(t.type==='checkbox'&&t.checked){
     const group=[...form.querySelectorAll('input[type="checkbox"]')].filter(x=>x.name===t.name&&x!==t);
     if(t.dataset.exclusive!==undefined)group.forEach(x=>{x.checked=false;});
     else group.forEach(x=>{if(x.dataset.exclusive!==undefined)x.checked=false;});
   }
   refresh();
 });

 function collect(){
   const fd=new FormData(form),data={};
   for(const [k,v] of fd.entries()){
     if(k.endsWith('[]')){(data[k]=data[k]||[]).push(v);continue;}
     data[k]=v;
   }
   return data;
 }

 function fill(data){
   if(!data||typeof data!=='object')return;
   [...form.elements].forEach(el=>{
     if(!el.name||!(el.name in data))return;
     const v=data[el.name];
     if(el.type==='checkbox'||el.type==='radio')el.checked=Array.isArray(v)?v.includes(el.value):v===el.value;
   });
   refresh(); // 先恢复父选项，再恢复条件子区域中的文本/日期
   [...form.elements].forEach(el=>{
     if(!el.name||!(el.name in data)||el.type==='checkbox'||el.type==='radio')return;
     el.value=data[el.name]==null?'':data[el.name];
   });
 }

 // 回显：App 可调用 window.setConditionHistory(data)；浏览器预览时读取 localStorage。
 window.setConditionHistory=fill;
 try{ fill(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')); }catch(e){}
 refresh();

 form.addEventListener('submit',function(e){
   e.preventDefault();
   const data=collect();
   try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); }catch(err){}
   const payload={type:'condition-history',data};
   if(window.webkit?.messageHandlers?.saveForm)window.webkit.messageHandlers.saveForm.postMessage(payload);
   else if(window.Android&&typeof window.Android.saveForm==='function')window.Android.saveForm(JSON.stringify(payload));
   else { console.log('[CONDITION HISTORY]',payload); history.back(); }
 });
})();
