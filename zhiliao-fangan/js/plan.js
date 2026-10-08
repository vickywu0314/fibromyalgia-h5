(() => {
/* 本次治疗方案：西药 / 中药汤剂 / 中成药 / 非药物疗法（字段按规格 PDF）
 * 数据只存病例草稿 FmsCase 的 zlfa：
 * { finish, hasXiyao, xiyao[], xiyaoCategoryAdjust{药物分类:{adjust,adjustment,reason}}, xiyaoAdjust{...汇总},
 *   zhongyaoYinpian[]（中药汤剂，key 沿用）, hasZhongchengyao, zhongchengyao[], zhongchengyaoAdjust{...},
 *   hasFeiYaowu, feiYaowu[], feiYaowuAdjust{...} }
 * 调整信息同时复制到每条记录的 adjust/adjustment/reason 上（结构体按记录读取）；
 * 西药按药物分类各答一次「是否调整西药」，xiyaoAdjust 为各分类的汇总（任一分类为“是”即“是”，内容/原因写成「分类：值」以；分隔）。 */
const LISTS = ['xiyao', 'zhongchengyao', 'feiYaowu', 'zhongyaoYinpian'];
const KIND = {
  xiyao: { key: 'xiyao', adjKey: 'xiyaoAdjust', hasKey: 'hasXiyao', catAdjKey: 'xiyaoCategoryAdjust' },
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
/* 西药药物分类（顺序同 PDF）；旧记录没有分类的归入“其他” */
const XI_CATS = ['改善纤维肌痛综合征病情药物', '改善焦虑、抑郁药物', '助眠药', '非甾体抗炎类药物', '肌松药', '其他'];
const catOf = r => XI_CATS.includes(r && r.category) ? r.category : '其他';
const pickAdj = a => ({ adjust: (a && a.adjust) || '', adjustment: (a && a.adjustment) || '', reason: (a && a.reason) || '' });
/* 西药：按分类复制到记录，并生成 xiyaoAdjust 汇总 */
const applyXiyaoAdjust = z => {
  const m = (z.xiyaoCategoryAdjust && typeof z.xiyaoCategoryAdjust === 'object') ? z.xiyaoCategoryAdjust : {};
  const used = XI_CATS.filter(c => z.xiyao.some(r => catOf(r) === c));
  z.xiyaoCategoryAdjust = {};
  used.forEach(c => { z.xiyaoCategoryAdjust[c] = pickAdj(m[c]) });
  z.xiyao = z.xiyao.map(r => Object.assign({}, r, { category: catOf(r) }, z.xiyaoCategoryAdjust[catOf(r)]));
  const yes = used.filter(c => z.xiyaoCategoryAdjust[c].adjust === '是');
  z.xiyaoAdjust = {
    adjust: yes.length ? '是' : (used.length && used.every(c => z.xiyaoCategoryAdjust[c].adjust === '否') ? '否' : ''),
    adjustment: yes.map(c => `${c}：${z.xiyaoCategoryAdjust[c].adjustment}`).join('；'),
    reason: yes.map(c => `${c}：${z.xiyaoCategoryAdjust[c].reason}`).join('；')
  };
};
/* 把类别级调整信息复制到该类每条记录 */
const applyAdjust = z => {
  Object.values(KIND).forEach(c => {
    if (!c.adjKey) return;
    if (c.catAdjKey) { applyXiyaoAdjust(z); return }
    const a = z[c.adjKey] || {};
    z[c.key] = z[c.key].map(r => Object.assign({}, r, { adjust: a.adjust || '', adjustment: a.adjustment || '', reason: a.reason || '' }));
  });
  return z;
};
/* ---------- 各类别完成状态（入口页状态、进度共用） ----------
 * 西药 / 中成药 / 非药物疗法：选“无” → 已完成；选“有”且至少 1 条记录、是否调整已答（选“是”时调整内容/原因也已选） → 已完成；
 *   已选“有”但缺记录或缺是否调整 → 填写中；什么都没选 → 未填写。
 * 中药汤剂页面没有“无/有”：有记录 → 已完成；没有记录时，治疗方案整体已保存（zlfa.finish）视为“无” → 已完成，否则未填写。 */
const ORDER = ['xiyao', 'zhongyao-yinpian', 'zhongchengyao', 'fei-yaowu'];
const REQUIRED = ['xiyao', 'zhongchengyao', 'fei-yaowu'];
const adjDone = a => !!(a && a.adjust) && (a.adjust !== '是' || (!!a.adjustment && !!a.reason));
const catState = (z, k) => {
  const c = KIND[k], n = z[c.key].length;
  if (!c.hasKey) return n ? ['done', `已添加 ${n} 条`] : z.finish ? ['done', '无'] : ['none', '尚未添加'];
  const use = z[c.hasKey] || (n ? '有' : '');
  if (use === '无') return ['done', '无'];
  if (!use) return ['none', '尚未选择无/有'];
  if (!n) return ['doing', '已选“有”，尚未添加记录'];
  const ok = c.catAdjKey
    ? XI_CATS.filter(cat => z[c.key].some(r => catOf(r) === cat)).every(cat => adjDone((z[c.catAdjKey] || {})[cat]))
    : adjDone(z[c.adjKey]);
  return ok ? ['done', `已添加 ${n} 条`] : ['doing', `已添加 ${n} 条，是否调整未填写完整`];
};
const doneCount = z => ORDER.filter(k => catState(z, k)[0] === 'done').length;
const allRequiredDone = z => REQUIRED.every(k => catState(z, k)[0] === 'done');
/* 已保存（finish=true）后若某类又变得不完整，取消 finish，入口页回到“填写中” */
/* 各类别非必填：保存过的治疗方案不会因为类别没填完而变回未完成 */
const keepFinish = z => z;
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
  xiyao: { title: '西药', adjustLegend: '是否调整西药', adjustType: 'drug', hasUse: true },
  zhongchengyao: { title: '中成药', adjustLegend: '是否调整中成药', adjustType: 'drug', hasUse: true },
  'fei-yaowu': { title: '非药物疗法', adjustLegend: '是否调整非药物疗法', adjustType: 'nonDrug', hasUse: true },
  'zhongyao-yinpian': { title: '中药汤剂' }
};
const describe = (k, v) => {
  if (k === 'zhongyao-yinpian') return [v.syndrome, v.prescription ? '补充：' + v.prescription : ''].filter(Boolean).join(' · ');
  if (k === 'fei-yaowu') return [v.duration ? `单次${v.duration}${v.unit || '分钟'}` : '', v.frequency].filter(Boolean).join('，');
  return [v.dose ? v.dose + (v.unit || '') : '', v.frequency].filter(Boolean).join('，');
};
const titleOf = (k, v) => k === 'zhongyao-yinpian' ? (v.recipe || v.name || '') : (v.customName || v.name || '');

const page = document.querySelector('[data-page]');
if (!page) return;
const kind = page.dataset.kind;

/* ---------- 入口页：各类填写状态 + 保存并返回 ---------- */
if (page.dataset.page === 'index') {
  const LABEL = { none: '未填写', doing: '填写中', done: '已完成' };
  /* 进度 = 已完成类别数 / 4；从类别页返回（含浏览器页面缓存）时重新读取草稿刷新 */
  const render = () => {
    const z = loadZ();
    document.querySelectorAll('[data-kind-link]').forEach(a => {
      const [state, detail] = catState(z, a.dataset.kindLink);
      let s = a.querySelector('.status');
      if (!s) { s = el('span'); a.insertBefore(s, a.querySelector('.arrow')) }
      s.textContent = LABEL[state]; s.title = detail; s.className = 'status ' + state;
    });
    FmsProgress.set(doneCount(z), ORDER.length);
  };
  render();
  window.addEventListener('pageshow', e => { if (e.persisted) render() });
  const btn = document.getElementById('saveAll');
  btn.addEventListener('click', () => {
    const z = applyAdjust(loadZ());
    /* 各类别都不是必填：添没添加、添加几个都可以直接保存返回 */
    FmsCase.save('zlfa', Object.assign(z, { finish: true }), { back: '../patient-detail.html', button: btn });
  });
  return;
}
/* 类别页 / 添加页：从下一级页面通过浏览器返回（页面缓存）时重新加载，显示最新草稿 */
window.addEventListener('pageshow', e => { if (e.persisted) location.reload() });

/* ---------- 西药类别页：无/有 → 各药物分类（是否调整西药 + 药品列表 + 添加） ---------- */
if (page.dataset.page === 'list' && kind === 'xiyao') {
  const form = document.getElementById('metaForm'), z0 = loadZ(), error = document.getElementById('error');
  const details = document.getElementById('details'), holder = document.getElementById('categories');
  const catMap = z0.xiyaoCategoryAdjust || {};
  const checked = n => form.querySelector(`[name="${n}"]:checked`)?.value || '';
  const check = (n, v) => { const r = v && form.querySelector(`[name="${n}"][value="${v}"]`); if (r) r.checked = true };
  /* 旧草稿没有 hasXiyao 但已有记录时视为“有” */
  check('是否使用', z0.hasXiyao || (z0.xiyao.length ? '有' : ''));
  const used = [];
  XI_CATS.forEach((cat, ci) => {
    const recs = z0.xiyao.map((r, i) => [r, i]).filter(([r]) => catOf(r) === cat);
    const sec = el('section', '', 'xi-cat'); sec.append(el('h2', cat, 'block-title'));
    if (recs.length) {
      used.push([cat, ci]);
      const g = el('fieldset', '', 'choice-group'); g.append(el('legend', '是否调整西药'));
      const yn = el('div'); radios(yn, `是否调整${ci}`, ['是', '否']); g.append(yn);
      const adj = el('div', '', 'adjust-details'); adj.id = `adjustDetails${ci}`; adj.hidden = true;
      [['调整内容', window.ADJUST.drug, `调整内容${ci}`], ['调整原因', window.ADJUST.reasons, `调整原因${ci}`]].forEach(([lg, list, name]) => {
        const f = el('fieldset', '', 'choice-group'), d = el('div'); f.append(el('legend', lg)); radios(d, name, list); f.append(d); adj.append(f);
      });
      sec.append(g, adj);
      const ul = el('ul', '', 'records');
      recs.forEach(([v, i]) => { const a = el('a'); a.href = `add-xiyao.html?edit=${i}`; const t = el('span'); t.append(el('strong', titleOf(kind, v)), el('small', describe(kind, v))); a.append(t, el('span', '›', 'arrow')); const li = el('li'); li.append(a); ul.append(li) });
      sec.append(ul);
    } else sec.append(el('p', '暂无记录', 'empty'));
    const add = el('a', '添加药品', 'secondary add-link'); add.href = `add-xiyao.html?category=${encodeURIComponent(cat)}`;
    sec.append(add); holder.append(sec);
  });
  used.forEach(([cat, ci]) => { const a = catMap[cat] || {}; check(`是否调整${ci}`, a.adjust); check(`调整内容${ci}`, a.adjustment); check(`调整原因${ci}`, a.reason) });
  const build = clearIfNone => {
    const z = loadZ(), use = checked('是否使用');
    z.hasXiyao = use;
    const m = {};
    used.forEach(([cat, ci]) => { m[cat] = { adjust: checked(`是否调整${ci}`), adjustment: checked(`调整内容${ci}`), reason: checked(`调整原因${ci}`) } });
    z.xiyaoCategoryAdjust = m;
    if (clearIfNone && use === '无') z.xiyao = [];
    return applyAdjust(z);
  };
  const sync = () => {
    toggle(details, checked('是否使用') === '有');
    used.forEach(([, ci]) => toggle(document.getElementById(`adjustDetails${ci}`), checked(`是否调整${ci}`) === '是'));
  };
  sync();
  /* 进度：是否使用 + 各已有记录分类的是否调整（选“是”再加调整内容/原因）；选“有”时“至少添加 1 条药品”另算一项 */
  FmsProgress.track(form, { extra: () => checked('是否使用') === '有' ? { total: 1, answered: z0.xiyao.length ? 1 : 0 } : {} });
  form.addEventListener('change', () => { sync(); try { FmsCase.set('zlfa', keepFinish(build(false))) } catch {} });
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    /* 非必填：未选择或未填完也可以保存返回 */
    FmsCase.save('zlfa', keepFinish(build(true)), { back: 'index.html', button: form.querySelector('button[type=submit]') });
  });
  return;
}

/* ---------- 类别页：记录列表 + 无/有 + 是否调整 ---------- */
if (page.dataset.page === 'list') {
  const items = read(kind), list = document.getElementById('records');
  document.getElementById('empty').hidden = items.length > 0;
  items.forEach((v, i) => { const a = el('a'); a.href = `add-${kind}.html?edit=${i}`; const t = el('span'); t.append(el('strong', titleOf(kind, v)), el('small', describe(kind, v))); a.append(t, el('span', '›', 'arrow')); const li = el('li'); li.append(a); list.append(li) });
  const form = document.getElementById('metaForm');
  /* 中药汤剂没有“无/有”问题：进度按是否已添加记录（或治疗方案已保存视为“无”） */
  if (!form) { FmsProgress.set(catState(loadZ(), kind)[0] === 'done' ? 1 : 0, 1); return }
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
  /* 进度：是否使用、是否调整（选“是”再加调整内容/原因）；选“有”时“至少添加 1 条记录”另算一项 */
  FmsProgress.track(form, { extra: () => cfg.hasUse && checked('是否使用') === '有' ? { total: 1, answered: items.length ? 1 : 0 } : {} });
  /* 选项变化即写草稿（不提交），便于跳转到“添加”页面后返回不丢失 */
  form.addEventListener('change', () => { sync(); try { FmsCase.set('zlfa', keepFinish(build(false))) } catch {} });
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    /* 非必填：未选择或未填完也可以保存返回 */
    FmsCase.save('zlfa', keepFinish(build(true)), { back: 'index.html', button: form.querySelector('button[type=submit]') });
  });
  return;
}

/* ---------- 汇总页（读草稿） ---------- */
if (page.dataset.page === 'summary') {
  const root = document.getElementById('summary'), z = loadZ();
  /* 进度同入口页：已完成类别数 / 4 */
  FmsProgress.set(doneCount(z), ORDER.length);
  ['xiyao', 'zhongyao-yinpian', 'zhongchengyao', 'fei-yaowu'].forEach(k => {
    const cfg = META[k], ck = KIND[k], section = el('section', '', 'summary-section'); section.append(el('h2', cfg.title));
    const none = !!ck.hasKey && z[ck.hasKey] === '无';
    const items = none ? [] : z[ck.key];
    const meta = (ck.adjKey && z[ck.adjKey]) || {};
    if (none) section.append(el('p', '无', 'summary-empty'));
    else if (!items.length) section.append(el('p', '暂无记录', 'summary-empty'));
    if (k === 'xiyao') {
      const cm = z.xiyaoCategoryAdjust || {};
      XI_CATS.forEach(cat => {
        const rs = items.filter(v => catOf(v) === cat); if (!rs.length) return;
        section.append(el('p', cat, 'summary-syndrome'));
        rs.forEach(v => { const article = el('article', '', 'summary-item'); article.append(el('h3', titleOf(k, v)), el('p', describe(k, v), 'summary-detail')); section.append(article) });
        const a = cm[cat] || {};
        if (a.adjust) section.append(el('p', `是否调整西药：${a.adjust}` + (a.adjust === '是' ? `（调整内容：${a.adjustment || ''}；调整原因：${a.reason || ''}）` : ''), 'summary-detail'));
      });
      root.append(section); return;
    }
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
/* 进度：本条记录当前显示的必填项（补充药物、图片为选填）；回显完成后再统计一次 */
const progress = FmsProgress.track(form, { optional: ['supplement'] });
setTimeout(progress.refresh, 0);
const save = item => {
  const z = loadZ();
  if (slot != null && slot < z[listKey].length) z[listKey][slot] = item;
  else { z[listKey].push(item); slot = z[listKey].length - 1 }
  FmsCase.save('zlfa', keepFinish(applyAdjust(z)), { back: listPage, button: submitBtn });
};
const del = document.getElementById('deleteItem');
if (del) {
  del.hidden = !editing;
  del.addEventListener('click', () => {
    if (!deleted && !confirm('确定删除该记录？')) return;
    const z = loadZ();
    if (!deleted) { z[listKey].splice(index, 1); deleted = true }
    FmsCase.save('zlfa', keepFinish(applyAdjust(z)), { back: listPage, button: del });
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
  let photoUrl = '', photoUploading = false;
  const showPhoto = (src, message) => { preview.src = src; container.hidden = false; status.textContent = message };
  renderRecipes();
  if (editItem) {
    const r = form.querySelector(`[name="中医证型"][value="${editItem.syndrome}"]`); if (r) { r.checked = true; renderRecipes() }
    const p = form.querySelector(`[name="方剂"][value="${editItem.recipe}"]`); if (p) { p.checked = true; renderHerbs() }
    supplement.value = editItem.prescription || ''; if (editItem.image && !/^data:/.test(editItem.image)) { photoUrl = editItem.image; showPhoto(editItem.image, '已上传处方图片') }
  }
  document.getElementById('choosePhoto').addEventListener('click', () => upload.click());
  document.getElementById('takePhoto').addEventListener('click', () => camera.click());
  document.getElementById('removePhoto').addEventListener('click', () => { photoUrl = ''; preview.removeAttribute('src'); container.hidden = true; upload.value = ''; camera.value = ''; status.textContent = '已删除图片，可重新上传'; error.textContent = '' });
  // 选图后上传到 /api/upload/image，记录里只存返回的图片 URL
  const handleImage = async input => {
    const f = input.files?.[0]; if (!f) return;
    input.value = '';
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(f.type) || f.size > 5 * 1024 * 1024) { error.textContent = '请选择不超过 5MB 的 JPG、PNG 或 GIF 图片'; return }
    error.textContent = ''; status.textContent = '正在上传图片…'; photoUploading = true;
    const local = URL.createObjectURL(f); preview.src = local; container.hidden = false;
    try { photoUrl = await FmsUpload.image(f); showPhoto(photoUrl, '已上传处方图片：' + f.name); }
    catch (e) { error.textContent = e.message || '图片上传失败，请重试'; if (photoUrl) showPhoto(photoUrl, '已上传处方图片'); else { preview.removeAttribute('src'); container.hidden = true; status.textContent = '尚未上传图片' } }
    finally { photoUploading = false; URL.revokeObjectURL(local) }
  };
  upload.addEventListener('change', () => handleImage(upload)); camera.addEventListener('change', () => handleImage(camera));
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    if (photoUploading) { error.textContent = '图片还在上传，请稍候'; return }
    const syndrome = checked('中医证型'), recipe = checked('方剂');
    if (!syndrome) { error.textContent = '请选择中医证型'; return }
    if (!recipe) { error.textContent = '请选择方剂'; return }
    /* image：上传接口返回的图片 URL */
    save({ name: '中药汤剂', syndrome, recipe, composition: (recipes[syndrome][recipe] || []).slice(), prescription: supplement.value.trim(), image: !container.hidden ? photoUrl : '' });
  });
  return;
}

/* 西药：药物分类 → 药品名称 → 剂量 / 频次；非甾体只有药名；“其他”手填药品名称 + 用量(mg) + 频次 */
if (kind === 'xiyao') {
  const CAT = window.WESTERN_CATALOG, OTHER = window.WESTERN_OTHER;
  const catSel = field('category'), nameSel = field('name'), custom = field('customName'), doseSel = field('dose'), otherDose = field('otherDose'), freqSel = field('frequency');
  const details = document.getElementById('details'), unitEl = document.getElementById('unit');
  const box = id => document.getElementById(id);
  opts(catSel, Object.keys(CAT), '请选择药物分类');
  const drugOf = () => (CAT[catSel.value] || []).find(d => d.name === nameSel.value);
  const renderDrug = () => {
    const other = catSel.value === '其他', d = other ? null : drugOf();
    toggle(box('otherDoseField'), other);
    const doses = d ? d.doses : [], freqs = other ? OTHER.freqs : d ? d.freqs : [];
    toggle(box('doseField'), doses.length > 0);
    toggle(box('freqField'), freqs.length > 0);
    if (doses.length) { opts(doseSel, doses, '请选择剂量'); unitEl.textContent = d.unit; if (doses.length === 1) doseSel.value = doses[0] }
    if (freqs.length) { opts(freqSel, freqs, '请选择频次'); if (freqs.length === 1) freqSel.value = freqs[0] }
  };
  const renderCat = () => {
    const c = catSel.value, other = c === '其他';
    toggle(details, !!c);
    if (!c) return;
    toggle(box('nameField'), !other); toggle(box('customField'), other);
    if (!other) opts(nameSel, CAT[c].map(d => d.name), '请选择药品');
    renderDrug();
  };
  catSel.addEventListener('change', renderCat); nameSel.addEventListener('change', renderDrug);
  const preset = editItem ? catOf(editItem) : params.get('category');
  if (preset && CAT[preset]) catSel.value = preset;
  renderCat();
  if (editItem) {
    if (catSel.value === '其他') { custom.value = editItem.name || ''; renderDrug(); otherDose.value = editItem.dose || '' }
    else { nameSel.value = editItem.name || ''; renderDrug(); doseSel.value = editItem.dose || doseSel.value }
    freqSel.value = editItem.frequency || freqSel.value;
  }
  const base = editItem && editItem.name ? editItem : {};
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    const c = catSel.value, other = c === '其他';
    if (!c) { error.textContent = '请选择药物分类'; return }
    const name = other ? custom.value.trim() : nameSel.value;
    if (!name) { error.textContent = other ? '请填写药品名称' : '请选择药品'; return }
    const d = other ? null : drugOf();
    let dose = '', unit = '';
    if (other) {
      dose = otherDose.value.trim(); unit = OTHER.unit;
      if (!dose || !(Number(dose) > 0)) { error.textContent = '请填写用量'; return }
    } else if (d.doses.length) {
      dose = doseSel.value; unit = d.unit;
      if (!dose) { error.textContent = '请选择剂量'; return }
    }
    const needFreq = other || d.freqs.length > 0;
    if (needFreq && !freqSel.value) { error.textContent = '请选择频次'; return }
    /* 调整字段由 applyAdjust 按分类统一写入 */
    save({ name, category: c, dose, unit, frequency: needFreq ? freqSel.value : '', instructions: base.instructions || '', adjust: '', adjustment: '', reason: '' });
  });
  return;
}

/* 中成药 / 非药物疗法 */
const nameSel = field('name'), details = document.getElementById('details'), doseSel = field('dose'), freqSel = field('frequency'), unitEl = document.getElementById('unit');
const isNonDrug = kind === 'fei-yaowu';
const catalog = kind === 'zhongchengyao' ? window.PATENT_DRUGS : null;
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
    spec: d.spec || '', route: d.route || '',
    instructions: base.instructions || '', adjust: '', adjustment: '', reason: ''
  });
});
})();
