(() => {
/* 本次治疗方案：西药 / 中药饮片 / 中成药 / 非药物疗法（字段按规格 PDF） */
const key = k => 'zhiliao-fangan:' + k;
const read = k => { try { const d = localStorage.getItem(key(k)); const v = d === null ? [] : JSON.parse(d); return Array.isArray(v) ? v : [] } catch { return [] } };
const readMeta = k => { try { return JSON.parse(localStorage.getItem(key(k + ':meta')) || '{}') || {} } catch { return {} } };
const write = (k, v) => localStorage.setItem(key(k), JSON.stringify(v));
const writeMeta = (k, v) => localStorage.setItem(key(k + ':meta'), JSON.stringify(v));
const el = (tag, text = '', cls = '') => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; return n };
const opts = (select, list, placeholder) => select.replaceChildren(new Option(placeholder, ''), ...list.map(v => new Option(v, v)));
const radios = (holder, name, list) => { holder.replaceChildren(...list.map(v => { const l = el('label'), i = document.createElement('input'); i.type = 'radio'; i.name = name; i.value = v; l.append(i, el('span', v)); return l })) };
/* 条件显示：隐藏时禁用并清空子区域内的输入 */
const toggle = (box, show) => {
  if (!box) return;
  box.hidden = !show;
  box.querySelectorAll('input,select,textarea').forEach(i => {
    i.disabled = !show;
    if (!show) { if (i.type === 'radio' || i.type === 'checkbox') i.checked = false; else if (i.type !== 'file') i.value = '' }
  });
};
const META = {
  xiyao: { title: '西药', adjustLegend: '是否调整西药', adjustType: 'drug', hasUse: false },
  zhongchengyao: { title: '中成药', adjustLegend: '是否调整中成药', adjustType: 'drug', hasUse: true },
  'fei-yaowu': { title: '非药物疗法', adjustLegend: '是否调整非药物疗法', adjustType: 'nonDrug', hasUse: true },
  'zhongyao-yinpian': { title: '中药饮片' }
};
const describe = (k, v) => {
  if (k === 'zhongyao-yinpian') return [v.syndrome, v.supplement ? '补充：' + v.supplement : ''].filter(Boolean).join(' · ');
  if (k === 'fei-yaowu') return [v.duration ? `单次${v.duration}${v.unit || '分钟'}` : '', v.frequency].filter(Boolean).join('，');
  return [k === 'xiyao' ? (v.route || '口服') : '', v.dose ? v.dose + (v.unit || '') : '', v.frequency].filter(Boolean).join('，');
};
const titleOf = (k, v) => k === 'zhongyao-yinpian' ? (v.recipe || v.name || '') : (v.name || '');

const page = document.querySelector('[data-page]');
const back = document.getElementById('back'); if (back) back.onclick = () => history.length > 1 ? history.back() : location.assign('index.html');
if (!page) return;
const kind = page.dataset.kind;

/* ---------- 类别页：记录列表 + 无/有 + 是否调整 ---------- */
if (page.dataset.page === 'list') {
  const items = read(kind), list = document.getElementById('records');
  document.getElementById('empty').hidden = items.length > 0;
  items.forEach((v, i) => { const a = el('a'); a.href = `add-${kind}.html?edit=${i}`; const t = el('span'); t.append(el('strong', titleOf(kind, v)), el('small', describe(kind, v))); a.append(t, el('span', '›', 'arrow')); const li = el('li'); li.append(a); list.append(li) });
  const form = document.getElementById('metaForm'); if (!form) return;
  const cfg = META[kind], meta = readMeta(kind), error = document.getElementById('error');
  const details = document.getElementById('details'), adjust = document.getElementById('adjustDetails');
  radios(document.getElementById('adjustContent'), '调整内容', window.ADJUST[cfg.adjustType]);
  radios(document.getElementById('adjustReason'), '调整原因', window.ADJUST.reasons);
  const checked = n => form.querySelector(`[name="${n}"]:checked`)?.value || '';
  const check = (n, v) => { const r = v && form.querySelector(`[name="${n}"][value="${v}"]`); if (r) r.checked = true };
  check('是否使用', meta.use); check('是否调整', meta.adjust); check('调整内容', meta.adjustment); check('调整原因', meta.reason);
  const current = () => ({ use: cfg.hasUse ? checked('是否使用') : '', adjust: checked('是否调整'), adjustment: checked('调整内容'), reason: checked('调整原因') });
  const sync = () => {
    if (cfg.hasUse) toggle(details, checked('是否使用') === '有');
    toggle(adjust, checked('是否调整') === '是');
  };
  sync();
  /* 选项变化即暂存，便于跳转到“添加”页面后返回不丢失 */
  form.addEventListener('change', () => { sync(); try { writeMeta(kind, current()) } catch {} });
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    const m = current();
    if (cfg.hasUse && !m.use) { error.textContent = '请选择“无”或“有”'; return }
    if (m.use !== '无') {
      if (!m.adjust) { error.textContent = `请选择${cfg.adjustLegend}`; return }
      if (m.adjust === '是' && (!m.adjustment || !m.reason)) { error.textContent = '请选择调整内容和调整原因'; return }
    }
    try { writeMeta(kind, m); if (m.use === '无') write(kind, []); location.href = 'index.html' } catch { error.textContent = '保存失败，请重试' }
  });
  return;
}

/* ---------- 汇总页 ---------- */
if (page.dataset.page === 'summary') {
  const root = document.getElementById('summary');
  ['xiyao', 'zhongyao-yinpian', 'zhongchengyao', 'fei-yaowu'].forEach(k => {
    const cfg = META[k], meta = readMeta(k), section = el('section', '', 'summary-section'); section.append(el('h2', cfg.title));
    const items = meta.use === '无' ? [] : read(k);
    if (meta.use === '无') section.append(el('p', '无', 'summary-empty'));
    else if (!items.length) section.append(el('p', '暂无记录', 'summary-empty'));
    items.forEach(v => {
      const article = el('article', '', 'summary-item');
      if (k === 'zhongyao-yinpian') {
        article.append(el('p', v.syndrome || '', 'summary-syndrome'), el('p', v.recipe || '', 'summary-recipe'));
        if (v.herbs?.length) article.append(el('p', '组成：' + v.herbs.join('，'), 'summary-prescription'));
        if (v.supplement) article.append(el('p', '补充药物：' + v.supplement, 'summary-prescription'));
        if (v.image) { const img = document.createElement('img'); img.src = v.image; img.alt = '处方图片'; img.className = 'summary-image'; article.append(img) }
      } else {
        article.append(el('h3', v.name), el('p', describe(k, v), 'summary-detail'));
      }
      section.append(article);
    });
    if (cfg.adjustLegend && meta.use !== '无' && meta.adjust) {
      section.append(el('p', `${cfg.adjustLegend}：${meta.adjust}` + (meta.adjust === '是' ? `（调整内容：${meta.adjustment || ''}；调整原因：${meta.reason || ''}）` : ''), 'summary-detail'));
    }
    root.append(section);
  });
  return;
}

/* ---------- 添加/编辑页 ---------- */
if (page.dataset.page !== 'form') return;
const form = document.getElementById('planForm'), field = n => form.elements.namedItem(n), error = document.getElementById('error');
const records = read(kind), params = new URLSearchParams(location.search), index = Number(params.get('edit'));
const editing = params.has('edit') && Number.isInteger(index) && index >= 0 && index < records.length;
const editItem = editing ? records[index] : null;
const save = item => { if (editing) records[index] = item; else records.push(item); try { write(kind, records); location.href = `${kind}.html` } catch { error.textContent = '本地存储空间不足，请更换小一些的图片' } };
const del = document.getElementById('deleteItem');
if (del) { del.hidden = !editing; del.addEventListener('click', () => { if (!confirm('确定删除该记录？')) return; records.splice(index, 1); write(kind, records); location.href = `${kind}.html` }) }

if (kind === 'zhongyao-yinpian') {
  const recipes = window.DECOCTIONS || {}, checked = n => form.querySelector(`[name="${n}"]:checked`)?.value || '';
  const recipeBox = document.getElementById('recipeBox'), recipeChoices = document.getElementById('recipeChoices'), herbBox = document.getElementById('herbBox'), herbList = document.getElementById('herbList');
  radios(document.getElementById('syndromeChoices'), '中医证型', Object.keys(recipes));
  const renderRecipes = () => { const s = checked('中医证型'); radios(recipeChoices, '方剂', Object.keys(recipes[s] || {})); toggle(recipeBox, !!s); renderHerbs() };
  const renderHerbs = () => { const herbs = recipes[checked('中医证型')]?.[checked('方剂')] || []; herbList.replaceChildren(...herbs.map(h => el('li', h))); herbBox.hidden = !herbs.length };
  form.addEventListener('change', e => { if (e.target.name === '中医证型') renderRecipes(); if (e.target.name === '方剂') renderHerbs() });
  const supplement = field('supplement'), upload = document.getElementById('treatmentPhoto'), camera = document.getElementById('cameraPhoto'), preview = document.getElementById('photoPreview'), container = document.getElementById('photoContainer'), status = document.getElementById('photoStatus');
  const showPhoto = (src, message) => { preview.src = src; container.hidden = false; status.textContent = message };
  renderRecipes();
  if (editItem) {
    const r = form.querySelector(`[name="中医证型"][value="${editItem.syndrome}"]`); if (r) { r.checked = true; renderRecipes() }
    const p = form.querySelector(`[name="方剂"][value="${editItem.recipe}"]`); if (p) { p.checked = true; renderHerbs() }
    supplement.value = editItem.supplement || ''; if (editItem.image) showPhoto(editItem.image, '已上传处方图片');
  }
  document.getElementById('choosePhoto').addEventListener('click', () => upload.click());
  document.getElementById('takePhoto').addEventListener('click', () => camera.click());
  document.getElementById('removePhoto').addEventListener('click', () => { preview.removeAttribute('src'); container.hidden = true; upload.value = ''; camera.value = ''; status.textContent = '已删除图片，可重新上传'; error.textContent = '' });
  const handleImage = input => {
    const f = input.files?.[0]; if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(f.type) || f.size > 5 * 1024 * 1024) { error.textContent = '请选择不超过 5MB 的 JPG、PNG 或 GIF 图片'; input.value = ''; return }
    error.textContent = ''; status.textContent = '正在处理图片…';
    const reader = new FileReader(); reader.onerror = () => { error.textContent = '图片读取失败，请重新选择'; status.textContent = '尚未上传图片' };
    reader.onload = () => {
      const original = reader.result;
      if (f.type === 'image/gif') { showPhoto(original, '已选择处方图片：' + f.name); return }
      const image = new Image(); image.onerror = () => { error.textContent = '图片无法预览，请重新选择'; status.textContent = '尚未上传图片' };
      image.onload = () => { const ratio = Math.min(1, 1600 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); showPhoto(canvas.toDataURL('image/jpeg', 0.78), '已选择处方图片：' + f.name) };
      image.src = original;
    }; reader.readAsDataURL(f);
  };
  upload.addEventListener('change', () => handleImage(upload)); camera.addEventListener('change', () => handleImage(camera));
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    const syndrome = checked('中医证型'), recipe = checked('方剂');
    if (!syndrome) { error.textContent = '请选择中医证型'; return }
    if (!recipe) { error.textContent = '请选择方剂'; return }
    save({ syndrome, recipe, herbs: recipes[syndrome][recipe], supplement: supplement.value.trim(), image: !container.hidden ? preview.src : '' });
  });
  return;
}

/* 西药 / 中成药 / 非药物疗法 */
const nameSel = field('name'), details = document.getElementById('details'), doseSel = field('dose'), freqSel = field('frequency'), unitEl = document.getElementById('unit');
const isNonDrug = kind === 'fei-yaowu';
const catalog = kind === 'xiyao' ? window.WESTERN_DRUGS : kind === 'zhongchengyao' ? window.PATENT_DRUGS : null;
const custom = field('customName'), customBox = document.getElementById('customBox');
opts(nameSel, isNonDrug ? window.NON_DRUG.names : catalog.map(d => d.name), isNonDrug ? '请选择非药物疗法' : '请选择药物');
if (isNonDrug) { opts(doseSel, window.NON_DRUG.durations, '请选择单次时长'); opts(freqSel, window.NON_DRUG.freqs, '请选择频次'); unitEl.textContent = window.NON_DRUG.unit }
const drugOf = n => catalog?.find(d => d.name === n);
const renderDrug = () => {
  const n = nameSel.value;
  if (isNonDrug) { toggle(customBox, n === '其他'); toggle(details, !!n); return }
  const d = drugOf(n); toggle(details, !!d); if (!d) return;
  const spec = document.getElementById('specRow'); if (spec) { spec.hidden = !d.spec; document.getElementById('specValue').textContent = d.spec }
  opts(doseSel, d.doses, '请选择单次剂量'); opts(freqSel, d.freqs, '请选择频次'); unitEl.textContent = d.unit;
  if (d.doses.length === 1) doseSel.value = d.doses[0];
  if (d.freqs.length === 1) freqSel.value = d.freqs[0];
  const route = field('route'); if (route) route.checked = true;
};
nameSel.addEventListener('change', renderDrug);
renderDrug();
if (editItem) {
  const names = [...nameSel.options].map(o => o.value);
  if (isNonDrug && editItem.name && !names.includes(editItem.name)) { nameSel.value = '其他'; renderDrug(); custom.value = editItem.name }
  else { nameSel.value = editItem.name || ''; renderDrug() }
  if (editItem.customName && custom) custom.value = editItem.customName;
  doseSel.value = (isNonDrug ? editItem.duration : editItem.dose) || doseSel.value; freqSel.value = editItem.frequency || freqSel.value;
}
form.addEventListener('submit', e => {
  e.preventDefault(); error.textContent = '';
  const n = nameSel.value;
  if (!n) { error.textContent = isNonDrug ? '请选择非药物名称' : '请选择药物'; return }
  if (isNonDrug) {
    const name = n === '其他' ? custom.value.trim() : n;
    if (!name) { error.textContent = '请填写其他非药物疗法名称'; return }
    if (!doseSel.value || !freqSel.value) { error.textContent = '请选择单次时长和频次'; return }
    save({ name, duration: doseSel.value, unit: window.NON_DRUG.unit, frequency: freqSel.value });
    return;
  }
  const d = drugOf(n);
  if (!doseSel.value || !freqSel.value) { error.textContent = '请选择单次剂量和频次'; return }
  const item = { name: n, dose: doseSel.value, unit: d.unit, frequency: freqSel.value };
  if (kind === 'xiyao') Object.assign(item, { spec: d.spec, route: d.route });
  save(item);
});
})();
