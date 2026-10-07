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
  /* 某一类的填写状态：'none' 未填写 / 'doing' 填写中（选了“有”但还没有记录）/ 'done' 已完成（“无”，或“有”且≥1条记录） */
  function stateOf(hasValue, list) {
    if (list && list.length) return 'done';
    if (hasValue === '无') return 'done';
    if (hasValue === '有') return 'doing';
    return 'none';
  }
  function state(kind) { return stateOf(has(kind), items(kind)); }
  /* 写入某一类的记录和“无/有”，提交后回该类列表页。
     本模块已保存完成（finish=true）后若改成某类未完成，finish 同步置为 false（基本信息页显示“填写中”）。 */
  function saveKind(kind, list, hasValue, button) {
    var k = KINDS[kind], value = {}, th = all();
    value[k.key] = list;
    value[k.has] = hasValue;
    if (th.finish) {
      value.finish = Object.keys(KINDS).every(function (other) {
        return other === kind ? stateOf(hasValue, list) === 'done' : state(other) === 'done';
      });
    }
    return FmsCase.save(PATH, value, { merge: true, back: k.list, button: button });
  }
  /* 记录摘要文字（列表页 / 开药汇总共用） */
  function summary(kind, item) {
    var stop = item.ongoing === '是' ? '沿用至今' : item.ongoing === '否' ? '已停用' : '';
    if (kind === 'zhongyao-tangji') return [item.startDate ? '开始 ' + item.startDate : '', stop].filter(Boolean).join('，');
    if (kind === 'fei-yaowu-liaofa') return [item.frequency, item.duration ? '单次' + item.duration + (item.durationUnit || '分钟') : '', stop].filter(Boolean).join('，');
    if (kind === 'zhongchengyao') return [item.frequency, item.dose ? '单次' + item.dose + (item.unit || '') : '', [item.startDate, item.endDate].some(Boolean) ? (item.startDate || '') + ' ~ ' + (item.endDate || '') : ''].filter(Boolean).join('，');
    return [item.frequency, item.dose ? '单次' + item.dose + (item.unit || '') : '', stop].filter(Boolean).join('，');
  }
  /* 页面顶部进度条（公共脚本 ../js/fms-progress.js） */
  function setProgress(answered, total) {
    if (window.FmsProgress) FmsProgress.set(answered, total);
  }
  /* 已完成的类别数（“无”，或“有”且已添加记录） */
  function doneKinds() {
    return Object.keys(KINDS).filter(function (kind) { return state(kind) === 'done'; }).length;
  }
  var STATUS_TEXT = { none: '未填写', doing: '填写中', done: '已完成' };
  global.BenbingStore = { PATH: PATH, KINDS: KINDS, all: all, items: items, has: has, saveKind: saveKind, summary: summary, setProgress: setProgress, doneKinds: doneKinds, state: state, stateOf: stateOf, STATUS_TEXT: STATUS_TEXT };
})(window);
