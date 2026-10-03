(function(){
 var back=document.getElementById('back');if(back){back.addEventListener('click',function(){if(history.length>1)history.back();else location.href='index.html';});return;}
 var form=document.querySelector('[data-assessment]'),key='bingqing_'+form.dataset.assessment;
 function restore(saved){if(!saved)return;Array.from(form.elements).forEach(function(input){if(!input.name)return;var value=saved[input.name];if(input.name==='painRegions'&&Array.isArray(value))value=value.join(',');if(input.type==='radio'||input.type==='checkbox')input.checked=Array.isArray(value)?value.includes(input.value):value===input.value;else if(value!==undefined&&value!==null)input.value=value;});
  // pain DETECT 人体图：按 painRegions 恢复选中部位
  var regions=form.elements.painRegions;if(regions){var list=regions.value.split(',');form.querySelectorAll('.body-zone').forEach(function(zone){zone.setAttribute('aria-pressed',list.includes(zone.dataset.region)?'true':'false');});}
  if(typeof updateRanges==='function')updateRanges();}
 // 录入流程：数据来自 /api/fms/patient/case/detail 的 bqpg.{量表}，保存提交到 /api/fms/patient/case/add（part=bqpg）。
 var scaleKey=form.dataset.assessment==='pain-detect'?'painDetect':form.dataset.assessment;
 var editing=window.CaseEdit&&CaseEdit.active();
 if(editing)CaseEdit.load('bqpg.'+scaleKey).then(restore).catch(function(e){CaseView.notice('已保存的数据加载失败：'+e.message);});
 else{try{restore(JSON.parse(localStorage.getItem(key)||'null'));}catch(e){}}
 function updateRanges(){form.querySelectorAll('input[type=range]').forEach(function(input){var out=input.nextElementSibling.querySelector('output');out.value=input.value;});}
 form.addEventListener('input',updateRanges);updateRanges();
 form.addEventListener('submit',function(event){event.preventDefault();var values={};Array.from(form.elements).forEach(function(input){if(!input.name)return;if(input.type==='checkbox'){if(!values[input.name])values[input.name]=[];if(input.checked)values[input.name].push(input.value);}else if(input.type==='radio'){if(input.checked)values[input.name]=input.value;}else values[input.name]=input.value;});if(editing){var button=form.querySelector('[type=submit]'),payload={};form.querySelectorAll('input[type=range]').forEach(function(input){if(values[input.name]!==undefined)values[input.name]=Number(values[input.name]);});if(typeof values.painRegions==='string')values.painRegions=values.painRegions?values.painRegions.split(','):[];values.finish=true;payload[scaleKey]=values;button.disabled=true;CaseEdit.save('bqpg',payload).then(function(){location.href='index.html';}).catch(function(e){button.disabled=false;form.querySelector('.error').textContent=e.name==='AbortError'?'保存超时，请稍后重试':e.message;});return;}
  try{localStorage.setItem(key,JSON.stringify(values));location.href='index.html';}catch(e){form.querySelector('.error').textContent='保存失败，请检查浏览器存储设置';}});
})();
