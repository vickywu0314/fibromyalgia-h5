/* 合并药物：记录存于病例草稿 jbxx.concomitantMedication（数组，每条 {name, dose, unit, frequency, startDate, ongoing, endDate, reason}）；
   列表页“保存并返回”写 jbxx.concomitantMedicationFinish = true（基本信息页入口据此显示完成状态）。 */
(function(){
 var BACK='../fibromyalgia-basic-info/basic-info.html',page=document.querySelector('[data-page]').dataset.page;
 function read(){var v=FmsCase.get('jbxx.concomitantMedication');return Array.isArray(v)?v.filter(function(x){return x&&typeof x==='object';}):[];}
 var items=read();
 // 进度条：本模块已保存完成为 100%，否则 0%
 (function(){var done=!!FmsCase.get('jbxx.concomitantMedicationFinish'),pct=done?100:0,bar=document.querySelector('.progress'),span=bar&&bar.querySelector('span'),p=document.querySelector('.progress-block p');if(span)span.style.width=pct+'%';if(bar)bar.setAttribute('aria-valuenow',pct);if(p)p.textContent='已完成'+pct+'%';})();
 if(page==='list'){
  var list=document.getElementById('entries');document.getElementById('empty').hidden=items.length>0;
  items.forEach(function(item,index){var row=document.createElement('li'),link=document.createElement('a'),label=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('span');link.href='add.html?edit='+index;name.textContent=item.name;info.textContent=[item.dose?item.dose+(item.unit||''):'',item.frequency||'',item.ongoing==='是'?'沿用至今':(item.ongoing==='否'?'已停用':'')].filter(Boolean).join('，');label.className='entry-copy';label.append(name,info);arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');link.append(label,arrow);row.appendChild(link);list.appendChild(row);});
  document.getElementById('back').addEventListener('click',function(){
   FmsCase.save('jbxx',{concomitantMedication:items,concomitantMedicationFinish:true},{merge:true,back:BACK,button:this});
  });
  return;
 }
 var form=document.getElementById('medicationForm'),stop=document.getElementById('stopDetail'),submitBtn=form.querySelector('button[type="submit"]'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1,editing=Number.isInteger(edit)&&edit>=0&&edit<items.length;
 var fields=['name','dose','unit','frequency','startDate','endDate','reason'];
 // 是否沿用至今选“否”才显示结束日期和停用原因；否则隐藏、禁用并清空。
 function refresh(){var show=form.elements.ongoing.value==='否';stop.hidden=!show;stop.querySelectorAll('input,select').forEach(function(el){el.disabled=!show;if(!show)el.value='';});}
 if(editing){var saved=items[edit];form.elements.ongoing.value=saved.ongoing||'';refresh();fields.forEach(function(f){var v=saved[f];if(f==='reason'&&v==null)v=saved.stopReason;if(v!=null)form.elements[f].value=v;});}
 form.addEventListener('change',refresh);refresh();
 // 编辑已有记录时提供“删除此记录”
 if(editing){var del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='删除此记录';del.style.marginTop='12px';submitBtn.insertAdjacentElement('afterend',del);
  del.addEventListener('click',function(){if(!del.dataset.done){if(!confirm('确定删除这条合并药物记录吗？'))return;items.splice(edit,1);del.dataset.done='1';submitBtn.disabled=true;}FmsCase.save('jbxx.concomitantMedication',items,{back:'index.html',button:del});});}
 form.addEventListener('submit',function(event){event.preventDefault();var error=document.getElementById('error'),record={};error.textContent='';
  fields.forEach(function(f){var el=form.elements[f];record[f]=el.disabled?'':String(el.value).trim();});record.ongoing=form.elements.ongoing.value;
  if(!record.name){error.textContent='请输入药物名称';return;}
  if(record.dose&&!(+record.dose>=0)){error.textContent='剂量应为不小于0的数字';return;}
  if(record.startDate&&record.endDate&&record.endDate<record.startDate){error.textContent='结束日期不能早于开始日期';return;}
  if(editing)items[edit]=record;else{items.push(record);edit=items.length-1;editing=true;} // 提交失败重试时不重复新增
  FmsCase.save('jbxx.concomitantMedication',items,{back:'index.html',button:submitBtn});
 });
})();
