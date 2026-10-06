(function(){
 const form=document.getElementById('conditionForm');
 const reveals=[...form.querySelectorAll('.reveal[data-when]')];
 const noteInputs=[...form.querySelectorAll('[data-note]')];
 // 病史病情页的“发病时间 / 是否确诊 / 确诊时间”按结构体放在 jbxx 下，其余字段写 bsbq。
 const JBXX_FIELDS=['painOnsetDate','diagnosed','diagnosisDate'];
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
   const jbxx={
     painOnsetDate:d.painOnsetDate||'',
     diagnosed:d.diagnosed||'',
     diagnosisDate:d.diagnosed==='是'?(d.diagnosisDate||''):''
   };
   const bsbq={};
   TEXT_FIELDS.forEach(k=>{bsbq[k]=d[k]||'';});
   ARRAY_FIELDS.forEach(k=>{bsbq[k]=Array.isArray(d[k])?d[k]:(d[k]?[d[k]]:[]);});
   // 加重诱因中 4 个“请说明”：{ emotion, diet, naturalFactor, nonNaturalFactor }
   bsbq.aggravatingTriggerNotes={};
   noteInputs.forEach(el=>{ if(!el.disabled&&el.value.trim())bsbq.aggravatingTriggerNotes[el.dataset.note]=el.value.trim(); });
   return {jbxx,bsbq};
 }

 function setValue(name,v){
   const els=[...form.elements].filter(el=>el.name===name);
   const list=Array.isArray(v)?v.map(String):(v==null||v===''?[]:[String(v)]);
   els.forEach(el=>{
     if(el.type==='checkbox'||el.type==='radio')el.checked=list.includes(el.value);
     else el.value=list[0]||'';
   });
 }

 // 回显：jbxx（发病时间/确诊）+ bsbq 两处都读；先恢复父选项再恢复条件区域内的文本/日期。
 function fill(){
   const jbxx=FmsCase.get('jbxx')||{},bsbq=FmsCase.get('bsbq')||{};
   setValue('diagnosed',jbxx.diagnosed);
   TEXT_FIELDS.concat(ARRAY_FIELDS).forEach(k=>setValue(k,bsbq[k]));
   refresh();
   setValue('painOnsetDate',jbxx.painOnsetDate);
   if(jbxx.diagnosed==='是')setValue('diagnosisDate',jbxx.diagnosisDate);
   const notes=bsbq.aggravatingTriggerNotes||{};
   noteInputs.forEach(el=>{ if(!el.disabled)el.value=notes[el.dataset.note]||''; });
 }

 // 入口行完成状态：TPC / FS / 本病治疗史 / 合并疾病 / 合并药物
 function entryStatus(){
   const j=FmsCase.get('jbxx')||{};
   const fs=j.fs||{},th=j.treatmentHistory||{};
   const thCount=['xiyao','zhongyaoTangji','feiYaowuLiaofa','zhongchengyao'].reduce((n,k)=>n+(Array.isArray(th[k])?th[k].length:0),0);
   const thTouched=thCount>0||['hasXiyao','hasZhongyaoTangji','hasFeiYaowuLiaofa','hasZhongchengyao'].some(k=>th[k]);
   const dh=Array.isArray(j.diseaseHistory)?j.diseaseHistory:[];
   const cm=Array.isArray(j.concomitantMedication)?j.concomitantMedication:[];
   return {
     tpc:j.tpc&&j.tpc.finish?['done','已完成'+(j.tpc.score!==''&&j.tpc.score!=null?'（'+j.tpc.score+'）':'')]:['','未填写'],
     fs:fs.finish?['done','已完成'+(fs.score!==''&&fs.score!=null?'（'+fs.score+'）':'')]:((fs.wpi&&fs.wpi.finish)||(fs.sss&&fs.sss.finish)?['doing','填写中']:['','未填写']),
     treatmentHistory:th.finish?['done','已完成']:(thTouched?['doing','填写中']:['','未填写']),
     diseaseHistory:j.diseaseHistoryFinish?['done',dh.length?'已完成（'+dh.length+'项）':'已完成（无）']:(dh.length?['doing',dh.length+'项']:['','未填写']),
     concomitantMedication:j.concomitantMedicationFinish?['done',cm.length?'已完成（'+cm.length+'项）':'已完成（无）']:(cm.length?['doing',cm.length+'项']:['','未填写'])
   };
 }
 function renderEntries(){
   const st=entryStatus();
   form.querySelectorAll('.entry-row[data-entry]').forEach(row=>{
     const s=st[row.dataset.entry],el=row.querySelector('.entry-status');
     if(!s||!el)return;
     el.className='entry-status'+(s[0]?' '+s[0]:'');
     el.textContent=s[1];
   });
   return st;
 }

 // 进度：14 项中已填写的项数
 function updateProgress(){
   if(!window.FmsCase)return;
   const d=FmsCase.formData(form),st=entryStatus();
   const has=k=>Array.isArray(d[k])?d[k].length>0:!!d[k];
   const items=[has('painOnsetDate'),has('diagnosed'),st.tpc[0]==='done',st.fs[0]==='done',st.treatmentHistory[0]==='done',st.diseaseHistory[0]==='done',st.concomitantMedication[0]==='done',
     has('onsetTriggers'),has('aggravatingTriggers'),has('painNature'),has('systemic'),has('stool')&&has('urine'),
     has('tongueColor')&&has('tongueShape')&&has('coatColor')&&has('coatShape'),has('menstrualItems')];
   const pct=Math.round(items.filter(Boolean).length/items.length*100);
   const bar=document.getElementById('progressBar'),txt=document.getElementById('progressText');
   if(bar)bar.style.width=pct+'%';
   if(txt)txt.textContent='已完成'+pct+'%';
 }

 // 进入子模块前把当前页已填内容暂存到草稿（不提交、不改变完成状态），返回时可回显。
 function stash(){
   const {jbxx,bsbq}=collect();
   FmsCase.set('jbxx',jbxx,true);
   FmsCase.set('bsbq',bsbq,true);
 }
 form.querySelectorAll('.entry-row').forEach(a=>a.addEventListener('click',stash));

 fill();
 renderEntries();
 refresh();
 // 从子页面返回（bfcache）时刷新入口状态
 window.addEventListener('pageshow',e=>{ if(e.persisted){ renderEntries(); updateProgress(); } });

 form.addEventListener('submit',function(e){
   e.preventDefault();
   const {jbxx,bsbq}=collect();
   FmsCase.set('jbxx',jbxx,true); // 只写草稿；提交时整份病例一起发送
   bsbq.finish=true;
   FmsCase.save('bsbq',bsbq,{back:'../patient-detail.html',button:document.getElementById('saveBtn')});
 });
})();
