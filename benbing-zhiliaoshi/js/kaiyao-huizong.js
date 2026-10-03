(function(){
 // 每组：标题、本地存储 key（填写流程）、列表页、示例数据、接口数据 key（查看模式，jbxx.treatmentHistory 下）
 var config=[['西药','benbing_xiyao_records','xiyao.html',[{medication:'艾司唑仑',frequency:'日1次',dose:'1',unit:'mg'}],'xiyao'],['中药汤剂','benbing_zhongyao-tangji_records','zhongyao-tangji.html',[{name:'汤剂1',startDate:'2022-01-22'}],'zhongyaoTangji'],['非药物疗法','benbing_fei-yaowu-liaofa_records','fei-yaowu-liaofa.html',[{name:'八段锦',frequency:'每周一次',duration:'60'}],'feiYaowuLiaofa'],['中成药','benbing_zhongchengyao_records','zhongchengyao.html',[{name:'痛祺胶囊',frequency:'日一次',dose:'4'}],'zhongchengyao']];
 var container=document.getElementById('summary');
 var viewing=window.CaseView&&CaseView.context().isView;
 function summary(entry,title){return entry.summary||(entry.startDate&&title==='中药汤剂'?entry.startDate:title==='非药物疗法'?[entry.frequency,entry.duration?'单次'+entry.duration+'分钟':''].filter(Boolean).join('，'):[entry.frequency,entry.dose?'单次'+entry.dose+(entry.unit||'粒'):''].filter(Boolean).join('，'));}
 // 查看模式额外显示的起止信息
 function period(entry){var parts=[];if(entry.startDate)parts.push('开始：'+entry.startDate);if(entry.ongoing==='是')parts.push('沿用至今');else{if(entry.endDate)parts.push('结束：'+entry.endDate);if(entry.reason)parts.push('停用原因：'+entry.reason);}return parts.join('，');}
 function render(source){
  container.replaceChildren();
  config.forEach(function(group){var section=document.createElement('section'),heading=document.createElement('h2'),list=document.createElement('ul');section.className='summary-section';heading.textContent=group[0];list.className='med-list';var entries=source(group);
  entries.forEach(function(entry){var li=document.createElement('li'),a=document.createElement(viewing?'div':'a'),copy=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small');li.className='med-item';if(!viewing)a.href=group[2];name.textContent=entry.medication||entry.name;info.textContent=summary(entry,group[0]);copy.append(name,info);if(viewing&&period(entry)){var extra=document.createElement('small');extra.textContent=period(entry);copy.append(extra);}a.appendChild(copy);li.appendChild(a);list.appendChild(li);});
  if(!entries.length){var empty=document.createElement('p');empty.className='empty';empty.textContent='暂无记录';section.append(heading,empty);}else section.append(heading,list);container.appendChild(section);
  });
 }
 if(viewing){
  // 查看模式：数据来自 /api/fms/patient/case/detail 的 jbxx.treatmentHistory，只读展示。
  document.body.classList.add('is-view');
  var back=document.querySelector('.actions a');back.textContent='返回';back.removeAttribute('href');back.setAttribute('role','button');back.onclick=function(){history.back();};
  container.textContent='正在加载...';
  CaseView.load('jbxx.treatmentHistory').then(function(data){render(function(group){return Array.isArray(data[group[4]])?data[group[4]]:[];});}).catch(function(error){container.textContent='';CaseView.notice(error.message);});
  return;
 }
 render(function(group){var entries;try{var raw=localStorage.getItem(group[1]);entries=raw===null?group[3]:JSON.parse(raw);if(!Array.isArray(entries))entries=[];}catch(e){entries=group[3];}return entries;});
})();
