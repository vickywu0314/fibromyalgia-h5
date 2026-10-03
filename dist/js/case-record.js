// 随诊病历：一次请求本次随诊 7 个模块（/api/fms/patient/case/detail，parts 全部），只读展示。
// 字段题目和选项文字来自 js/case-record-schema.js；接口说明见 docs/api/case-detail.md。
const params = new URLSearchParams(location.search);
const patientId = params.get('patientId') || '';
const caseId = params.get('caseId') || '';
const displayName = params.get('name') || '患者';
const date = params.get('date') || '';
const SCHEMA = window.CASE_RECORD_SCHEMA;
const root = document.getElementById('record');
const state = document.getElementById('recordState');
document.getElementById('recordContext').textContent = '当前患者：' + displayName + (date ? ' · 随访日期 ' + date : '');

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const isEmpty = v => v == null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const toList = v => Array.isArray(v) ? v : String(v).split(',').map(x => x.trim()).filter(Boolean);

function formatValue(field, value) {
  const text = v => (field.options && field.options[String(v)]) || String(v);
  if (field.type === 'multi' || Array.isArray(value)) return toList(value).map(text).join('、');
  if (field.type === 'date') return FmsApi.formatDate(value) || String(value);
  return text(value) + (field.unit && field.unit !== '省' ? ' ' + field.unit : '');
}

function row(label, value) {
  const item = el('div', 'record-row');
  item.append(el('div', 'record-label', label), el('div', 'record-value', value));
  return item;
}

function images(label, urls) {
  const item = el('div', 'record-row');
  const box = el('div', 'record-images');
  toList(urls).forEach(src => { const img = el('img'); img.src = src; img.alt = label; img.loading = 'lazy'; box.append(img); });
  item.append(el('div', 'record-label', label), box);
  return item;
}

// 按 schema 顺序输出已填写的字段；辅助检查的「状态 + 数值」合并成一行。
// title 为所在模块或量表名称，和它相同的分组标题不再重复显示。
function renderFields(container, fields, data, title) {
  let group = title, count = 0;
  const byKey = Object.fromEntries(fields.map(f => [f.key, f]));
  fields.forEach(field => {
    if (field.key.endsWith('_value') && byKey[field.key.replace(/_value$/, '_status')]) return;
    let value = data[field.key];
    let text;
    const valueField = field.key.endsWith('_status') && byKey[field.key.replace(/_status$/, '_value')];
    if (valueField) {
      const number = data[valueField.key];
      if (isEmpty(value) && isEmpty(number)) return;
      text = [isEmpty(value) ? '' : formatValue(field, value), isEmpty(number) ? '' : formatValue(valueField, number)].filter(Boolean).join('，');
    } else {
      if (isEmpty(value)) return;
      text = formatValue(field, value);
    }
    if (field.group && field.group !== group) { group = field.group; container.append(el('div', 'record-group', group)); }
    container.append(row(field.label || field.key, text));
    count++;
  });
  return count;
}

function section(title) {
  const box = el('section', 'record-section');
  box.append(el('h2', '', title));
  root.append(box);
  return box;
}

function renderSchemaPart(part, data) {
  const box = section(SCHEMA[part].title);
  const count = renderFields(box, SCHEMA[part].fields, data || {}, SCHEMA[part].title);
  if (part === 'jbxx' && data) renderBasicSubs(box, data);
  // 辅助检查报告图片
  if (part === 'fzjc') {
    if (!isEmpty(data?.labReportImages)) box.append(images('检验报告', data.labReportImages));
    if (!isEmpty(data?.ecgReportImages)) box.append(images('心电图报告', data.ecgReportImages));
  }
  if (!count && box.children.length === 1) box.append(el('p', 'record-empty', '未填写'));
}

// 基本信息下的「患者评估与病史」10 个子模块，顺序同基本信息页。
const TREATMENT_HISTORY = [
  ['xiyao', '西药', v => [v.frequency, v.dose ? `单次${v.dose}${v.unit || '片/粒'}` : ''].filter(Boolean).join('，')],
  ['zhongyaoTangji', '中药汤剂', () => ''],
  ['feiYaowuLiaofa', '非药物疗法', v => [v.frequency, v.duration ? `单次${v.duration}分钟` : ''].filter(Boolean).join('，')],
  ['zhongchengyao', '中成药', v => [v.frequency, v.dose ? `单次${v.dose}${v.unit || '片/粒'}` : ''].filter(Boolean).join('，')]
];
const period = v => [v.startDate ? '开始：' + v.startDate : '', v.ongoing === '是' ? '沿用至今' : '', v.ongoing !== '是' && v.endDate ? '结束：' + v.endDate : '', v.ongoing !== '是' && v.reason ? '停用原因：' + v.reason : ''].filter(Boolean).join('，');
function listItem(title, lines) {
  const item = el('div', 'record-item');
  item.append(el('strong', '', title));
  lines.filter(Boolean).forEach(line => item.append(el('p', '', line)));
  return item;
}
function renderBasicSubs(box, data) {
  const block = el('div', 'record-scale');
  block.append(el('h3', '', '患者评估与病史'));
  let filled = 0;
  const sub = (title, render) => { const part = el('div'); part.append(el('div', 'record-group', title)); if (render(part)) { block.append(part); filled++; } };
  sub('本病治疗史', part => {
    let n = 0;
    TREATMENT_HISTORY.forEach(([key, title, describe]) => (data.treatmentHistory?.[key] || []).forEach(v => {
      part.append(listItem(`${title}：${v.medication || v.name || ''}`, [describe(v), period(v)])); n++;
    }));
    return n;
  });
  sub('既往疾病史', part => {
    (data.diseaseHistory || []).forEach(v => part.append(listItem(v.name, [[v.categoryLabel, v.years != null && v.years !== '' ? `病程${v.years}年` : ''].filter(Boolean).join('，')])));
    return (data.diseaseHistory || []).length;
  });
  sub('合并药物', part => {
    const items = data.concomitantMedication || [];
    if (items.length) part.append(row('药物名称', items.map(v => typeof v === 'string' ? v : v.name).join('、')));
    return items.length;
  });
  const subs = SCHEMA.jbxx.subs;
  [['csi', 'csi'], ['work', 'work'], ['bodyComposition', 'bodyComposition'], ['tipi', 'tipi'], ['sffq', 'sffq'], ['tpc', 'tpc']].forEach(([key, schemaKey]) => {
    let value = data[key];
    // 腰臀比页面拆成两位小数输入，合并为 0.xy 显示。
    if (key === 'bodyComposition' && value && (value.ratio1 != null || value.ratio2 != null)) value = { ...value, ratio1: `0.${value.ratio1 ?? ''}${value.ratio2 ?? ''}`, ratio2: null };
    sub(subs[schemaKey].title, part => !isEmpty(value) && renderFields(part, subs[schemaKey].fields, value, subs[schemaKey].title));
  });
  sub('纤维肌痛症状量表（FS）', part => {
    let n = 0;
    [['wpi', 'fs.wpi'], ['sss', 'fs.sss']].forEach(([key, schemaKey]) => {
      const value = data.fs?.[key];
      if (isEmpty(value)) return;
      const inner = el('div');
      inner.append(el('div', 'record-label', subs[schemaKey].title));
      if (renderFields(inner, subs[schemaKey].fields, value, subs[schemaKey].title)) { part.append(inner); n++; }
    });
    return n;
  });
  if (!isEmpty(data.bodyComposition?.reportImages)) block.append(images('人体成分分析报告', data.bodyComposition.reportImages));
  if (filled) box.append(block);
}

function renderAssessment(data) {
  const box = section(SCHEMA.bqpg.title);
  let filled = 0;
  Object.entries(SCHEMA.bqpg.scales).forEach(([key, scale]) => {
    if (isEmpty(data?.[key])) return;
    const block = el('div', 'record-scale');
    block.append(el('h3', '', scale.title));
    if (renderFields(block, scale.fields, data[key], scale.title.replace(/[:：].*$/, ''))) { box.append(block); filled++; }
  });
  if (!filled) box.append(el('p', 'record-empty', '未填写'));
}

const FREQUENCY = { '日1次': '每日一次', '日2次': '每日两次', '日3次': '每日三次', '晚1次': '每晚一次' };
const TREATMENTS = [
  ['xiyao', '西药', v => ['口服', v.dose ? `${v.dose}${v.unit || 'mg'}` : '', FREQUENCY[v.frequency] || v.frequency].filter(Boolean).join('，')],
  ['zhongchengyao', '中成药', v => [FREQUENCY[v.frequency] || v.frequency, v.dose ? `${v.dose}${v.unit || '粒'}` : ''].filter(Boolean).join('，')],
  ['zhongyaoYinpian', '中药饮片', v => [v.syndrome, v.prescription].filter(Boolean).join(' · ')],
  ['feiYaowu', '非药物疗法', v => [v.frequency, v.duration ? `单次${v.duration}分钟` : ''].filter(Boolean).join('，')]
];
function renderTreatment(data) {
  const box = section('本次治疗方案');
  let filled = 0;
  TREATMENTS.forEach(([key, title, describe]) => {
    const items = data?.[key];
    if (isEmpty(items)) return;
    box.append(el('div', 'record-group', title));
    items.forEach(v => {
      const item = el('div', 'record-item');
      item.append(el('strong', '', v.recipe || v.name || title));
      if (v.category) item.append(el('p', '', v.category));
      const detail = describe(v); if (detail) item.append(el('p', '', detail));
      if (v.adjust === '是') item.append(el('p', '', `调整：${v.adjustment || ''}${v.reason ? '（' + v.reason + '）' : ''}`));
      if (!isEmpty(v.image)) { const img = el('div', 'record-images'); const i = el('img'); i.src = v.image; i.alt = '处方图片'; i.loading = 'lazy'; img.append(i); item.append(img); }
      box.append(item);
      filled++;
    });
  });
  if (!filled) box.append(el('p', 'record-empty', '未填写'));
}

function render(data) {
  root.replaceChildren();
  renderSchemaPart('jbxx', data.jbxx);
  renderSchemaPart('bsbq', data.bsbq);
  renderSchemaPart('zhpd', data.zhpd);
  renderSchemaPart('fzjc', data.fzjc);
  renderAssessment(data.bqpg);
  renderTreatment(data.zlfa);
  renderSchemaPart('blsj', data.blsj);
}

async function load() {
  state.style.display = 'block';
  state.textContent = '正在加载...';
  if (!patientId || !caseId) { state.textContent = '缺少随诊信息，请从随访记录进入'; return; }
  try {
    // 优先使用录入开始页点击时预取的数据。
    const data = CaseView.takePrefetch(caseId, 'all') || await CaseView.fetchParts(patientId, caseId, CaseView.ALL_PARTS);
    render(data);
    state.style.display = 'none';
  } catch (error) {
    state.textContent = error.name === 'AbortError' ? '请求超时，可点击重试' : error.message;
    const retry = el('button', '', '重新加载');
    retry.onclick = load;
    state.append(el('br'), retry);
  }
}
load();
