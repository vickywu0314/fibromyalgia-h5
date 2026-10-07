/* 本病治疗史 - 列表页（西药 / 中药汤剂 / 非药物疗法 / 中成药），数据来自病例草稿 jbxx.treatmentHistory */
(function(){
 var S=window.BenbingStore,kind=document.querySelector('[data-kind]').dataset.kind,items=S.items(kind),hasValue=S.has(kind);
 var list=document.getElementById('items'),empty=document.getElementById('empty');
 S.setProgress(items.length||hasValue?100:0);
 empty.hidden=items.length>0;
 if(!items.length&&hasValue==='无')empty.textContent='已选择：无（未使用'+S.KINDS[kind].label+'）';
 items.forEach(function(item,i){var li=document.createElement('li'),a=document.createElement('a'),copy=document.createElement('span'),name=document.createElement('strong'),note=document.createElement('small'),arrow=document.createElement('span');li.className='med-item';a.href='add-'+kind+'.html?edit='+i;name.textContent=item.name||item.medication||'未命名';note.textContent=S.summary(kind,item);arrow.className='chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');copy.append(name,note);a.append(copy,arrow);li.appendChild(a);list.appendChild(li);});
})();
