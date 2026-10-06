(() => {
/* 本次治疗方案：西药 / 中药饮片 / 中成药 / 非药物疗法（字段按规格 PDF）
 * 数据只存病例草稿 FmsCase 的 zlfa：
 * { finish, xiyao[], zhongchengyao[], feiYaowu[], zhongyaoYinpian[],
 *   xiyaoAdjust{adjust,adjustment,reason}, hasZhongchengyao, zhongchengyaoAdjust{...}, hasFeiYaowu, feiYaowuAdjust{...} }
 * 类别级的调整信息同时复制到该类每条记录的 adjust/adjustment/reason 上（结构体按记录读取）。 */
const LISTS = ['xiyao', 'zhongchengyao', 'feiYaowu', 'zhongyaoYinpian'];
const KIND = {
  xiyao: { key: 'xiyao', adjKey: 'xiyaoAdjust', hasKey: '' },
  zhongchengyao: { key: 'zhongchengyao', adjKey: 'zhongchengyaoAdjust', hasKey: 'hasZhongchengyao' },
  'fei-yaowu': { key: 'feiYaowu', adjKey: 'feiYaowuAdjust', hasKey: 'hasFeiYaowu' },
  'zhongyao-yinpian': { key: 'zhongyaoYinpian' }
};
/* 读草稿（深拷贝，保证各数组存在） */
const loadZ = () => {
  let z = {};
  try { z = JSON.parse(JSON.stringify(FmsCase.get('zlfa') || {})) } catch {}
  if (!z || typeof z !== 'object' || Array.isArray(z)) z = {};
  LISTS.forEach(k => { if (!Array.isArray(z[k])) z[k] = [] });
  if (typeof z.finish !== 'boolean') z.finish = false;
  return z;
};
/* 把类别级调整信息复制到该类每条记录 */
const applyAdjust = z => {
  Object.values(KIND).forEach(c => {
    if (!c.adjKey) return;
    const a = z[c.adjKey] || {};
    z[c.key] = z[c.key].map(r => Object.assign({}, r, { adjust: a.adjust || '', adjustment: a.adjustment || '', reason: a.reason || '' }));
  });
  return z;
};
const read = k => loadZ()[KIND[k].key];
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
  if (k === 'zhongyao-yinpian') return [v.syndrome, v.prescription ? '补充：' + v.prescription : ''].filter(Boolean).join(' · ');
  if (k === 'fei-yaowu') return [v.duration ? `单次${v.duration}${v.unit || '分钟'}` : '', v.frequency].filter(Boolean).join('，');
  return [k === 'xiyao' ? (v.route || '口服') : '', v.dose ? v.dose + (v.unit || '') : '', v.frequency].filter(Boolean).join('，');
};
const titleOf = (k, v) => k === 'zhongyao-yinpian' ? (v.recipe || v.name || '') : (v.customName || v.name || '');

const page = document.querySelector('[data-page]');
if (!page) return;
const kind = page.dataset.kind;

/* ---------- 入口页：各类填写状态 + 保存并返回 ---------- */
if (page.dataset.page === 'index') {
  const z = loadZ();
  const statusOf = k => {
    const c = KIND[k], n = z[c.key].length;
    if (c.hasKey && z[c.hasKey] === '无') return ['无', true];
    if (n) return [`已填 ${n} 条`, true];
    if (c.hasKey && z[c.hasKey] === '有') return ['已选“有”，未添加', false];
    return ['未填', false];
  };
  document.querySelectorAll('[data-kind-link]').forEach(a => {
    const [text, done] = statusOf(a.dataset.kindLink);
    const s = el('span', text, 'status' + (done ? ' done' : ''));
    a.insertBefore(s, a.querySelector('.arrow'));
  });
  const btn = document.getElementById('saveAll');
  btn.addEventListener('click', () => {
    FmsCase.save('zlfa', Object.assign(applyAdjust(loadZ()), { finish: true }), { back: '../patient-detail.html', button: btn });
  });
  return;
}

/* ---------- 类别页：记录列表 + 无/有 + 是否调整 ---------- */
if (page.dataset.page === 'list') {
  const items = read(kind), list = document.getElementById('records');
  document.getElementById('empty').hidden = items.length > 0;
  items.forEach((v, i) => { const a = el('a'); a.href = `add-${kind}.html?edit=${i}`; const t = el('span'); t.append(el('strong', titleOf(kind, v)), el('small', describe(kind, v))); a.append(t, el('span', '›', 'arrow')); const li = el('li'); li.append(a); list.append(li) });
  const form = document.getElementById('metaForm'); if (!form) return;
  const cfg = META[kind], ck = KIND[kind], z0 = loadZ(), error = document.getElementById('error');
  const meta = Object.assign({ use: ck.hasKey ? z0[ck.hasKey] || '' : '' }, z0[ck.adjKey] || {});
  const details = document.getElementById('details'), adjust = document.getElementById('adjustDetails');
  radios(document.getElementById('adjustContent'), '调整内容', window.ADJUST[cfg.adjustType]);
  radios(document.getElementById('adjustReason'), '调整原因', window.ADJUST.reasons);
  const checked = n => form.querySelector(`[name="${n}"]:checked`)?.value || '';
  const check = (n, v) => { const r = v && form.querySelector(`[name="${n}"][value="${v}"]`); if (r) r.checked = true };
  check('是否使用', meta.use); check('是否调整', meta.adjust); check('调整内容', meta.adjustment); check('调整原因', meta.reason);
  const current = () => ({ use: cfg.hasUse ? checked('是否使用') : '', adjust: checked('是否调整'), adjustment: checked('调整内容'), reason: checked('调整原因') });
  /* 当前选项写入 zlfa（类别级字段 + 复制到每条记录） */
  const build = (clearIfNone) => {
    const z = loadZ(), m = current();
    if (ck.hasKey) z[ck.hasKey] = m.use;
    z[ck.adjKey] = { adjust: m.adjust, adjustment: m.adjustment, reason: m.reason };
    if (clearIfNone && m.use === '无') z[ck.key] = [];
    return applyAdjust(z);
  };
  const sync = () => {
    if (cfg.hasUse) toggle(details, checked('是否使用') === '有');
    toggle(adjust, checked('是否调整') === '是');
  };
  sync();
  /* 选项变化即写草稿（不提交），便于跳转到“添加”页面后返回不丢失 */
  form.addEventListener('change', () => { sync(); try { FmsCase.set('zlfa', build(false)) } catch {} });
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    const m = current();
    if (cfg.hasUse && !m.use) { error.textContent = '请选择“无”或“有”'; return }
    if (m.use !== '无') {
      if (!m.adjust) { error.textContent = `请选择${cfg.adjustLegend}`; return }
      if (m.adjust === '是' && (!m.adjustment || !m.reason)) { error.textContent = '请选择调整内容和调整原因'; return }
    }
    FmsCase.save('zlfa', build(true), { back: 'index.html', button: form.querySelector('button[type=submit]') });
  });
  return;
}

/* ---------- 汇总页（读草稿） ---------- */
if (page.dataset.page === 'summary') {
  const root = document.getElementById('summary'), z = loadZ();
  ['xiyao', 'zhongyao-yinpian', 'zhongchengyao', 'fei-yaowu'].forEach(k => {
    const cfg = META[k], ck = KIND[k], section = el('section', '', 'summary-section'); section.append(el('h2', cfg.title));
    const none = !!ck.hasKey && z[ck.hasKey] === '无';
    const items = none ? [] : z[ck.key];
    const meta = (ck.adjKey && z[ck.adjKey]) || {};
    if (none) section.append(el('p', '无', 'summary-empty'));
    else if (!items.length) section.append(el('p', '暂无记录', 'summary-empty'));
    items.forEach(v => {
      const article = el('article', '', 'summary-item');
      if (k === 'zhongyao-yinpian') {
        article.append(el('p', v.syndrome || '', 'summary-syndrome'), el('p', v.recipe || '', 'summary-recipe'));
        if (v.composition?.length) article.append(el('p', '组成：' + v.composition.join('，'), 'summary-prescription'));
        if (v.prescription) article.append(el('p', '补充药物：' + v.prescription, 'summary-prescription'));
        if (v.image) { const img = document.createElement('img'); img.src = v.image; img.alt = '处方图片'; img.className = 'summary-image'; article.append(img) }
      } else {
        article.append(el('h3', titleOf(k, v)), el('p', describe(k, v), 'summary-detail'));
      }
      section.append(article);
    });
    if (cfg.adjustLegend && !none && meta.adjust) {
      section.append(el('p', `${cfg.adjustLegend}：${meta.adjust}` + (meta.adjust === '是' ? `（调整内容：${meta.adjustment || ''}；调整原因：${meta.reason || ''}）` : ''), 'summary-detail'));
    }
    root.append(section);
  });
  return;
}

/* ---------- 添加/编辑页 ---------- */
if (page.dataset.page !== 'form') return;
const form = document.getElementById('planForm'), field = n => form.elements.namedItem(n), error = document.getElementById('error');
const listKey = KIND[kind].key, listPage = `${kind}.html`;
const records = read(kind), params = new URLSearchParams(location.search), index = Number(params.get('edit'));
const editing = params.has('edit') && Number.isInteger(index) && index >= 0 && index < records.length;
const editItem = editing ? records[index] : null;
/* 新增成功写入草稿后记住下标：提交失败再点保存时改为覆盖，避免重复新增 */
let slot = editing ? index : null, deleted = false;
const submitBtn = form.querySelector('button[type=submit]');
const save = item => {
  const z = loadZ();
  if (slot != null && slot < z[listKey].length) z[listKey][slot] = item;
  else { z[listKey].push(item); slot = z[listKey].length - 1 }
  FmsCase.save('zlfa', applyAdjust(z), { back: listPage, button: submitBtn });
};
const del = document.getElementById('deleteItem');
if (del) {
  del.hidden = !editing;
  del.addEventListener('click', () => {
    if (!deleted && !confirm('确定删除该记录？')) return;
    const z = loadZ();
    if (!deleted) { z[listKey].splice(index, 1); deleted = true }
    FmsCase.save('zlfa', applyAdjust(z), { back: listPage, button: del });
  });
}

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
    supplement.value = editItem.prescription || ''; if (editItem.image) showPhoto(editItem.image, '已上传处方图片');
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
    /* image：暂无图片上传接口，存压缩后的 dataURL */
    save({ name: '中药饮片', syndrome, recipe, composition: (recipes[syndrome][recipe] || []).slice(), prescription: supplement.value.trim(), image: !container.hidden && preview.getAttribute('src') ? preview.src : '' });
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
  if (isNonDrug && (editItem.customName || (editItem.name && !names.includes(editItem.name)))) { nameSel.value = '其他'; renderDrug(); custom.value = editItem.customName || editItem.name }
  else { nameSel.value = editItem.name || ''; renderDrug() }
  doseSel.value = (isNonDrug ? editItem.duration : editItem.dose) || doseSel.value; freqSel.value = editItem.frequency || freqSel.value;
}
/* 保留编辑前记录上的其它字段（如 category/instructions），调整字段由 applyAdjust 统一覆盖 */
const base = editItem && editItem.name ? editItem : {};
form.addEventListener('submit', e => {
  e.preventDefault(); error.textContent = '';
  const n = nameSel.value;
  if (!n) { error.textContent = isNonDrug ? '请选择非药物名称' : '请选择药物'; return }
  if (isNonDrug) {
    const customName = n === '其他' ? custom.value.trim() : '';
    if (n === '其他' && !customName) { error.textContent = '请填写其他非药物疗法名称'; return }
    if (!doseSel.value || !freqSel.value) { error.textContent = '请选择单次时长和频次'; return }
    /* name：选“其他”时取填写的名称，customName 同时保存该名称（非“其他”为空串） */
    save({ name: customName || n, customName, duration: doseSel.value, unit: window.NON_DRUG.unit, frequency: freqSel.value, adjust: '', adjustment: '', reason: '' });
    return;
  }
  const d = drugOf(n);
  if (!doseSel.value || !freqSel.value) { error.textContent = '请选择单次剂量和频次'; return }
  save({
    name: n, category: base.category || '', dose: doseSel.value, unit: d.unit, frequency: freqSel.value,
    spec: d.spec || '', route: kind === 'xiyao' ? (form.querySelector('[name="route"]:checked')?.value || d.route || '口服') : (d.route || ''),
    instructions: base.instructions || '', adjust: '', adjustment: '', reason: ''
  });
});
})();
