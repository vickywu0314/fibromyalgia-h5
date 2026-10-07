/* 本病治疗史 - 列表页（西药 / 中药汤剂 / 非药物疗法 / 中成药），数据来自病例草稿 jbxx.treatmentHistory
   进度：本类需要回答的问题 = 「无/有」1 项；选「有」时再加「至少添加 1 条记录」1 项。 */
(function(){
 var S=window.BenbingStore,kind=document.querySelector('[data-kind]').dataset.kind;
 var list=document.getElementById('items'),empty=document.getElementById('empty'),emptyText=empty.textContent;
 function render(){
  var items=S.items(kind),hasValue=S.has(kind)||(items.length?'有':'');
  S.setProgress((hasValue?1:0)+(hasValue==='有'&&items.length?1:0),hasValue==='有'?2:1);
  list.innerHTML='';
  empty.hidden=items.length>0;
  empty.textContent=!items.length&&hasValue==='无'?'已选择：无（未使用'+S.KINDS[kind].label+'）':emptyText;
  items.forEach(function(item,i){var li=document.createElement('li'),a=document.createElement('a'),copy=document.createElement('span'),name=document.createElement('strong'),note=document.createElement('small'),arrow=document.createElement('span');li.className='med-item';a.href='add-'+kind+'.html?edit='+i;name.textContent=item.name||item.medication||'未命名';note.textContent=S.summary(kind,item);arrow.className='chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');copy.append(name,note);a.append(copy,arrow);li.appendChild(a);list.appendChild(li);});
 }
 render();
 window.addEventListener('pageshow',function(e){if(e.persisted)render();});
})();
