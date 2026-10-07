(function(){
 const form=document.getElementById('conditionForm');
 const reveals=[...form.querySelectorAll('.reveal[data-when]')];
 const menstrualSection=document.getElementById('menstrualSection');
 // 按 PDF：「周身疼痛发病时间 / 是否确诊 / 确诊时间」在病史病情页填写，按提交结构体存到 jbxx 下；其余字段写 bsbq。
 const JBXX_FIELDS=['painOnsetDate','diagnosed','diagnosisDate','hospitalLevel'];
 const ARRAY_FIELDS=['onsetTriggers','aggravatingTriggers','painNature','systemic'];
 // 月经情况：menstrualStage 单选（绝经期/围绝经期/育龄期）；经期/经色/经量/痛经 仅「围绝经期」时填写，其他分期清空
 const MENSTRUAL_SUB=['periodTiming','periodColor','periodAmount','dysmenorrhea'];
 const MENSTRUAL_FIELDS=['menstrualStage'].concat(MENSTRUAL_SUB);
 const TEXT_FIELDS=['stool','urine','tongueColor','tongueShape','coatColor','coatShape'].concat(MENSTRUAL_FIELDS);

 // 性别：取病例草稿 jbxx.gender（男/女）；没有时按 18 位身份证第 17 位推出（奇男偶女）；都没有视为未知
 function patientGender(){
   const jbxx=FmsCase.get('jbxx')||{};
   const g=String(jbxx.gender||'').trim();
   if(g==='男'||g==='女')return g;
   const id=String(jbxx.idCard||'').trim();
   if(/^\d{17}[\dXx]$/.test(id))return Number(id.charAt(16))%2?'男':'女';
   return '';
 }
 // 男性患者不填「月经情况」：整块隐藏、禁用并清空，不计入进度、不提交；性别未知时照常显示
 const isMale=patientGender()==='男';
 let progress=null;

 function isChosen(rule){
   const i=rule.indexOf('='),name=rule.slice(0,i),value=rule.slice(i+1);
   return [...form.elements].some(el=>el.name===name&&el.value===value&&el.checked);
 }

 function setArea(box,show){
   box.hidden=!show;
   box.querySelectorAll('input,select,textarea').forEach(el=>{
     el.disabled=!show;
     if(!show){ if(el.type==='checkbox'||el.type==='radio')el.checked=false; else el.value=''; }
   });
 }

 // 条件显示：父选项未选中时隐藏子区域，并禁用 + 清空其中的输入，避免脏数据提交。
 function refresh(){
   if(isMale)setArea(menstrualSection,false);
   reveals.forEach(box=>{
     if(isMale&&menstrualSection.contains(box)){box.hidden=true;return;}
     setArea(box,isChosen(box.dataset.when));
   });
   if(progress)progress.refresh();
 }

 // 互斥选项（如“无”）：选中它时取消同组其他项；选中其他项时取消它。
 form.addEventListener('change',e=>{
   const t=e.target;
   if(t.type==='checkbox'&&t.checked){
     const group=[...form.querySelectorAll('input[type="checkbox"]')].filter(x=>x.name===t.name&&x!==t);
     if(t.dataset.exclusive!==undefined)group.forEach(x=>{x.checked=false;});
     else group.forEach(x=>{if(x.dataset.exclusive!==undefined)x.checked=false;});
   }
   refresh();
   autosave();
 });
 form.addEventListener('input',autosave);

 function collect(){
   const d=FmsCase.formData(form);
   const jbxx={
     painOnsetDate:d.painOnsetDate||'',
     diagnosed:d.diagnosed||'',
     diagnosisDate:d.diagnosed==='是'?(d.diagnosisDate||''):'',
     hospitalLevel:d.diagnosed==='是'?(d.hospitalLevel||''):''
   };
   const bsbq={};
   TEXT_FIELDS.forEach(k=>{bsbq[k]=d[k]||'';});
   ARRAY_FIELDS.forEach(k=>{bsbq[k]=Array.isArray(d[k])?d[k]:(d[k]?[d[k]]:[]);});
   if(bsbq.menstrualStage!=='围绝经期')MENSTRUAL_SUB.forEach(k=>{bsbq[k]='';});
   if(isMale)MENSTRUAL_FIELDS.forEach(k=>{bsbq[k]='';});
   return {jbxx,bsbq};
 }

 // 边填边暂存到草稿（finish=false，不提交），返回患者资料页时显示「填写中」
 let timer=0;
 function autosave(){
   clearTimeout(timer);
   timer=setTimeout(()=>{
     try{
       const {jbxx,bsbq}=collect();
       FmsCase.set('jbxx',jbxx,true);
       bsbq.finish=false;
       FmsCase.set('bsbq',bsbq);
     }catch(e){}
   },300);
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
   const jbxx=FmsCase.get('jbxx')||{},bsbq=FmsCase.get('bsbq')||{};
   setValue('diagnosed',jbxx.diagnosed);
   TEXT_FIELDS.concat(ARRAY_FIELDS).forEach(k=>setValue(k,bsbq[k]));
   refresh();
   setValue('painOnsetDate',jbxx.painOnsetDate);
   if(jbxx.diagnosed==='是'){setValue('diagnosisDate',jbxx.diagnosisDate);setValue('hospitalLevel',jbxx.hospitalLevel);}
 }

 // 进度：每个 name 算一题（含「是」时的确诊时间/医疗机构、「围绝经期」时的经期等子题），男性不含月经情况
 fill();
 progress=FmsProgress.track(form);
 refresh();

 form.addEventListener('submit',function(e){
   e.preventDefault();
   clearTimeout(timer);
   const {jbxx,bsbq}=collect();
   FmsCase.set('jbxx',jbxx,true); // jbxx 的这三项随本次保存一并提交（part=jbxx）
   bsbq.finish=true;
   FmsCase.save('bsbq',bsbq,{back:'../patient-detail.html',button:document.getElementById('saveBtn')});
 });
})();
