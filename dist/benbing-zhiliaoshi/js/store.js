/* 本病治疗史：病例草稿 jbxx.treatmentHistory 的读写
   { finish, xiyao[], zhongyaoTangji[], feiYaowuLiaofa[], zhongchengyao[],
     hasXiyao, hasZhongyaoTangji, hasFeiYaowuLiaofa, hasZhongchengyao（“无”/“有”） }
   页面 data-kind（xiyao / zhongyao-tangji / fei-yaowu-liaofa / zhongchengyao）→ 数组 key 与“无/有” key。 */
(function (global) {
  var PATH = 'jbxx.treatmentHistory';
  var KINDS = {
    'xiyao': { key: 'xiyao', has: 'hasXiyao', label: '西药', list: 'xiyao.html' },
    'zhongyao-tangji': { key: 'zhongyaoTangji', has: 'hasZhongyaoTangji', label: '中药汤剂', list: 'zhongyao-tangji.html' },
    'fei-yaowu-liaofa': { key: 'feiYaowuLiaofa', has: 'hasFeiYaowuLiaofa', label: '非药物疗法', list: 'fei-yaowu-liaofa.html' },
    'zhongchengyao': { key: 'zhongchengyao', has: 'hasZhongchengyao', label: '中成药', list: 'zhongchengyao.html' }
  };
  function all() {
    var v = FmsCase.get(PATH);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  }
  function items(kind) {
    var v = all()[KINDS[kind].key];
    return Array.isArray(v) ? v.filter(function (x) { return x && typeof x === 'object'; }) : [];
  }
  function has(kind) { return all()[KINDS[kind].has] || ''; }
  /* 写入某一类的记录和“无/有”，提交后回该类列表页 */
  function saveKind(kind, list, hasValue, button) {
    var k = KINDS[kind], value = {};
    value[k.key] = list;
    value[k.has] = hasValue;
    return FmsCase.save(PATH, value, { merge: true, back: k.list, button: button });
  }
  /* 记录摘要文字（列表页 / 开药汇总共用） */
  function summary(kind, item) {
    var stop = item.ongoing === '是' ? '沿用至今' : item.ongoing === '否' ? '已停用' : '';
    if (kind === 'zhongyao-tangji') return [item.startDate ? '开始 ' + item.startDate : '', stop].filter(Boolean).join('，');
    if (kind === 'fei-yaowu-liaofa') return [item.frequency, item.duration ? '单次' + item.duration + (item.durationUnit || '分钟') : '', stop].filter(Boolean).join('，');
    return [item.frequency, item.dose ? '单次' + item.dose + (item.unit || '') : '', stop].filter(Boolean).join('，');
  }
  /* 页面顶部进度条 */
  function setProgress(pct) {
    var bar = document.querySelector('.progress'), span = bar && bar.querySelector('span');
    var txt = document.querySelector('.progress-text') || document.querySelector('.progress-block p');
    if (span) span.style.width = pct + '%';
    if (bar) bar.setAttribute('aria-valuenow', pct);
    if (txt) txt.textContent = '已完成' + pct + '%';
  }
  /* 已完成的类别数（有记录或已选择“无/有”） */
  function doneKinds() {
    return Object.keys(KINDS).filter(function (kind) { return items(kind).length || has(kind); }).length;
  }
  global.BenbingStore = { PATH: PATH, KINDS: KINDS, all: all, items: items, has: has, saveKind: saveKind, summary: summary, setProgress: setProgress, doneKinds: doneKinds };
})(window);
