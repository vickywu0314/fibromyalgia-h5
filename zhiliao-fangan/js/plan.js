(() => {
const kinds=[['xiyao','西药'],['zhongyao-yinpian','中药饮片'],['zhongchengyao','中成药'],['fei-yaowu','非药物疗法']];
const sample={xiyao:[{name:'普瑞巴林胶囊',category:'改善纤维肌痛综合征病情药物',dose:'75',frequency:'日1次'}],zhongchengyao:[{name:'乌灵胶囊',dose:'1',frequency:'日1次',unit:'粒'}],'zhongyao-yinpian':[{name:'蠲痹汤',syndrome:'肝郁气滞证',recipe:'蠲痹汤',prescription:'羌活，独活，桂枝，秦艽，海风藤，当归，川芎，乳香，木香，桑枝，甘草'}],'fei-yaowu':[{name:'八段锦',duration:'60',frequency:'每周一次'}]};
const key=k=>'zhiliao-fangan:'+k;
const read=k=>{try{const data=localStorage.getItem(key(k));return data===null?(sample[k]||[]):JSON.parse(data)}catch{return sample[k]||[]}};
const write=(k,v)=>localStorage.setItem(key(k),JSON.stringify(v));
const describe=(k,v)=>k==='zhongyao-yinpian'?(v.syndrome||'')+(v.prescription?' · '+v.prescription:''):k==='fei-yaowu'?`${v.frequency||''}，单次${v.duration||''}分钟`:[v.dose?`${v.dose}${v.unit||(k==='zhongchengyao'?'粒':'mg')}`:'',v.frequency].filter(Boolean).join('，');
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n};
const kitchenRoute=(k,v)=>k==='zhongyao-yinpian'&&v.name==='口服中药汤剂'?'add-zhongyao-tangji.html':`add-${k}.html`;
const page=document.querySelector('[data-page]');const back=document.getElementById('back');if(back)back.onclick=()=>history.length>1?history.back():location.assign('index.html');if(!page)return;
const kind=page.dataset.kind;
if(page.dataset.page==='list'){
 const items=read(kind),list=document.getElementById('records');document.getElementById('empty').hidden=items.length>0;
 items.forEach((v,i)=>{const a=el('a');a.href=kitchenRoute(kind,v)+`?edit=${i}`;const t=el('span');t.append(el('strong',v.name),el('small',describe(kind,v)));a.append(t,el('span','›','arrow'));const li=el('li');li.append(a);list.append(li)});
}
if(page.dataset.page==='summary'){
 const root=document.getElementById('summary');
 const freq=v=>({'日1次':'每日一次','日2次':'每日两次','日3次':'每日三次','晚1次':'每晚一次'}[v]||v||'');
 const groups=[['xiyao','西药'],['zhongchengyao','中成药'],['zhongyao-yinpian','中药饮片'],['fei-yaowu','非药物疗法']];
 groups.forEach(([k,title])=>{
  const section=el('section','','summary-section');section.append(el('h2',title));
  const items=read(k);
  if(!items.length)section.append(el('p','暂无记录','summary-empty'));
  items.forEach(v=>{
   const article=el('article','','summary-item');
   if(k==='zhongyao-yinpian'){
    article.append(el('p',v.syndrome||'','summary-syndrome'),el('p',v.recipe||v.name,'summary-recipe'));
    if(v.prescription)article.append(el('p',v.prescription,'summary-prescription'));
    if(v.image){const img=document.createElement('img');img.src=v.image;img.alt='处方图片';img.className='summary-image';article.append(img)}
   }else{
    article.append(el('h3',v.name));
    let detail='';
    if(k==='fei-yaowu')detail=`${v.frequency||''}，单次${v.duration||''}分钟`;
    else if(k==='zhongchengyao')detail=[freq(v.frequency),v.dose?`${v.dose}${v.unit||'粒'}`:''].filter(Boolean).join('，');
    else detail=['口服',v.dose?`${v.dose}${v.unit||'mg'}`:'',freq(v.frequency)].filter(Boolean).join('，');
    article.append(el('p',detail,'summary-detail'));
   }
   section.append(article);
  });
  root.append(section);
 });
}
if(page.dataset.page!=='form')return;
const form=document.getElementById('planForm'),field=n=>form.elements.namedItem(n),value=n=>field(n)?.value||'',error=document.getElementById('error'),records=read(kind),index=Number(new URLSearchParams(location.search).get('edit')),editing=new URLSearchParams(location.search).has('edit')&&Number.isInteger(index)&&index>=0&&index<records.length;
const set=(n,v)=>{if(!v||!field(n))return;const inputs=[...form.querySelectorAll(`[name="${n}"]`)];const radio=inputs.find(x=>x.type==='radio'&&x.value===v);if(radio)radio.checked=true;else if(inputs[0]?.type!=='radio')inputs[0].value=v};
// 录入流程中保存后把该类列表整组提交到服务端（zlfa.{类别}），成功再返回列表。
const done=()=>{const go=()=>{location.href=`${kind}.html`};if(window.CaseEdit)CaseEdit.commitThen(key(kind),go,m=>{error.textContent=m});else go()};
const save=item=>{if(editing)records[index]=item;else records.push(item);try{write(kind,records)}catch{error.textContent='本地存储空间不足，请更换小一些的图片';return}done()};
if(kind==='zhongyao-yinpian'){
 const selected=n=>form.querySelector(`[name="${n}"]:checked`)?.value||'',prescription=field('prescription'),upload=document.getElementById('treatmentPhoto'),camera=document.getElementById('cameraPhoto'),preview=document.getElementById('photoPreview'),container=document.getElementById('photoContainer'),status=document.getElementById('photoStatus');
 const recipes=window.DECOCTIONS||{};
 form.addEventListener('change',e=>{if(['中医证型','处方类型'].includes(e.target.name)){const match=recipes[selected('中医证型')]?.[selected('处方类型')];if(match&&prescription)prescription.value=match}});
 const showPhoto=(src,message)=>{preview.src=src;container.hidden=false;status.textContent=message};
 if(editing){const v=records[index];set('中医证型',v.syndrome);set('主要中医证型',v.syndrome);set('处方类型',v.recipe);if(prescription)prescription.value=v.prescription||'';if(v.image)showPhoto(v.image,'已上传处方图片')}
 document.getElementById('choosePhoto').addEventListener('click',()=>upload.click());
 document.getElementById('takePhoto').addEventListener('click',()=>camera.click());
 document.getElementById('removePhoto').addEventListener('click',()=>{preview.removeAttribute('src');container.hidden=true;upload.value='';camera.value='';status.textContent='已删除图片，可重新上传';error.textContent=''});
 const handleImage=input=>{
  const f=input.files?.[0];if(!f)return;
  if(!['image/jpeg','image/png','image/gif'].includes(f.type)||f.size>5*1024*1024){error.textContent='请选择不超过 5MB 的 JPG、PNG 或 GIF 图片';input.value='';return}
  error.textContent='';status.textContent='正在处理图片…';
  const reader=new FileReader();reader.onerror=()=>{error.textContent='图片读取失败，请重新选择';status.textContent='尚未上传图片'};
  reader.onload=()=>{
   const original=reader.result;
   if(f.type==='image/gif'){showPhoto(original,'已选择处方图片：'+f.name);return}
   const image=new Image();image.onerror=()=>{error.textContent='图片无法预览，请重新选择';status.textContent='尚未上传图片'};
   image.onload=()=>{const ratio=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);showPhoto(canvas.toDataURL('image/jpeg',0.78),'已选择处方图片：'+f.name)};
   image.src=original;
  };reader.readAsDataURL(f)
 };
 upload.addEventListener('change',()=>handleImage(upload));camera.addEventListener('change',()=>handleImage(camera));
 form.addEventListener('submit',e=>{e.preventDefault();const syndrome=selected('中医证型')||selected('主要中医证型');if(!syndrome){error.textContent='请选择中医证型';return}const recipe=selected('处方类型');const item={name:recipe||'口服中药汤剂',syndrome,recipe,prescription:prescription?.value.trim()||'',image:container&&!container.hidden?preview.src:''};
 // 录入流程中处方图片上传后保存图片 URL，不保存 base64。
 if(window.CaseEdit&&CaseEdit.active()&&item.image.startsWith('data:')){status.textContent='正在上传处方图片…';CaseEdit.uploadDataUrl(item.image,'prescription.jpg').then(url=>{item.image=url;save(item)}).catch(e=>{error.textContent=e.message;status.textContent='图片上传失败'});return}
 save(item)});return;
}
const details=document.getElementById('details'),adjust=document.getElementById('adjustDetails'),custom=field('customName');
let renderDrugs=()=>{};
if(kind==='xiyao'&&window.WESTERN_CATALOG){
 const catalog=window.WESTERN_CATALOG,category=field('category'),holder=document.getElementById('drugChoices'),dose=field('dose'),otherDose=field('customDose');
 const defaults={'普瑞巴林胶囊':'75','苯磺酸美洛加巴林片':'5','苯磺酸克利加巴林胶囊':'20','加巴喷丁胶囊':'300','盐酸度洛西汀肠溶胶囊':'20','氟哌噻吨美利曲片':'1','右佐匹克隆':'3','环苯扎林':'15'};
 const doseFor=name=>{const v=defaults[name]||(category.value==='非甾体抗炎类药物'?'':'20');dose.replaceChildren(new Option('请选择剂量',''),...[...new Set([v,'1','3','5','15','20','75','150','300'].filter(Boolean))].map(n=>new Option(n,n)));dose.value=v};
 renderDrugs=selected=>{holder.replaceChildren();(catalog[category.value]||[]).forEach(name=>{const label=el('label','','drug-option'),input=document.createElement('input');input.type='radio';input.name='药物名称';input.value=name;input.checked=name===selected;label.append(input,el('span',name));holder.append(label)});dose.closest('.field').hidden=category.value==='非甾体抗炎类药物'||category.value==='其他';otherDose.closest('.field').hidden=category.value!=='其他';document.getElementById('doseUnit').textContent=category.value==='改善焦虑、抑郁药物'?'片':'mg';if(selected)doseFor(selected)};
 category.addEventListener('change',()=>{renderDrugs();sync()});holder.addEventListener('change',e=>{if(e.target.name==='药物名称')doseFor(e.target.value)});renderDrugs(editing?records[index].name:'');
}
const sync=()=>{details.hidden=value('是否使用')!=='有';if(adjust)adjust.hidden=value('是否调整')!=='是';if(custom)custom.hidden=kind==='xiyao'?value('category')!=='其他':value('name')!=='其他'};
if(editing){const v=records[index];set('是否使用','有');for(const n of ['category','frequency','duration','instructions','是否调整','调整内容','调整原因'])set(n,{'是否调整':v.adjust,'调整内容':v.adjustment,'调整原因':v.reason}[n]||v[n]);if(kind==='xiyao'){renderDrugs(v.name);set('药物名称',v.name);set('dose',v.dose);if(field('customDose'))field('customDose').value=v.dose||'';if(v.category==='其他'&&custom)custom.value=v.name}else if(field('name')){const names=[...field('name').options].map(o=>o.value);set('name',names.includes(v.name)?v.name:'其他');if(!names.includes(v.name)&&custom)custom.value=v.name;set('dose',v.dose)}}
form.addEventListener('change',sync);sync();
form.addEventListener('submit',e=>{e.preventDefault();error.textContent='';if(!value('是否使用')){error.textContent='请选择“无”或“有”';return}if(value('是否使用')==='无'){write(kind,[]);done();return}
 const name=kind==='xiyao'&&value('category')==='其他'?custom?.value.trim():value('药物名称')||(value('name')==='其他'?custom?.value.trim():value('name'));
 if(!name){error.textContent='请选择或填写名称';return}
 const dose=kind==='xiyao'&&value('category')==='其他'?value('customDose'):value('dose');
 const item={name,category:value('category'),dose,duration:value('duration'),frequency:value('frequency'),instructions:value('instructions'),unit:kind==='zhongchengyao'?'粒':kind==='xiyao'&&value('category')==='改善焦虑、抑郁药物'?'片':'mg',adjust:value('是否调整'),adjustment:value('调整内容'),reason:value('调整原因')};
 if(kind==='xiyao'&&(!item.frequency||(value('category')!=='非甾体抗炎类药物'&&!item.dose))){error.textContent='请选择剂量和频次';return}
 if(kind==='fei-yaowu'&&(!item.duration||!item.frequency)){error.textContent='请选择单次时长和频次';return}
 if(item.adjust==='是'&&(!item.adjustment||!item.reason)){error.textContent='请选择调整内容和调整原因';return}
 save(item)
});
})();
