(function(){
 var storageKey='hebing_yaowu_records',page=document.querySelector('[data-page]').dataset.page;
 function read(){try{var raw=localStorage.getItem(storageKey),items=raw===null?['药物名称1']:JSON.parse(raw);return Array.isArray(items)?items:[];}catch(e){return [];}}
 var items=read();
 if(page==='list'){
  var list=document.getElementById('entries');document.getElementById('empty').hidden=items.length>0;
  items.forEach(function(name,index){var row=document.createElement('li'),link=document.createElement('a'),label=document.createElement('span'),arrow=document.createElement('span');link.href='add.html?edit='+index;label.textContent=name;arrow.className='arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');link.append(label,arrow);row.appendChild(link);list.appendChild(row);});
  document.getElementById('back').addEventListener('click',function(){if(history.length>1)history.back();else location.href='index.html';});return;
 }
 var form=document.getElementById('medicationForm'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1;
 if(Number.isInteger(edit)&&edit>=0&&edit<items.length)form.elements.name.value=items[edit];
 form.addEventListener('submit',function(event){event.preventDefault();var name=form.elements.name.value.trim(),error=document.getElementById('error');if(!name){error.textContent='请输入药物名称';return;}
  if(Number.isInteger(edit)&&edit>=0&&edit<items.length)items[edit]=name;else items.push(name);
  try{localStorage.setItem(storageKey,JSON.stringify(items));}catch(e){error.textContent='保存失败，请检查浏览器存储设置';return;}
  // 录入流程中整组提交到服务端（jbxx.concomitantMedication），成功再返回列表。
  if(window.CaseEdit)CaseEdit.commitThen(storageKey,function(){location.href='index.html';},function(m){error.textContent=m;});else location.href='index.html';
 });
})();
