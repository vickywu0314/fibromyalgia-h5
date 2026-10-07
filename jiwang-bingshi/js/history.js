/* 合并疾病：记录存于病例草稿 jbxx.diseaseHistory（数组，每条 {category, categoryLabel, name}；按新版 PDF 只有疾病名称，无病程/诊断时间）；
   类别：风湿性疾病 + 其他系统疾病（呼吸/消化/循环/内分泌和代谢/肾病/骨科/生殖/精神心理/慢性重叠疼痛），各类“其他”需填写疾病名称。
   列表页“保存并返回”写 jbxx.diseaseHistoryFinish = true（基本信息页入口据此显示完成状态）。 */
(function(){
 var BACK='../fibromyalgia-basic-info/basic-info.html',CATEGORIES=['fengshi','huxi','xiaohua','xunhuan','neifenmi','shen','guke','shengzhi','xinli','tengtong'];
 var page=document.querySelector('[data-page]'),view=page.dataset.page;
 function read(){var v=FmsCase.get('jbxx.diseaseHistory');return Array.isArray(v)?v.filter(function(r){return r&&typeof r==='object';}):[];}
 var records=read(),renderList=function(){};
 // 进度：列表页 / 选择类别页 = 本模块需要回答的「合并疾病」1 项（已添加≥1条记录，或已保存确认无记录时算已答）；
 // 各类别表单页 = 本条记录表单的已填项 / 应填项（疾病选择；选「其他」时再加疾病名称），由 ../js/fms-progress.js 统计。
 function moduleProgress(){var rs=read();if(window.FmsProgress)FmsProgress.set(rs.length||FmsCase.get('jbxx.diseaseHistoryFinish')?1:0,1);}
 if(view==='list'||view==='choose'){moduleProgress();window.addEventListener('pageshow',function(e){if(e.persisted){records=read();moduleProgress();if(view==='list')renderList();}});}
 if(view==='list'){
  var list=document.getElementById('records');
  renderList=function(){list.innerHTML='';document.getElementById('empty').hidden=records.length>0;
  records.forEach(function(record,index){var li=document.createElement('li'),link=document.createElement('a'),text=document.createElement('span'),name=document.createElement('strong'),info=document.createElement('small'),arrow=document.createElement('em');link.href=(CATEGORIES.indexOf(record.category)>=0?record.category+'.html?edit='+index:'choose.html');name.textContent=record.categoryLabel||record.name;info.textContent=record.name||'';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');text.append(name,info);link.append(text,arrow);li.appendChild(link);list.appendChild(li);});};
  renderList();
  document.getElementById('back').addEventListener('click',function(){
   FmsCase.save('jbxx',{diseaseHistory:records,diseaseHistoryFinish:true},{merge:true,back:BACK,button:this});
  });
  return;
 }
 if(view==='choose')return;
 var form=document.getElementById('historyForm'),category=page.dataset.category,chosen=form.elements.disease,hasChoices=!!chosen,other=document.getElementById('otherWrap'),otherInput=form.elements.otherName,error=document.getElementById('error'),submitBtn=form.querySelector('button[type="submit"]'),params=new URLSearchParams(location.search),edit=params.has('edit')?Number(params.get('edit')):-1,editing=Number.isInteger(edit)&&edit>=0&&edit<records.length&&records[edit].category===category;
 if(editing){var saved=records[edit];if(hasChoices){var radio=[].slice.call(form.querySelectorAll('input[name="disease"]')).find(function(input){return input.value===saved.name&&input.value!=='其他';});chosen.value=radio?saved.name:'其他';otherInput.value=radio?'':saved.name;}else otherInput.value=saved.name||'';}
 // “其他”选中时才显示“疾病名称”；未选中时隐藏、禁用并清空。顶层“其他”类别没有单选项，名称始终显示。
 function refresh(){if(!hasChoices)return;var show=chosen.value==='其他';other.hidden=!show;otherInput.disabled=!show;if(!show)otherInput.value='';}
 form.addEventListener('change',refresh);refresh();
 if(window.FmsProgress)FmsProgress.track(form);
 // 编辑已有记录时提供“删除此记录”
 if(editing){var del=document.createElement('button');del.type='button';del.className='secondary';del.textContent='删除此记录';del.style.marginTop='12px';submitBtn.insertAdjacentElement('afterend',del);
  del.addEventListener('click',function(){if(!del.dataset.done){if(!confirm('确定删除这条合并疾病记录吗？'))return;records.splice(edit,1);del.dataset.done='1';submitBtn.disabled=true;}FmsCase.save('jbxx.diseaseHistory',records,{back:'index.html',button:del});});}
 form.addEventListener('submit',function(event){event.preventDefault();error.textContent='';var useOther=!hasChoices||chosen.value==='其他',name=useOther?otherInput.value.trim():chosen.value;
  if(!name){error.textContent=hasChoices&&!chosen.value?'请选择疾病':'请输入疾病名称';return;}
  var record={category:category,categoryLabel:document.title,name:name};if(editing)records[edit]=record;else{records.push(record);edit=records.length-1;editing=true;} // 提交失败重试时不重复新增
  FmsCase.save('jbxx.diseaseHistory',records,{back:'index.html',button:submitBtn});
 });
})();
