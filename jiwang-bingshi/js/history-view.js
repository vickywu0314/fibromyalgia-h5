// 既往疾病史查看页：数据为 /api/fms/patient/case/detail 的 jbxx.diseaseHistory，只读展示。
(function(){
 var list=document.getElementById('records'),empty=document.getElementById('empty');
 document.getElementById('back').addEventListener('click',function(){history.back();});
 CaseView.load('jbxx.diseaseHistory').then(function(records){
  records=Array.isArray(records)?records:[];
  empty.textContent='暂无既往疾病记录';empty.hidden=records.length>0;
  records.forEach(function(record){var li=document.createElement('li'),text=document.createElement('div'),name=document.createElement('strong'),info=document.createElement('small');name.textContent=record.name;info.textContent=[record.categoryLabel,record.years!=null&&record.years!==''?'病程'+record.years+'年':''].filter(Boolean).join('，');text.append(name,info);li.appendChild(text);list.appendChild(li);});
 }).catch(function(error){empty.hidden=true;CaseView.notice(error.message);});
})();
