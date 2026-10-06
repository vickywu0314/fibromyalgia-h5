(function(){
 var key='jiwang_bingshi_records',page=document.querySelector('[data-page]'),view=page.dataset.page;
 function read(){try{var raw=localStorage.getItem(key);var value=raw===null?[]:JSON.parse(raw);return Array.isArray(value)?value:[];}catch(error){return [];}}
 var records=read();
 function duration(record){if(record.months)return record.months+'个月';if(record.years)return record.years+'年';return '';}
 if(view==='list'){
  var list=document.getElementById('records');document.getElementById('empty').hidden=records.length>0;
  records.forEach(function(record,index){var li=document.createElement('li'),link=document.createElement('a'),text=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('em');link.href=record.category+'.html?edit='+index;name.textContent=record.categoryLabel||record.name;info.textContent=[record.name,duration(record)?'病程'+duration(record):'',record.diagnosisDate?'诊断时间'+record.diagnosisDate:''].filter(Boolean).join('，');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');text.append(name,info);link.append(text,arrow);li.appendChild(link);list.appendChild(li);});
  document.getElementById('back').addEventListener('click',function(){if(history.length>1)history.back();else location.href='../fibromyalgia-condition-history/condition-history.html';});return;
 }
 if(view==='choose')return;
 var form=document.getElementById('historyForm'),category=page.dataset.category,chosen=form.elements.disease,hasChoices=!!chosen,other=document.getElementById('otherWrap'),otherInput=form.elements.otherName,error=document.getElementById('error'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1,editing=Number.isInteger(edit)&&edit>=0&&edit<records.length&&records[edit].category===category;
 if(editing){var saved=records[edit];if(hasChoices){var radio=[].slice.call(form.querySelectorAll('input[name="disease"]')).find(function(input){return input.value===saved.name&&input.value!=='其他';});chosen.value=radio?saved.name:'其他';otherInput.value=radio?'':saved.name;}else otherInput.value=saved.name||'';form.elements.months.value=saved.months||'';form.elements.diagnosisDate.value=saved.diagnosisDate||'';}
 // “其他”选中时才显示“疾病名称”；未选中时隐藏、禁用并清空。顶层“其他”类别没有单选项，名称始终显示。
 function refresh(){if(!hasChoices)return;var show=chosen.value==='其他';other.hidden=!show;otherInput.disabled=!show;if(!show)otherInput.value='';}
 form.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',function(event){event.preventDefault();error.textContent='';var useOther=!hasChoices||chosen.value==='其他',name=useOther?otherInput.value.trim():chosen.value,months=form.elements.months.value.trim(),date=form.elements.diagnosisDate.value;
  if(!name){error.textContent=hasChoices&&!chosen.value?'请选择疾病':'请输入疾病名称';return;}
  if(months&&(!/^\d+$/.test(months)||+months>1500)){error.textContent='病程月数应为0到1500之间的整数';return;}
  var record={category:category,categoryLabel:document.title,name:name,months:months,diagnosisDate:date};if(editing)records[edit]=record;else records.push(record);
  try{localStorage.setItem(key,JSON.stringify(records));location.href='index.html';}catch(e){error.textContent='保存失败，请检查浏览器存储设置';}
 });
})();
