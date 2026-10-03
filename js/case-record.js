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
  // 辅助检查报告图片
  if (part === 'fzjc') {
    if (!isEmpty(data?.labReportImages)) box.append(images('检验报告', data.labReportImages));
    if (!isEmpty(data?.ecgReportImages)) box.append(images('心电图报告', data.ecgReportImages));
  }
  if (!count && !box.querySelector('img')) box.append(el('p', 'record-empty', '未填写'));
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
