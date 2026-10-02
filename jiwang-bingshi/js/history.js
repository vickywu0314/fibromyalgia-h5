(function(){
 // 既往疾病记录存在本次录入草稿的 jbxx.ext.pastDiseases，保存即提交接口。
 var page=document.querySelector('[data-page]'),view=page.dataset.page;
 var records=(FmsCase.ext('pastDiseases')||[]).slice();
 if(view==='list'){
  var list=document.getElementById('records');document.getElementById('empty').hidden=records.length>0;
  records.forEach(function(record,index){var li=document.createElement('li'),link=document.createElement('a'),text=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('em');link.href=record.category+'.html?edit='+index;name.textContent=record.categoryLabel||record.name;info.textContent=[record.name,record.years?record.years+'年':''].filter(Boolean).join('，');arrow.textContent='›';arrow.setAttribute('aria-hidden','true');text.append(name,info);link.append(text,arrow);li.appendChild(link);list.appendChild(li);});
  // 保存后回到列表时页面可能来自缓存，重新加载以显示最新记录。
  addEventListener('pageshow',function(e){if(e.persisted)location.reload();});
  document.getElementById('back').addEventListener('click',function(){FmsCase.back('../fibromyalgia-basic-info/basic-info.html');});return;
 }
 if(view==='choose')return;
 var form=document.getElementById('historyForm'),category=page.dataset.category,chosen=form.elements.disease,other=document.getElementById('otherWrap'),error=document.getElementById('error'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1;
 if(edit>=0&&edit<records.length&&records[edit].category===category){var saved=records[edit],radio=[...form.querySelectorAll('input[name="disease"]')].find(function(input){return input.value===saved.name;});chosen.value=radio?saved.name:'其他';form.elements.otherName.value=radio?'':saved.name;form.elements.years.value=saved.years||'';}
 function refresh(){other.hidden=chosen.value!=='其他';}form.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',function(event){event.preventDefault();error.textContent='';var name=chosen.value==='其他'?form.elements.otherName.value.trim():chosen.value,years=form.elements.years.value.trim();if(!name){error.textContent='请选择疾病名称';return;}if(years&&(+years<0||+years>120)){error.textContent='病程年数应在0到120之间';return;}
  var record={category:category,categoryLabel:document.title,name:name,years:years};var next=records.slice();if(edit>=0&&edit<records.length&&records[edit].category===category)next[edit]=record;else next.push(record);
  FmsCase.run(form.querySelector('button[type="submit"]'),async function(){await FmsCase.saveExt('pastDiseases',next);
   // 经“选择疾病类别”进来的，直接退回两步到列表；编辑已有记录则退回一步。
   if(/\/choose\.html$/.test(document.referrer.split('?')[0])&&history.length>2)history.go(-2);else FmsCase.back('index.html');});
 });
})();
