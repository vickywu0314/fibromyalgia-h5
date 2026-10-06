/* 本病治疗史 - 列表页（中药汤剂 / 非药物疗法 / 中成药） */
(function(){
 var root=document.querySelector('[data-kind]'),kind=root.dataset.kind,key='benbing_'+kind+'_records';
 var defaults={zhongchengyao:[{name:'痹祺胶囊',dose:'4',unit:'粒',frequency:'日1次',startDate:'',ongoing:'是',endDate:'',reason:''}],'zhongyao-tangji':[{name:'汤剂1',startDate:'2022-01-22',ongoing:'是',endDate:'',reason:''}],'fei-yaowu-liaofa':[{name:'八段锦',duration:'60',durationUnit:'分钟',frequency:'一周1次',startDate:'',ongoing:'是',endDate:'',reason:''}]};
 function read(){try{var raw=localStorage.getItem(key);var value=raw===null?defaults[kind]:JSON.parse(raw);return Array.isArray(value)?value:[];}catch(e){return defaults[kind];}}
 var items=read();
 function display(item){
  if(kind==='zhongyao-tangji')return [item.startDate?'开始 '+item.startDate:'',item.ongoing==='是'?'沿用至今':item.ongoing==='否'?'已停用':''].filter(Boolean).join('，');
  if(kind==='fei-yaowu-liaofa')return [item.frequency,item.duration?'单次'+item.duration+(item.durationUnit||'分钟'):''].filter(Boolean).join('，');
  return [item.frequency,item.dose?'单次'+item.dose+(item.unit||''):''].filter(Boolean).join('，');
 }
 var list=document.getElementById('items');document.getElementById('empty').hidden=items.length>0;
 items.forEach(function(item,i){var li=document.createElement('li'),a=document.createElement('a'),copy=document.createElement('span'),name=document.createElement('strong'),note=document.createElement('small'),arrow=document.createElement('span');li.className='med-item';a.href='add-'+kind+'.html?edit='+i;name.textContent=item.name;note.textContent=display(item);arrow.className='chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');copy.append(name,note);a.append(copy,arrow);li.appendChild(a);list.appendChild(li);});
})();
