(function(){
  var key='benbing_xiyao_records',form=document.getElementById('medForm'),detail=document.getElementById('detail');
  var custom=document.getElementById('customField'),end=document.getElementById('endDateRow'),reason=document.getElementById('reasonRow'),message=document.getElementById('message');
  var params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1;
  function records(){try{var value=localStorage.getItem(key);var result=value===null?[{medication:'艾司唑仑',frequency:'日1次',dose:'1',startDate:'',ongoing:'是',endDate:'',reason:''}]:JSON.parse(value);return Array.isArray(result)?result:[];}catch(e){return [];}}
  function refresh(){var none=form.elements.hasMedication.value==='无',stopped=form.elements.ongoing.value==='否';detail.hidden=none;custom.hidden=form.elements.medication.value!=='其他';end.hidden=!stopped;reason.hidden=!stopped;}
  form.addEventListener('change',refresh);
  var all=records();
  if(Number.isInteger(edit)&&edit>=0&&edit<all.length){var item=all[edit];form.elements.hasMedication.value='有';form.elements.medication.value=[...form.elements.medication.options].some(function(o){return o.value===item.medication;})?item.medication:'其他';if(form.elements.medication.value==='其他')form.elements.customMedication.value=item.medication;['frequency','dose','startDate','ongoing','endDate','reason'].forEach(function(field){form.elements[field].value=item[field]||'';});}
  refresh();
  form.addEventListener('submit',function(event){event.preventDefault();message.textContent='';
    if(form.elements.hasMedication.value==='无'){localStorage.setItem(key,JSON.stringify([]));location.href='xiyao.html';return;}
    if(!form.elements.medication.value){message.textContent='请选择西药';return;}
    var medication=form.elements.medication.value==='其他'?form.elements.customMedication.value.trim():form.elements.medication.value;
    if(!medication){message.textContent='请输入西药名称';return;}
    if(!form.elements.frequency.value||!form.elements.dose.value){message.textContent='请选择频次和用量';return;}
    if(form.elements.ongoing.value==='否'&&form.elements.startDate.value&&form.elements.endDate.value&&form.elements.endDate.value<form.elements.startDate.value){message.textContent='结束日期不能早于开始日期';return;}
    var item={medication:medication,frequency:form.elements.frequency.value,dose:form.elements.dose.value,unit:'片/粒',startDate:form.elements.startDate.value,ongoing:form.elements.ongoing.value,endDate:form.elements.ongoing.value==='否'?form.elements.endDate.value:'',reason:form.elements.ongoing.value==='否'?form.elements.reason.value:''};
    if(edit>=0&&edit<all.length)all[edit]=item;else all.push(item);
    try{localStorage.setItem(key,JSON.stringify(all));location.href='xiyao.html';}catch(e){message.textContent='保存失败，请检查浏览器存储设置';}
  });
})();
