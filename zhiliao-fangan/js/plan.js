(() => {
const sample={xiyao:[{name:'普瑞巴林胶囊',category:'改善纤维肌痛综合征病情药物',dose:'75',unit:'mg',frequency:'日1次',adjust:'否'}],zhongchengyao:[{name:'乌灵胶囊',dose:'1',unit:'粒',frequency:'日1次',adjust:'否'}],'zhongyao-yinpian':[{name:'蠲痹汤',syndrome:'寒湿痹阻证',recipe:'蠲痹汤',herbs:['羌活','独活','桂枝','秦艽','海风藤','当归','川芎','乳香','木香','桑枝','甘草'],supplement:''}],'fei-yaowu':[{name:'八段锦',duration:'30',unit:'分钟',frequency:'一周1次',adjust:'否'}]};
const key=k=>'zhiliao-fangan:'+k;
const read=k=>{try{const data=localStorage.getItem(key(k));return data===null?(sample[k]||[]):JSON.parse(data)}catch{return sample[k]||[]}};
const write=(k,v)=>localStorage.setItem(key(k),JSON.stringify(v));
// 中药汤剂处方文字：组成药物 + 补充药物（兼容旧记录的 prescription 字段）
const recipeText=v=>[Array.isArray(v.herbs)&&v.herbs.length?v.herbs.join('，'):v.prescription||'',v.supplement?'补充：'+v.supplement:''].filter(Boolean).join('；');
const doseText=(k,v)=>v.dose?`${v.dose}${v.unit||(k==='zhongchengyao'?'粒':'mg')}`:'';
const describe=(k,v)=>k==='zhongyao-yinpian'?[v.syndrome,v.recipe,recipeText(v)].filter(Boolean).join(' · '):k==='fei-yaowu'?`${v.frequency||''}，单次${v.duration||''}${v.unit||'分钟'}`:[k==='xiyao'?v.category:'',doseText(k,v),v.frequency].filter(Boolean).join('，');
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n};
const route=k=>k==='zhongyao-yinpian'?'add-zhongyao-tangji.html':`add-${k}.html`;
const fillSelect=(select,placeholder,values)=>{select.replaceChildren(new Option(placeholder,''),...values.map(v=>new Option(v,v)));if(values.length===1)select.value=values[0]};
const page=document.querySelector('[data-page]');const back=document.getElementById('back');if(back)back.onclick=()=>history.length>1?history.back():location.assign('index.html');if(!page)return;
const kind=page.dataset.kind;
if(page.dataset.page==='list'){
 const items=read(kind),list=document.getElementById('records');document.getElementById('empty').hidden=items.length>0;
 items.forEach((v,i)=>{const a=el('a');a.href=route(kind)+`?edit=${i}`;const t=el('span');t.append(el('strong',v.name),el('small',describe(kind,v)));a.append(t,el('span','›','arrow'));const li=el('li');li.append(a);list.append(li)});
}
if(page.dataset.page==='summary'){
 const root=document.getElementById('summary');
 const freq=v=>({'日1次':'每日一次','日2次':'每日两次','日3次':'每日三次','日4次':'每日四次','晚1次':'每晚一次'}[v]||v||'');
 const groups=[['xiyao','西药'],['zhongyao-yinpian','中药汤剂'],['zhongchengyao','中成药'],['fei-yaowu','非药物疗法']];
 groups.forEach(([k,title])=>{
  const section=el('section','','summary-section');section.append(el('h2',title));
  const items=read(k);
  if(!items.length)section.append(el('p','暂无记录','summary-empty'));
  items.forEach(v=>{
   const article=el('article','','summary-item');
   if(k==='zhongyao-yinpian'){
    article.append(el('p',v.syndrome||'','summary-syndrome'),el('p',v.recipe||v.name,'summary-recipe'));
    const text=recipeText(v);if(text)article.append(el('p',text,'summary-prescription'));
    if(v.image){const img=document.createElement('img');img.src=v.image;img.alt='处方图片';img.className='summary-image';article.append(img)}
   }else{
    article.append(el('h3',v.name));
    let detail='';
    if(k==='fei-yaowu')detail=`${v.frequency||''}，单次${v.duration||''}${v.unit||'分钟'}`;
    else if(k==='zhongchengyao')detail=[freq(v.frequency),doseText(k,v)].filter(Boolean).join('，');
    else detail=['口服',doseText(k,v),freq(v.frequency)].filter(Boolean).join('，');
    article.append(el('p',detail,'summary-detail'));
    if(v.adjust==='是')article.append(el('p',`调整：${v.adjustment||''}（${v.reason||''}）`,'summary-detail'));
   }
   section.append(article);
  });
  root.append(section);
 });
}
if(page.dataset.page!=='form')return;
const form=document.getElementById('planForm'),field=n=>form.elements.namedItem(n),value=n=>field(n)?.value||'',error=document.getElementById('error'),records=read(kind),index=Number(new URLSearchParams(location.search).get('edit')),editing=new URLSearchParams(location.search).has('edit')&&Number.isInteger(index)&&index>=0&&index<records.length;
const selected=n=>form.querySelector(`[name="${n}"]:checked`)?.value||'';
const set=(n,v)=>{if(!v||!field(n))return;const inputs=[...form.querySelectorAll(`[name="${n}"]`)];const radio=inputs.find(x=>x.type==='radio'&&x.value===v);if(radio)radio.checked=true;else if(inputs[0]?.type!=='radio')inputs[0].value=v};
const save=item=>{if(editing)records[index]=item;else records.push(item);try{write(kind,records);location.href=`${kind}.html`}catch{error.textContent='本地存储空间不足，请更换小一些的图片'}};
const radioList=(holder,name,values,checked,type='radio')=>{holder.replaceChildren(...values.map(v=>{const label=el('label','','drug-option'),input=document.createElement('input');input.type=type;input.name=name;input.value=v;input.checked=Array.isArray(checked)?checked.includes(v):v===checked;label.append(input,el('span',v));return label}))};

if(kind==='zhongyao-yinpian'){
 const recipes=window.DECOCTIONS||{},supplement=field('supplement'),recipeGroup=document.getElementById('recipeGroup'),recipeHolder=document.getElementById('recipeChoices'),herbGroup=document.getElementById('herbGroup'),herbHolder=document.getElementById('herbChoices');
 const upload=document.getElementById('treatmentPhoto'),camera=document.getElementById('cameraPhoto'),preview=document.getElementById('photoPreview'),container=document.getElementById('photoContainer'),status=document.getElementById('photoStatus');
 // 证型 → 方剂（仅一个方剂时自动选中）→ 组成药物（默认全选，可取消）
 const renderRecipes=checked=>{const names=Object.keys(recipes[selected('主要中医证型')]||{});radioList(recipeHolder,'方剂',names,checked||(names.length===1?names[0]:''));recipeGroup.hidden=!names.length};
 const renderHerbs=checked=>{const herbs=recipes[selected('主要中医证型')]?.[selected('方剂')]||[];radioList(herbHolder,'组成药物',herbs,checked||herbs,'checkbox');herbGroup.hidden=!herbs.length};
 form.addEventListener('change',e=>{if(e.target.name==='主要中医证型'){renderRecipes();renderHerbs()}else if(e.target.name==='方剂')renderHerbs()});
 const showPhoto=(src,message)=>{preview.src=src;container.hidden=false;status.textContent=message};
 if(editing){const v=records[index];set('主要中医证型',v.syndrome);renderRecipes(v.recipe);renderHerbs(Array.isArray(v.herbs)?v.herbs:undefined);if(supplement)supplement.value=v.supplement||(Array.isArray(v.herbs)?'':v.prescription||'');if(v.image)showPhoto(v.image,'已上传处方图片')}
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
 form.addEventListener('submit',e=>{e.preventDefault();error.textContent='';const syndrome=selected('主要中医证型');if(!syndrome){error.textContent='请选择主要中医证型';return}const recipe=selected('方剂');if(!recipe){error.textContent='请选择方剂';return}const herbs=[...form.querySelectorAll('[name="组成药物"]:checked')].map(x=>x.value);save({name:recipe,syndrome,recipe,herbs,supplement:supplement?.value.trim()||'',image:container&&!container.hidden?preview.src:''})});
 return;
}

const details=document.getElementById('details'),adjust=document.getElementById('adjustDetails'),custom=field('customName'),customField=document.getElementById('customNameField');
const dose=field('dose'),frequency=field('frequency'),doseField=document.getElementById('doseField'),frequencyField=document.getElementById('frequencyField'),doseUnit=document.getElementById('doseUnit');
let currentDrug=()=>null,syncKind=()=>{};

if(kind==='xiyao'){
 const catalog=window.WESTERN_CATALOG||{},category=field('category'),holder=document.getElementById('drugChoices'),drugGroup=document.getElementById('drugGroup'),otherDoseField=document.getElementById('customDoseField');
 currentDrug=()=>catalog[category.value]?.[selected('药物名称')]||null;
 const applyDrug=()=>{const d=currentDrug()||{};fillSelect(dose,'请选择剂量',d.doses||[]);fillSelect(frequency,'请选择频次',category.value==='其他'?window.WESTERN_OTHER_FREQUENCIES||[]:d.frequencies||[]);doseUnit.textContent=d.unit||'mg'};
 const renderDrugs=checked=>{radioList(holder,'药物名称',Object.keys(catalog[category.value]||{}),checked);applyDrug()};
 syncKind=()=>{const c=category.value,other=c==='其他',nsaid=c==='非甾体抗炎类药物',d=currentDrug();drugGroup.hidden=!c||other;customField.hidden=!other;otherDoseField.hidden=!other;doseField.hidden=other||nsaid||!d;frequencyField.hidden=nsaid||!(other||d)};
 category.addEventListener('change',()=>renderDrugs(''));holder.addEventListener('change',e=>{if(e.target.name==='药物名称')applyDrug()});
 if(editing){const v=records[index];set('category',v.category);renderDrugs(v.category==='其他'?'':v.name);if(v.category==='其他'){custom.value=v.name||'';field('customDose').value=v.dose||''}else set('dose',v.dose);set('frequency',v.frequency)}else renderDrugs('');
}
if(kind==='zhongchengyao'){
 const catalog=window.PATENT_CATALOG||{},name=field('name');
 fillSelect(name,'请选择中成药',Object.keys(catalog));
 currentDrug=()=>catalog[name.value]||null;
 const applyDrug=()=>{const d=currentDrug()||{};fillSelect(dose,'请选择单次剂量',d.doses||[]);fillSelect(frequency,'请选择频次',d.frequencies||[]);doseUnit.textContent=d.unit||''};
 syncKind=()=>{const d=currentDrug();doseField.hidden=!d;frequencyField.hidden=!d};
 name.addEventListener('change',applyDrug);
 if(editing){const v=records[index];set('name',v.name);applyDrug();set('dose',v.dose);set('frequency',v.frequency)}else applyDrug();
}
if(kind==='fei-yaowu'){
 syncKind=()=>{customField.hidden=value('name')!=='其他'};
 if(editing){const v=records[index],names=[...field('name').options].map(o=>o.value);set('name',names.includes(v.name)?v.name:'其他');if(!names.includes(v.name))custom.value=v.name||'';set('duration',v.duration);set('frequency',v.frequency)}
}

const sync=()=>{details.hidden=selected('是否使用')!=='有';adjust.hidden=selected('是否调整')!=='是';syncKind()};
if(editing){const v=records[index];set('是否使用','有');set('是否调整',v.adjust);set('调整内容',v.adjustment);set('调整原因',v.reason)}
form.addEventListener('change',sync);sync();
form.addEventListener('submit',e=>{e.preventDefault();error.textContent='';
 if(!selected('是否使用')){error.textContent='请选择“无”或“有”';return}
 if(selected('是否使用')==='无'){write(kind,[]);location.href=`${kind}.html`;return}
 const item={name:'',dose:'',frequency:value('frequency'),adjust:selected('是否调整'),adjustment:selected('调整内容'),reason:selected('调整原因')};
 if(kind==='xiyao'){
  const c=value('category');if(!c){error.textContent='请选择药物分类';return}
  item.category=c;
  if(c==='其他'){item.name=custom.value.trim();item.dose=value('customDose');item.unit='mg';if(!item.name){error.textContent='请填写药品名称';return}if(!item.dose||!item.frequency){error.textContent='请填写用量并选择频次';return}}
  else{item.name=selected('药物名称');if(!item.name){error.textContent='请选择药品';return}
   if(c!=='非甾体抗炎类药物'){item.dose=value('dose');item.unit=currentDrug()?.unit||'mg';if(!item.dose||!item.frequency){error.textContent='请选择剂量和频次';return}}else item.frequency=''}
 }else if(kind==='zhongchengyao'){
  item.name=value('name');if(!item.name){error.textContent='请选择中成药';return}
  item.dose=value('dose');item.unit=currentDrug()?.unit||'';if(!item.dose||!item.frequency){error.textContent='请选择单次剂量和频次';return}
 }else{
  item.name=value('name')==='其他'?custom.value.trim():value('name');if(!item.name){error.textContent=value('name')==='其他'?'请填写治疗名称':'请选择非药物疗法';return}
  item.duration=value('duration');item.unit='分钟';if(!item.duration||!item.frequency){error.textContent='请选择单次时长和频次';return}
 }
 if(!item.adjust){error.textContent='请选择是否调整';return}
 if(item.adjust==='是'&&(!item.adjustment||!item.reason)){error.textContent='请选择调整内容和调整原因';return}
 if(item.adjust!=='是'){item.adjustment='';item.reason=''}
 save(item)
});
})();
