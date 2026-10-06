(function(){
  var key='benbing_xiyao_records';
  var sample=[{medication:'艾司唑仑',spec:'1mg',dose:'1',unit:'mg',frequency:'日1次',route:'口服',startDate:'',ongoing:'是',endDate:'',reason:''}];
  var records;
  try { var stored=localStorage.getItem(key); records=stored===null?sample:JSON.parse(stored); if(!Array.isArray(records))records=sample; } catch(e){records=sample;}
  var list=document.getElementById('medList');
  document.getElementById('empty').hidden=records.length>0;
  records.forEach(function(item,index){
    var li=document.createElement('li');li.className='med-item';
    var a=document.createElement('a');a.href='add-xiyao.html?edit='+index;a.setAttribute('aria-label','编辑'+item.medication);
    var copy=document.createElement('span'),name=document.createElement('strong'),summary=document.createElement('small'),arrow=document.createElement('span');
    name.textContent=item.medication||'未命名西药';summary.textContent=[item.frequency,item.dose?'单次'+item.dose+(item.unit||''):null].filter(Boolean).join('，');
    arrow.className='chevron';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');
    copy.append(name,summary);a.append(copy,arrow);li.appendChild(a);list.appendChild(li);
  });
})();
