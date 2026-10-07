(function(){
 // 病情评估：每个量表边填边自动保存草稿（bingqing_<量表>），并把完成情况汇总到 bingqing_status，供列表页显示
 var STATUS_KEY='bingqing_status';
 var SCALES=['vas','fiqr','pcs','mfi20','psqi','had','sf12','pain-detect','cfq'];
 function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(e){return fallback;}}
 function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
 function setProgress(answered,total){
  var bar=document.querySelector('.progress'),fill=bar&&bar.querySelector('span'),text=document.querySelector('.progress-block p');
  var pct=total?Math.round(answered/total*100):0;
  if(fill)fill.style.width=pct+'%';
  if(bar)bar.setAttribute('aria-valuenow',String(pct));
  if(text)text.textContent='已完成'+pct+'%';
 }

 var back=document.getElementById('back');
 if(back){
  // 列表页：显示每个量表的状态和整体进度；从量表页返回（含页面缓存恢复）时刷新
  back.addEventListener('click',function(){if(history.length>1)history.back();else location.href='index.html';});
  var renderList=function(){
   var status=readJSON(STATUS_KEY,{}),done=0;
   document.querySelectorAll('.menu a').forEach(function(link){
    var id=link.getAttribute('href').replace('.html',''),s=status[id],badge=link.querySelector('.state');
    if(!badge){badge=document.createElement('em');badge.className='state';link.insertBefore(badge,link.lastElementChild);}
    if(s&&s.total&&s.answered>=s.total){badge.className='state done';badge.textContent='✓ 已完成';done++;}
    else if(s&&s.answered>0){badge.className='state partial';badge.textContent='已填 '+s.answered+'/'+s.total;}
    else{badge.className='state';badge.textContent='未填写';}
   });
   setProgress(done,SCALES.length);
  };
  renderList();
  window.addEventListener('pageshow',renderList);
  return;
 }

 var form=document.querySelector('[data-assessment]'),id=form.dataset.assessment,key='bingqing_'+id;
 var saved=readJSON(key,null),touched={};
 if(saved){
  (saved.__touched||[]).forEach(function(n){touched[n]=true;});
  Array.from(form.elements).forEach(function(input){if(!input.name)return;var value=saved[input.name];if(input.type==='radio'||input.type==='checkbox')input.checked=Array.isArray(value)?value.includes(input.value):value===input.value;else if(value!==undefined)input.value=value;});
 }
 // 计入完成度的题目：每个 name 算一题；补充说明类文本框不计
 function questionNames(){
  var names=[];
  Array.from(form.elements).forEach(function(input){if(!input.name||input.type==='text'||input.tagName==='TEXTAREA'||input.disabled)return;if(names.indexOf(input.name)<0)names.push(input.name);});
  return names;
 }
 function isAnswered(name){
  var inputs=Array.from(form.elements).filter(function(x){return x.name===name;}),first=inputs[0];
  if(first.type==='radio'||first.type==='checkbox')return inputs.some(function(x){return x.checked;});
  if(first.type==='range')return !!touched[name];
  return String(first.value).trim()!=='';
 }
 function collect(){
  var values={};
  Array.from(form.elements).forEach(function(input){if(!input.name)return;if(input.type==='checkbox'){if(!values[input.name])values[input.name]=[];if(input.checked)values[input.name].push(input.value);}else if(input.type==='radio'){if(input.checked)values[input.name]=input.value;}else if(input.type==='range'){if(touched[input.name])values[input.name]=input.value;}else values[input.name]=input.value;});
  values.__touched=Object.keys(touched);
  return values;
 }
 function persist(){
  var names=questionNames(),answered=names.filter(isAnswered).length,status=readJSON(STATUS_KEY,{});
  status[id]={answered:answered,total:names.length,updatedAt:Date.now()};
  setProgress(answered,names.length);
  return writeJSON(key,collect())&&writeJSON(STATUS_KEY,status);
 }
 function updateRanges(){form.querySelectorAll('input[type=range]').forEach(function(input){var out=input.nextElementSibling&&input.nextElementSibling.querySelector('output');if(out)out.value=input.value;});}
 function onEdit(event){var t=event.target;if(t&&t.type==='range')touched[t.name]=true;updateRanges();persist();}
 form.addEventListener('input',onEdit);form.addEventListener('change',onEdit);
 updateRanges();
 var names=questionNames();setProgress(names.filter(isAnswered).length,names.length);
 form.addEventListener('submit',function(event){event.preventDefault();if(persist())location.href='index.html';else form.querySelector('.error').textContent='保存失败，请检查浏览器存储设置';});
})();
