(function(){
 var storageKey='hebing_yaowu_records',page=document.querySelector('[data-page]').dataset.page;
 // 兼容旧数据：早期记录只保存药物名称字符串。
 function normalize(item){return typeof item==='string'?{name:item}:(item&&typeof item==='object'?item:null);}
 function read(){try{var raw=localStorage.getItem(storageKey),items=raw===null?[]:JSON.parse(raw);return Array.isArray(items)?items.map(normalize).filter(Boolean):[];}catch(e){return [];}}
 var items=read();
 if(page==='list'){
  var list=document.getElementById('entries');document.getElementById('empty').hidden=items.length>0;
  items.forEach(function(item,index){var row=document.createElement('li'),link=document.createElement('a'),label=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('span');link.href='add.html?edit='+index;name.textContent=item.name;info.textContent=[item.dose?item.dose+(item.unit||''):'',item.frequency||'',item.ongoing==='是'?'沿用至今':(item.ongoing==='否'?'已停用':'')].filter(Boolean).join('，');label.className='entry-copy';label.append(name,info);arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');link.append(label,arrow);row.appendChild(link);list.appendChild(row);});
  document.getElementById('back').addEventListener('click',function(){if(history.length>1)history.back();else location.href='../fibromyalgia-condition-history/condition-history.html';});return;
 }
 var form=document.getElementById('medicationForm'),stop=document.getElementById('stopDetail'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1,editing=Number.isInteger(edit)&&edit>=0&&edit<items.length;
 var fields=['name','dose','unit','frequency','startDate','endDate','stopReason'];
 // 是否沿用至今选“否”才显示结束日期和停用原因；否则隐藏、禁用并清空。
 function refresh(){var show=form.elements.ongoing.value==='否';stop.hidden=!show;stop.querySelectorAll('input,select').forEach(function(el){el.disabled=!show;if(!show)el.value='';});}
 if(editing){var saved=items[edit];form.elements.ongoing.value=saved.ongoing||'';refresh();fields.forEach(function(f){if(saved[f]!=null)form.elements[f].value=saved[f];});}
 form.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',function(event){event.preventDefault();var error=document.getElementById('error'),record={};error.textContent='';
  fields.forEach(function(f){var el=form.elements[f];record[f]=el.disabled?'':String(el.value).trim();});record.ongoing=form.elements.ongoing.value;
  if(!record.name){error.textContent='请输入药物名称';return;}
  if(record.dose&&!(+record.dose>=0)){error.textContent='剂量应为不小于0的数字';return;}
  if(record.startDate&&record.endDate&&record.endDate<record.startDate){error.textContent='结束日期不能早于开始日期';return;}
  if(editing)items[edit]=record;else items.push(record);
  try{localStorage.setItem(storageKey,JSON.stringify(items));location.href='index.html';}catch(e){error.textContent='保存失败，请检查浏览器存储设置';}
 });
})();
