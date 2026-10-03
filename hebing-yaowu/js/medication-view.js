// 合并药物查看页：数据为 /api/fms/patient/case/detail 的 jbxx.concomitantMedication，只读展示。
(function(){
 var list=document.getElementById('entries'),empty=document.getElementById('empty');
 document.getElementById('back').addEventListener('click',function(){history.back();});
 CaseView.load('jbxx.concomitantMedication').then(function(items){
  items=Array.isArray(items)?items:[];
  empty.textContent='暂无合并药物';empty.hidden=items.length>0;
  items.forEach(function(item){var li=document.createElement('li'),text=document.createElement('div');text.textContent=typeof item==='string'?item:item.name;li.appendChild(text);list.appendChild(li);});
 }).catch(function(error){empty.hidden=true;CaseView.notice(error.message);});
})();
