// 查看随诊病历：把本次记录（病例草稿，由随访列表打开时从 case/detail 加载）各模块的数据汇总成只读页面。
const c = FmsCase.load();
const isBaseline = c.visitType !== '随诊';
document.title = isBaseline ? '基线访问病历' : '随诊病历';
cvName.textContent = c.jbxx.name || '患者';
cvMeta.textContent = [isBaseline ? '基线访问' : '随诊', c.visitDate].filter(Boolean).join(' · ');
backBtn.onclick = () => { if (history.length > 1) history.back(); else location.href = './patient-detail.html'; };

// ---------- 取值与格式 ----------
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const join = v => Array.isArray(v) ? v.filter(has).join('、') : (v == null ? '' : String(v));
const withUnit = (v, u) => has(v) ? v + u : '';
const scoreText = s => s && s.finish ? [has(s.score) ? s.score + ' 分' : '', s.result ? '（' + s.result + '）' : ''].join('') || '已完成' : '';

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function section(title) { const s = el('section', 'card cv-sec'); s.append(el('h2', '', title)); cvBody.append(s); return s; }
function sub(sec, title) { sec.append(el('div', 'cv-sub', title)); }
// 行：[标签, 值]，值为空的行不显示；返回是否显示了内容
function rows(sec, list) {
  let n = 0;
  list.forEach(([k, v]) => {
    const text = join(v);
    if (!has(text)) return;
    const r = el('div', 'cv-row'); r.append(el('span', 'k', k), el('span', 'v', text)); sec.append(r); n++;
  });
  return n;
}
function empty(sec, text) { sec.append(el('div', 'cv-empty', text || '未填写')); }
function images(sec, title, list) {
  const srcs = (list || []).filter(has);
  if (!srcs.length) return;
  sub(sec, title);
  const box = el('div', 'cv-imgs');
  srcs.forEach(src => { const i = el('img'); i.src = src; i.alt = title; box.append(i); });
  sec.append(box);
}
function records(sec, title, list, fmt) {
  if (!Array.isArray(list) || !list.length) return 0;
  sub(sec, title);
  rows(sec, list.map((r, i) => [String(i + 1), fmt(r)]));
  return list.length;
}
const stopText = r => r.ongoing === '否' ? ['已停用', withUnit(r.endDate, ''), r.reason].filter(has).join('，') : (r.ongoing === '是' ? '沿用至今' : '');
const drugLine = r => [r.name, [r.dose, r.unit].filter(has).join(''), r.frequency, r.route, has(r.startDate) ? r.startDate + ' 开始' : '', stopText(r)].filter(has).join('，');

// ---------- 基本信息（基线访问） ----------
const j = c.jbxx || {};
if (isBaseline) {
  const s = section('基本信息');
  let n = rows(s, [
    ['就诊时间', j.visitDate], ['姓名', j.name], ['身份证号', j.idCard], ['性别', j.gender],
    ['常住地', [j.province, j.city && j.city !== j.province ? j.city : ''].filter(has).join(' ')],
    ['婚姻', j.marriage], ['教育程度', j.education], ['工作情况', j.workStatus],
    ['吸烟史', j.smoking === '经常有' ? ['经常有', withUnit(j.smokingYears, '年'), j.smokingAmount ? '每日' + j.smokingAmount : ''].filter(has).join('，') : j.smoking],
    ['饮酒史', j.drinking === '经常有' ? ['经常有', withUnit(j.drinkingYears, '年'), join(j.drinkTypes || j.drinkType), withUnit(j.drinkAmount, 'ml/天')].filter(has).join('，') : j.drinking]
  ]);
  const fs = j.fs || {}, w = j.work || {}, b = j.bodyComposition || {}, t = j.tipi || {};
  sub(s, '评估与病史');
  n += rows(s, [
    ['CSI-9', scoreText(j.csi)],
    ['压痛点 TPC', scoreText(j.tpc)],
    ['FS', fs.finish ? scoreText(fs) + '（WPI ' + (fs.wpi?.score ?? '') + '，SSS ' + (fs.sss?.score ?? '') + '）' : [fs.wpi?.finish ? 'WPI ' + fs.wpi.score : '', fs.sss?.finish ? 'SSS ' + fs.sss.score : ''].filter(has).join('，')],
    ['间接成本评估', w.finish ? ['缺勤率 ' + withUnit(w.absenteeism, '%'), '出勤受损 ' + withUnit(w.presenteeism, '%'), '总体工作受损 ' + withUnit(w.workImpairment, '%'), '活动受损 ' + withUnit(w.activityImpairment, '%')].filter(x => !/ $/.test(x)).join('，') || '已完成' : ''],
    ['TIPI-C', t.finish ? ['外向性 ' + (t.extraversion ?? ''), '宜人性 ' + (t.agreeableness ?? ''), '尽责性 ' + (t.conscientiousness ?? ''), '情绪稳定性 ' + (t.emotionalStability ?? ''), '开放性 ' + (t.openness ?? '')].join('，') : ''],
    ['SFFQ', j.sffq?.finish ? '已完成' : '']
  ]);
  if (b.finish) {
    sub(s, '人体成分分析');
    n += rows(s, [['体脂百分比', withUnit(b.bodyFatPercentage, '%')], ['体脂量', withUnit(b.bodyFatMass, 'Kg')], ['骨骼肌量', withUnit(b.skeletalMuscleMass, 'Kg')],
      ['骨骼肌指数', withUnit(b.skeletalMuscleIndex, 'Kg')], ['去脂体重', withUnit(b.leanBodyMass, 'Kg')], ['内脏脂肪等级', b.visceralFatLevel], ['腰臀比', b.waistHipRatio]]);
    images(s, '检验报告', b.reportImages);
  }
  const th = j.treatmentHistory || {};
  n += records(s, '本病治疗史 · 西药', th.xiyao, drugLine);
  n += records(s, '本病治疗史 · 中药汤剂', th.zhongyaoTangji, r => [r.name, has(r.startDate) ? r.startDate + ' 开始' : '', stopText(r)].filter(has).join('，'));
  n += records(s, '本病治疗史 · 非药物疗法', th.feiYaowuLiaofa, r => [r.name, withUnit(r.duration, '分钟/次'), r.frequency, has(r.startDate) ? r.startDate + ' 开始' : '', stopText(r)].filter(has).join('，'));
  n += records(s, '本病治疗史 · 中成药', th.zhongchengyao, drugLine);
  n += records(s, '合并疾病', j.diseaseHistory, r => [r.categoryLabel, r.name, withUnit(r.months, '个月'), has(r.diagnosisDate) ? '诊断 ' + r.diagnosisDate : ''].filter(has).join('，'));
  n += records(s, '合并药物', j.concomitantMedication, drugLine);
  if (!n) empty(s);
}

// ---------- 病史病情 ----------
{
  const s = section('病史病情'), q = c.bsbq || {};
  const n = rows(s, [
    ['周身疼痛发病时间', j.painOnsetDate], ['是否曾确诊', j.diagnosed === '是' ? '是，' + (j.diagnosisDate || '') : j.diagnosed],
    ['发病诱因', q.onsetTriggers], ['加重诱因', q.aggravatingTriggers], ['肌肉疼痛性质', q.painNature], ['全身症状', q.systemic],
    ['大便', q.stool], ['小便', q.urine], ['舌色', q.tongueColor], ['舌形', q.tongueShape], ['苔色', q.coatColor], ['苔质', q.coatShape],
    ['月经情况', q.menstrualItems]
  ]);
  if (!n) empty(s);
}

// ---------- 证候判断 ----------
{
  const s = section('证候判断'), z = c.zhpd || {};
  if (!rows(s, [['主证', z.mainSyndrome], ['兼证', z.secondarySyndromes || z.secondarySyndrome]])) empty(s);
}

// ---------- 辅助检查 ----------
{
  const s = section('辅助检查'), f = c.fzjc || {};
  const lab = (label, key, unit) => [label, f[key + '_status'] === '未查' ? '未查' : withUnit(f[key + '_value'], ' ' + unit)];
  let n = 0;
  const groups = [
    ['血常规', [lab('白细胞', 'cbc_wbc', '×10^9/L'), lab('红细胞', 'cbc_rbc', '×10^12/L'), lab('血红蛋白', 'cbc_hgb', 'g/L')]],
    ['尿常规', [lab('白细胞', 'urine_wbc', 'leu/uL'), lab('红细胞', 'urine_rbc', '/uL'), lab('尿蛋白', 'urine_protein', 'g/L'), lab('尿潜血', 'urine_occult', 'ery/uL')]],
    ['便常规', [['潜血', f.stool_status === '未查' ? '未查' : f.stool_occult]]],
    ['生化', [lab('ALT', 'alt', 'U/L'), lab('AST', 'ast', 'U/L'), lab('BUN', 'bun', 'mmol/L'), lab('Cr', 'cr', 'umol/L'), lab('血糖', 'glucose', 'mmol/L')]],
    ['心电图', [['结果', f.ecg]]]
  ];
  groups.forEach(([title, list]) => { if (list.some(([, v]) => has(v))) { sub(s, title); n += rows(s, list); } });
  images(s, '检验报告', [].concat(f.labReportImages || [], f.lab_report_url || []));
  images(s, '心电图报告', [].concat(f.ecgReportImages || [], f.ecg_report_url || []));
  if (!n && !(f.labReportImages || []).length && !(f.ecgReportImages || []).length) empty(s);
}

// ---------- 病情评估 ----------
{
  const s = section('病情评估'), p = c.bqpg || {};
  const names = { vas: '疼痛评估 VAS', fiqr: '整体病情评估 FIQR', pcs: '疼痛灾难化 PCS', mfi20: '疲劳评估 MFI-20', psqi: '睡眠评估 PSQI', had: '焦虑抑郁 HAD', sf12: '生活质量 SF-12', painDetect: '神经病理性疼痛 painDETECT', cfq: '认知评估 CFQ' };
  const n = rows(s, FmsCase.BQPG_SCALES.map(k => {
    const v = p[k];
    let text = scoreText(v);
    if (k === 'had' && v && v.finish) text += '（焦虑 ' + (v.anxietyScore ?? '') + '，抑郁 ' + (v.depressionScore ?? '') + '）';
    return [names[k], text];
  }));
  if (!n) empty(s);
}

// ---------- 本次治疗方案 ----------
{
  const s = section('本次治疗方案'), z = c.zlfa || {};
  const adj = a => a && a.adjust ? (a.adjust === '是' ? '是，' + [a.adjustment, a.reason].filter(has).join('，') : a.adjust) : '';
  let n = records(s, '西药', z.xiyao, r => [r.name, [r.dose, r.unit].filter(has).join(''), r.frequency, r.route].filter(has).join('，'));
  n += rows(s, [['是否调整西药', adj(z.xiyaoAdjust)]]);
  n += records(s, '中药饮片', z.zhongyaoYinpian, r => [r.syndrome, r.recipe, join(r.composition), has(r.prescription) ? '补充：' + r.prescription : ''].filter(has).join('，'));
  images(s, '处方照片', (z.zhongyaoYinpian || []).map(r => r.image));
  if (z.hasZhongchengyao === '无') n += rows(s, [['中成药', '无']]);
  n += records(s, '中成药', z.zhongchengyao, r => [r.name, [r.dose, r.unit].filter(has).join(''), r.frequency].filter(has).join('，'));
  n += rows(s, [['是否调整中成药', adj(z.zhongchengyaoAdjust)]]);
  if (z.hasFeiYaowu === '无') n += rows(s, [['非药物疗法', '无']]);
  n += records(s, '非药物疗法', z.feiYaowu, r => [r.name, withUnit(r.duration, '分钟/次'), r.frequency].filter(has).join('，'));
  n += rows(s, [['是否调整非药物疗法', adj(z.feiYaowuAdjust)]]);
  if (!n) empty(s);
}

// ---------- 不良反应 ----------
{
  const s = section('不良反应'), a = c.blsj || {};
  const n = a.hasAdverseEvent === '无' ? rows(s, [['不良反应', '无']]) : rows(s, [
    ['不良反应', a.hasAdverseEvent], ['症状', a.adverseEvents], ['发生日期', a.startDate], ['结束日期', a.endDate],
    ['SAE 类别', a.saeCategory], ['相关措施', a.drugMeasure], ['其他措施', a.otherMeasures], ['不良事件详情', a.adverseEventDetails]
  ]);
  if (!n) empty(s);
}
