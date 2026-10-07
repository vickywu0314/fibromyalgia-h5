/* 合并药物：记录存于病例草稿 jbxx.concomitantMedication（数组，每条 {name}；按新版 PDF 只有“药物名称”）；
   列表页“保存并返回”写 jbxx.concomitantMedicationFinish = true（基本信息页入口据此显示完成状态）。 */
(function(){
 var BACK='../fibromyalgia-basic-info/basic-info.html',page=document.querySelector('[data-page]').dataset.page;
 function read(){var v=FmsCase.get('jbxx.concomitantMedication');return Array.isArray(v)?v.filter(function(x){return x&&typeof x==='object';}):[];}
 var items=read();
 // 进度：列表页 = 本模块需要回答的「合并药物」1 项（已添加≥1条记录，或已保存确认无记录时算已答）；
 // 新增/编辑页 = 本条记录表单的已填项 / 应填项（药物名称），由 ../js/fms-progress.js 统计。
 function moduleProgress(){var xs=read();if(window.FmsProgress)FmsProgress.set(xs.length||FmsCase.get('jbxx.concomitantMedicationFinish')?1:0,1);}
 if(page==='list'){
  var list=document.getElementById('entries');
  var renderList=function(){list.innerHTML='';document.getElementById('empty').hidden=items.length>0;
  items.forEach(function(item,index){var row=document.createElement('li'),link=document.createElement('a'),label=document.createElement('span'),name=document.createElement('strong'),arrow=document.createElement('span');link.href='add.html?edit='+index;name.textContent=item.name;label.className='entry-copy';label.append(name);arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');link.append(label,arrow);row.appendChild(link);list.appendChild(row);});};
  renderList();moduleProgress();
  window.addEventListener('pageshow',function(e){if(e.persisted){items=read();renderList();moduleProgress();}});
  document.getElementById('back').addEventListener('click',function(){
   FmsCase.save('jbxx',{concomitantMedication:items,concomitantMedicationFinish:true},{merge:true,back:BACK,button:this});
  });
  return;
 }
 var form=document.getElementById('medicationForm'),submitBtn=form.querySelector('button[type="submit"]'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1,editing=Number.isInteger(edit)&&edit>=0&&edit<items.length;
 if(editing)form.elements.name.value=items[edit].name||'';
 if(window.FmsProgress)FmsProgress.track(form);
 // 编辑已有记录时提供“删除此记录”
 if(editing){var del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='删除此记录';del.style.marginTop='12px';submitBtn.insertAdjacentElement('afterend',del);
  del.addEventListener('click',function(){if(!del.dataset.done){if(!confirm('确定删除这条合并药物记录吗？'))return;items.splice(edit,1);del.dataset.done='1';submitBtn.disabled=true;}FmsCase.save('jbxx.concomitantMedication',items,{back:'index.html',button:del});});}
 form.addEventListener('submit',function(event){event.preventDefault();var error=document.getElementById('error'),record={};error.textContent='';
  record.name=String(form.elements.name.value).trim();
  if(!record.name){error.textContent='请输入药物名称';return;}
  if(editing)items[edit]=record;else{items.push(record);edit=items.length-1;editing=true;} // 提交失败重试时不重复新增
  FmsCase.save('jbxx.concomitantMedication',items,{back:'index.html',button:submitBtn});
 });
})();
