/* 本病治疗史 - 开药汇总：按类别汇总病例草稿 jbxx.treatmentHistory 中的记录；进度同入口页 = 已完成类别数 / 4 */
(function(){
 var S=window.BenbingStore,container=document.getElementById('summary');
 S.setProgress(S.doneKinds(),Object.keys(S.KINDS).length);
 Object.keys(S.KINDS).forEach(function(kind){var cfg=S.KINDS[kind],entries=S.items(kind),section=document.createElement('section'),heading=document.createElement('h2'),list=document.createElement('ul');section.className='summary-section';heading.textContent=cfg.label;list.className='med-list';
  entries.forEach(function(entry){var li=document.createElement('li'),a=document.createElement('a'),copy=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small');li.className='med-item';a.href=cfg.list;name.textContent=entry.name||entry.medication||'未命名';info.textContent=S.summary(kind,entry);copy.append(name,info);a.appendChild(copy);li.appendChild(a);list.appendChild(li);});
  if(!entries.length){var empty=document.createElement('p');empty.className='empty';empty.textContent=S.has(kind)==='无'?'无':'暂无记录';section.append(heading,empty);}else section.append(heading,list);container.appendChild(section);
 });
})();
