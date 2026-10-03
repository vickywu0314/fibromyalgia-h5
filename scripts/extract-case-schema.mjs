// 从各模块填写页提取字段（题目、选项文字、单位），生成随诊病历页使用的 js/case-record-schema.js。
// 模块页的题目或选项改动后重新运行：node scripts/extract-case-schema.mjs（需要 playwright）。
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')); }

const PAGES = [
  { part: 'jbxx', file: 'fibromyalgia-basic-info/basic-info.html', form: '#basicInfoForm' },
  { part: 'jbxx', sub: 'csi', file: 'fibromyalgia-basic-info/csi.html', form: '#csiForm' },
  { part: 'jbxx', sub: 'work', file: 'fibromyalgia-basic-info/work.html', form: '#workForm' },
  { part: 'jbxx', sub: 'bodyComposition', file: 'fibromyalgia-basic-info/body-composition.html', form: '#form' },
  { part: 'jbxx', sub: 'tipi', file: 'fibromyalgia-basic-info/tipi.html', form: '#tipiForm' },
  { part: 'jbxx', sub: 'sffq', file: 'fibromyalgia-basic-info/sffq.html', form: '#sffqForm' },
  { part: 'jbxx', sub: 'tpc', file: 'fibromyalgia-basic-info/tpc.html', form: '#tpcForm' },
  { part: 'jbxx', sub: 'fs.wpi', file: 'fibromyalgia-basic-info/wpi.html', form: '#wpiForm' },
  { part: 'jbxx', sub: 'fs.sss', file: 'fibromyalgia-basic-info/sss.html', form: '#sssForm' },
  { part: 'bsbq', file: 'fibromyalgia-condition-history/condition-history.html', form: '#conditionForm' },
  { part: 'zhpd', file: 'fibromyalgia-syndrome-differentiation/syndrome-differentiation.html', form: '#syndromeForm' },
  { part: 'fzjc', file: 'fibromyalgia-auxiliary-exam/auxiliary-exam.html', form: '#examForm' },
  { part: 'bqpg', scale: 'vas', file: 'bingqing-pinggu/vas.html' },
  { part: 'bqpg', scale: 'fiqr', file: 'bingqing-pinggu/fiqr.html' },
  { part: 'bqpg', scale: 'pcs', file: 'bingqing-pinggu/pcs.html' },
  { part: 'bqpg', scale: 'mfi20', file: 'bingqing-pinggu/mfi20.html' },
  { part: 'bqpg', scale: 'psqi', file: 'bingqing-pinggu/psqi.html' },
  { part: 'bqpg', scale: 'had', file: 'bingqing-pinggu/had.html' },
  { part: 'bqpg', scale: 'sf12', file: 'bingqing-pinggu/sf12.html' },
  { part: 'bqpg', scale: 'painDetect', file: 'bingqing-pinggu/pain-detect.html' },
  { part: 'bqpg', scale: 'cfq', file: 'bingqing-pinggu/cfq.html' },
  { part: 'blsj', file: 'fibromyalgia-adverse-reaction/adverse-reaction.html', form: '#adverseForm' }
];

// 在页面内运行：按 DOM 顺序收集带 name 的控件，找题目、选项文字、单位和所在分组标题。
function extract(formSelector) {
  const form = document.querySelector(formSelector || 'form');
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const ownText = el => clean([...el.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.matches('input,select,textarea,.mini,output'))).map(n => n.textContent).join(''));
  const headingBefore = (el, selector) => {
    // 向前、向上找最近的标题元素。
    for (let node = el; node && node !== form; node = node.parentElement) {
      for (let prev = node.previousElementSibling; prev; prev = prev.previousElementSibling) {
        if (prev.matches('.body-maps')) continue;
        if (prev.matches(selector)) return clean(prev.textContent);
        const inner = prev.querySelectorAll(selector);
        if (inner.length) return clean(inner[inner.length - 1].textContent);
      }
    }
    return '';
  };
  const questionLabel = control => {
    if (control.getAttribute('aria-label') && control.type !== 'radio' && control.type !== 'checkbox') return control.getAttribute('aria-label');
    if (control.id) { const l = form.querySelector(`label[for="${control.id}"]`); if (l) return clean(l.textContent); }
    const fieldset = control.closest('fieldset');
    const item = control.closest('.item,.simple-lab,.scale-item,.question,.field,.subgroup');
    if (control.type === 'radio' || control.type === 'checkbox') {
      if (item && item.matches('.item')) return clean(item.querySelector('h3')?.textContent);
      if (fieldset?.querySelector('legend')) return clean(fieldset.querySelector('legend').textContent);
      return '';
    }
    if (item?.matches('.simple-lab')) return clean(item.querySelector('span')?.textContent);
    if (item?.matches('.item')) return clean(item.querySelector('h3')?.textContent) + '数值';
    const wrap = control.closest('label');
    if (wrap) { const t = wrap.querySelector('.field-title,span'); return clean(t && !t.contains(control) ? t.textContent : ownText(wrap)).replace(/\s*(ml|年)$/, ''); }
    if (item) return clean(item.querySelector('label,legend,h3')?.textContent);
    return control.getAttribute('aria-label') || '';
  };
  const optionText = control => {
    const label = control.closest('label');
    if (!label) return '';
    let text = '', started = false;
    for (const node of label.childNodes) {
      if (node === control) { started = true; continue; }
      if (!started && node.nodeType === 1 && node.contains(control)) { started = true; continue; }
      if (!started) continue;
      if (node.nodeType === 1 && node.matches('input,select,textarea')) break;
      text += node.textContent;
    }
    return clean(text);
  };
  const unitOf = control => {
    if (control.type === 'radio' || control.type === 'checkbox') return '';
    const next = control.nextElementSibling;
    if (next && (next.tagName === 'SPAN' || next.tagName === 'B') && !next.querySelector('input')) return clean(next.textContent);
    const wrap = control.closest('label.with-input,label.amount-line,.inline-fields');
    if (wrap) { const m = clean(wrap.textContent).match(/(年|ml|省)$/); if (m) return m[1]; }
    return '';
  };
  const fields = [], byKey = {};
  form.querySelectorAll('[name]').forEach(control => {
    if (control.type === 'submit' || control.type === 'file') return;
    const key = control.name.replace(/\[\]$/, '');
    let field = byKey[key];
    if (!field) {
      field = byKey[key] = { key, label: '', type: 'text', group: headingBefore(control, 'h1,h2,.group-heading,.section-title h2,.subhead') };
      if (control.type === 'checkbox') field.type = 'multi';
      else if (control.type === 'radio' || control.tagName === 'SELECT') field.type = 'single';
      else if (control.type === 'range') field.type = 'number';
      else if (control.type === 'date') field.type = 'date';
      else if (control.type === 'number') field.numeric = true; // 数字输入框，提交为 number
      field.label = questionLabel(control) || headingBefore(control, 'h3,h4,.sub-label');
      // 膳食问卷：同一食物下有多道题，题目前加上食物名称。
      const food = control.closest('.food')?.querySelector('h3');
      if (food && clean(food.textContent) !== field.label) field.label = clean(food.textContent).replace(/^\d+\.\s*/, '') + ' · ' + field.label;
      const unit = unitOf(control); if (unit) field.unit = unit;
      fields.push(field);
    }
    if (control.type === 'radio' || control.type === 'checkbox') {
      field.values = field.values || [];
      if (!field.values.includes(control.value)) field.values.push(control.value);
      const text = optionText(control) || control.value;
      field.options = field.options || {};
      // 选项文字和值相同时不必重复存储。
      if (text !== control.value) field.options[control.value] = text;
    }
  });
  // 下拉的全部选项值（空值除外）
  form.querySelectorAll('select[name]').forEach(select => {
    const field = byKey[select.name.replace(/\[\]$/, '')];
    if (field) field.values = [...select.options].map(o => o.value).filter(Boolean);
  });
  fields.forEach(f => { if (f.options && !Object.keys(f.options).length) delete f.options; });
  return { title: document.title, fields };
}

// 页面结构无法自动取到准确题目或分组的字段，人工指定。
const OVERRIDES = {
  jbxx: { province: { label: '17. 常住地' }, smokingAmount: { label: '每日吸烟量' }, drinkType: { label: '每日饮酒种类' }, drinkAmount: { label: '每天饮酒用量' } },
  bsbq: { systemic: { label: '全身症状' }, menstrualStage: { label: '月经分期' }, menstrualItems: { label: '月经情况' }, periodTiming: { label: '经期' }, periodColor: { label: '经色' }, periodAmount: { label: '经量' }, dysmenorrhea: { label: '痛经' }, coatShape: { label: '苔质' } },
  zhpd: { secondarySyndrome: { label: '兼证' } },
  fzjc: { ecg: { label: '心电图结果' } },
  blsj: { hasAdverseEvent: { label: '是否有不良事件' }, adverseEvents: { label: '不良事件' } },
  vas: { painNature: { label: '近期肌肉疼痛性质', group: '' } },
  csi: { '*': { group: '' } },
  work: { '*': { group: '' }, q5: { options: { 0: '0（没有影响）', 10: '10（完全无法工作）' } }, q6: { options: { 0: '0（没有影响）', 10: '10（完全无法进行日常活动）' } } },
  bodyComposition: { '*': { group: '' } },
  tipi: { '*': { group: '' } },
  tpc: { '*': { group: '' } },
  'fs.wpi': { painArea: { label: '疼痛部位', group: '' } },
  painDetect: { '*': { group: '' }, painRegions: { label: '1、疼痛主要部位' } },
  psqi: { psqi6: { group: '' }, psqi7: { group: '' }, psqi8: { group: '' }, psqi9: { group: '' } }
};
const applyOverrides = (key, result) => {
  const patch = OVERRIDES[key] || {};
  result.fields.forEach(f => Object.assign(f, patch['*'] || {}, patch[f.key] || {}));
  return result;
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
const schema = {};
for (const item of PAGES) {
  await page.goto(pathToFileURL(resolve(item.file)).href);
  const result = applyOverrides(item.scale || item.part, await page.evaluate(extract, item.form || 'form'));
  if (item.sub) {
    // 基本信息下的「患者评估与病史」子模块
    schema.jbxx.subs = schema.jbxx.subs || {};
    schema.jbxx.subs[item.sub] = applyOverrides(item.sub, result);
  } else if (item.scale) {
    schema.bqpg = schema.bqpg || { title: '病情评估', scales: {} };
    schema.bqpg.scales[item.scale] = result;
  } else {
    schema[item.part] = result;
  }
}
await browser.close();
await writeFile('js/case-record-schema.js',
  '// 由 scripts/extract-case-schema.mjs 从各模块填写页生成，供随诊病历页把字段值显示为题目和选项文字。\n' +
  '// 可以手工微调；模块页题目改动后建议重新生成。\n' +
  'window.CASE_RECORD_SCHEMA = ' + JSON.stringify(schema, null, 1) + ';\n');
console.log('已生成 js/case-record-schema.js');
