(function(){
 // 合并药物存在本次录入草稿的 jbxx.ext.concomitantDrugs，保存即提交接口。
 var page=document.querySelector('[data-page]').dataset.page;
 var items=(FmsCase.ext('concomitantDrugs')||[]).slice();
 if(page==='list'){
  var list=document.getElementById('entries');document.getElementById('empty').hidden=items.length>0;
  items.forEach(function(name,index){var row=document.createElement('li'),link=document.createElement('a'),label=document.createElement('span'),arrow=document.createElement('span');link.href='add.html?edit='+index;label.textContent=name;arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');link.append(label,arrow);row.appendChild(link);list.appendChild(row);});
  // 保存后回到列表时页面可能来自缓存，重新加载以显示最新记录。
  addEventListener('pageshow',function(e){if(e.persisted)location.reload();});
  document.getElementById('back').addEventListener('click',function(){FmsCase.back('../fibromyalgia-basic-info/basic-info.html');});return;
 }
 var form=document.getElementById('medicationForm'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1;
 if(Number.isInteger(edit)&&edit>=0&&edit<items.length)form.elements.name.value=items[edit];
 form.addEventListener('submit',function(event){event.preventDefault();var name=form.elements.name.value.trim(),error=document.getElementById('error');if(!name){error.textContent='请输入药物名称';return;}
  var next=items.slice();if(Number.isInteger(edit)&&edit>=0&&edit<items.length)next[edit]=name;else next.push(name);
  FmsCase.run(form.querySelector('button[type="submit"]'),async function(){await FmsCase.saveExt('concomitantDrugs',next);FmsCase.back('index.html');});
 });
})();
