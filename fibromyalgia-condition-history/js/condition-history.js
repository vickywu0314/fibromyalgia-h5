(function(){
 const form=document.getElementById('conditionForm');
 const reveals=[...form.querySelectorAll('.reveal[data-when]')];
 const noteInputs=[...form.querySelectorAll('[data-note]')];
 // 病史病情只写 bsbq；发病时间 / 是否确诊在基本信息页（jbxx），TPC、FS、本病治疗史、合并疾病、合并药物是基本信息的子模块。
 const ARRAY_FIELDS=['onsetTriggers','aggravatingTriggers','painNature','systemic','menstrualItems'];
 const TEXT_FIELDS=['stool','urine','tongueColor','tongueShape','coatColor','coatShape'];

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
   updateProgress();
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
 form.addEventListener('input',updateProgress);

 function collect(){
   const d=FmsCase.formData(form);
   const bsbq={};
   TEXT_FIELDS.forEach(k=>{bsbq[k]=d[k]||'';});
   ARRAY_FIELDS.forEach(k=>{bsbq[k]=Array.isArray(d[k])?d[k]:(d[k]?[d[k]]:[]);});
   // 加重诱因中 4 个“请说明”：{ emotion, diet, naturalFactor, nonNaturalFactor }
   bsbq.aggravatingTriggerNotes={};
   noteInputs.forEach(el=>{ if(!el.disabled&&el.value.trim())bsbq.aggravatingTriggerNotes[el.dataset.note]=el.value.trim(); });
   return bsbq;
 }

 function setValue(name,v){
   const els=[...form.elements].filter(el=>el.name===name);
   const list=Array.isArray(v)?v.map(String):(v==null||v===''?[]:[String(v)]);
   els.forEach(el=>{
     if(el.type==='checkbox'||el.type==='radio')el.checked=list.includes(el.value);
     else el.value=list[0]||'';
   });
 }

 // 回显：先恢复父选项再恢复条件区域内的说明文字。
 function fill(){
   const bsbq=FmsCase.get('bsbq')||{};
   TEXT_FIELDS.concat(ARRAY_FIELDS).forEach(k=>setValue(k,bsbq[k]));
   refresh();
   const notes=bsbq.aggravatingTriggerNotes||{};
   noteInputs.forEach(el=>{ if(!el.disabled)el.value=notes[el.dataset.note]||''; });
 }

 // 进度：7 项中已填写的项数
 function updateProgress(){
   if(!window.FmsCase)return;
   const d=FmsCase.formData(form);
   const has=k=>Array.isArray(d[k])?d[k].length>0:!!d[k];
   const items=[has('onsetTriggers'),has('aggravatingTriggers'),has('painNature'),has('systemic'),has('stool')&&has('urine'),
     has('tongueColor')&&has('tongueShape')&&has('coatColor')&&has('coatShape'),has('menstrualItems')];
   const pct=Math.round(items.filter(Boolean).length/items.length*100);
   const bar=document.getElementById('progressBar'),txt=document.getElementById('progressText');
   if(bar)bar.style.width=pct+'%';
   if(txt)txt.textContent='已完成'+pct+'%';
 }

 fill();
 refresh();

 form.addEventListener('submit',function(e){
   e.preventDefault();
   const bsbq=collect();
   bsbq.finish=true;
   FmsCase.save('bsbq',bsbq,{back:'../patient-detail.html',button:document.getElementById('saveBtn')});
 });
})();
