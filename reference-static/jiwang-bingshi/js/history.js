(function(){
 var key='jiwang_bingshi_records',page=document.querySelector('[data-page]'),view=page.dataset.page;
 function read(){try{var raw=localStorage.getItem(key);var value=raw===null?[{category:'huxi',categoryLabel:'呼吸系统疾病',name:'偏头痛',years:'2'}]:JSON.parse(raw);return Array.isArray(value)?value:[];}catch(error){return [];}}
 var records=read();
 if(view==='list'){
  var list=document.getElementById('records');document.getElementById('empty').hidden=records.length>0;
  records.forEach(function(record,index){var li=document.createElement('li'),link=document.createElement('a'),text=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('em');link.href=record.category+'.html?edit='+index;name.textContent=record.categoryLabel||record.name;info.textContent=[record.name,record.years?record.years+'年':''].filter(Boolean).join('，');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');text.append(name,info);link.append(text,arrow);li.appendChild(link);list.appendChild(li);});
  document.getElementById('back').addEventListener('click',function(){if(history.length>1)history.back();else location.href='choose.html';});return;
 }
 if(view==='choose')return;
 var form=document.getElementById('historyForm'),category=page.dataset.category,chosen=form.elements.disease,other=document.getElementById('otherWrap'),error=document.getElementById('error'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1;
 if(edit>=0&&edit<records.length&&records[edit].category===category){var saved=records[edit],radio=[...form.querySelectorAll('input[name="disease"]')].find(function(input){return input.value===saved.name;});chosen.value=radio?saved.name:'其他';form.elements.otherName.value=radio?'':saved.name;form.elements.years.value=saved.years||'';}
 function refresh(){other.hidden=chosen.value!=='其他';}form.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',function(event){event.preventDefault();error.textContent='';var name=chosen.value==='其他'?form.elements.otherName.value.trim():chosen.value,years=form.elements.years.value.trim();if(!name){error.textContent='请选择疾病名称';return;}if(years&&(+years<0||+years>120)){error.textContent='病程年数应在0到120之间';return;}
  var record={category:category,categoryLabel:document.title,name:name,years:years};if(edit>=0&&edit<records.length&&records[edit].category===category)records[edit]=record;else records.push(record);
  try{localStorage.setItem(key,JSON.stringify(records));location.href='index.html';}catch(e){error.textContent='保存失败，请检查浏览器存储设置';}
 });
})();
