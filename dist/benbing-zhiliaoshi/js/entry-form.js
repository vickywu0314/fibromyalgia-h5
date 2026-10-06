/* 本病治疗史 - 新增/编辑表单（西药 / 中药汤剂 / 非药物疗法 / 中成药 共用）
   结构（按 PDF）：无 / 有 → [ 名称及用法（各类不同）, 开始日期, 是否沿用至今：是 / 否 → [结束日期, 停用原因] ] */
(function () {
  var D = window.BenbingData;
  var root = document.querySelector('[data-kind]');
  var kind = root.dataset.kind;
  var key = 'benbing_' + kind + '_records';
  var form = document.getElementById('entryForm');
  var els = form.elements;
  var details = document.getElementById('details');
  var itemDetail = document.getElementById('itemDetail');
  var customRow = document.getElementById('customRow');
  var stopped = document.getElementById('stopped');
  var message = document.getElementById('message');
  var nameField = kind === 'xiyao' ? 'medication' : 'name';
  var list = kind === 'xiyao' ? D.XIYAO : kind === 'zhongchengyao' ? D.ZHONGCHENGYAO : null;
  var builtFor = null;

  function setOptions(select, values, placeholder) {
    select.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder;
    select.appendChild(first);
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      select.appendChild(o);
    });
  }

  /* 显示/隐藏条件区域：隐藏时禁用并清空其中的输入，避免脏数据 */
  function toggle(el, show) {
    if (!el) return;
    el.hidden = !show;
    el.querySelectorAll('input,select,textarea').forEach(function (c) {
      c.disabled = !show;
      if (!show) {
        if (c.type === 'radio' || c.type === 'checkbox') c.checked = false;
        else c.value = '';
      }
    });
  }

  function findItem(name) {
    if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return null;
  }

  function text(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* 选中某个药品后，按字典生成该药品的规格 / 单次剂量 / 单位 / 频次 / 给药方式 */
  function buildDrug(item) {
    if (builtFor === item.name) return;
    builtFor = item.name;
    setOptions(els.dose, item.doses, '请选择单次剂量');
    setOptions(els.frequency, item.freqs, '请选择频次');
    text('doseUnit', item.unit);
    var specRow = document.getElementById('specRow');
    if (specRow) {
      specRow.hidden = !item.spec;
      text('specValue', item.spec || '');
    }
    var unitRow = document.getElementById('unitRow');
    if (unitRow) {
      unitRow.hidden = !item.hasUnitField;
      text('unitValue', item.unit);
    }
  }

  function refresh() {
    toggle(details, els.hasEntry.value === '有');
    if (list) {
      var item = findItem(els[nameField].value);
      if (item) buildDrug(item);
      else builtFor = null;
      toggle(itemDetail, !!item);
    } else if (kind === 'fei-yaowu-liaofa') {
      toggle(itemDetail, !!els.name.value);
      toggle(customRow, els.name.value === '其他');
    }
    toggle(stopped, els.ongoing.value === '否');
  }

  function read() {
    try {
      var raw = localStorage.getItem(key);
      var v = raw === null ? (D.SAMPLES[kind] || []).slice() : JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  /* 初始化静态选项 */
  if (list) setOptions(els[nameField], list.map(function (x) { return x.name; }), kind === 'xiyao' ? '请选择西药药品' : '请选择中成药');
  if (kind === 'fei-yaowu-liaofa') {
    setOptions(els.name, D.FEI_YAOWU.names, '请选择非药物名称');
    setOptions(els.duration, D.FEI_YAOWU.durations, '请选择单次时长');
    setOptions(els.frequency, D.FEI_YAOWU.freqs, '请选择频次');
  }
  setOptions(els.reason, D.STOP_REASONS, '请选择停用原因');

  var items = read();
  var params = new URLSearchParams(location.search);
  var edit = params.has('edit') ? Number(params.get('edit')) : -1;
  if (!(Number.isInteger(edit) && edit >= 0 && edit < items.length)) edit = -1;

  /* 编辑回显：逐级设值并刷新，保证条件区域正确显示 */
  if (edit >= 0) {
    var rec = items[edit];
    els.hasEntry.value = '有';
    refresh();
    if (els[nameField]) {
      var nm = rec[nameField] || '';
      if (kind === 'fei-yaowu-liaofa' && nm && D.FEI_YAOWU.names.indexOf(nm) < 0) {
        els.name.value = '其他';
        refresh();
        els.customName.value = nm;
      } else {
        els[nameField].value = nm;
      }
      refresh();
    }
    ['dose', 'frequency', 'duration', 'startDate', 'ongoing'].forEach(function (f) {
      if (els[f] && rec[f]) els[f].value = rec[f];
    });
    refresh();
    if (rec.ongoing === '否') {
      if (rec.endDate) els.endDate.value = rec.endDate;
      if (rec.reason) els.reason.value = rec.reason;
    }
  }
  form.addEventListener('change', refresh);
  refresh();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    message.textContent = '';
    var has = els.hasEntry.value;
    if (!has) { message.textContent = '请选择无或有'; return; }
    if (has === '无') {
      try { localStorage.setItem(key, JSON.stringify([])); } catch (err) {}
      location.href = kind + '.html';
      return;
    }
    var data = {};
    if (kind === 'zhongyao-tangji') {
      data.name = edit >= 0 && items[edit].name ? items[edit].name : '汤剂' + (items.length + 1);
    } else {
      var nm = els[nameField].value;
      if (!nm) { message.textContent = kind === 'fei-yaowu-liaofa' ? '请选择非药物名称' : '请选择药品'; return; }
      if (kind === 'fei-yaowu-liaofa') {
        if (nm === '其他') {
          nm = els.customName.value.trim();
          if (!nm) { message.textContent = '请填写其他非药物名称'; return; }
        }
        if (!els.duration.value || !els.frequency.value) { message.textContent = '请选择单次时长和频次'; return; }
        data.name = nm;
        data.duration = els.duration.value;
        data.durationUnit = D.FEI_YAOWU.durationUnit;
        data.frequency = els.frequency.value;
      } else {
        var item = findItem(nm);
        if (!els.dose.value || !els.frequency.value) { message.textContent = '请选择单次剂量和频次'; return; }
        data[nameField] = nm;
        if (item.spec) data.spec = item.spec;
        data.dose = els.dose.value;
        data.unit = item.unit;
        data.frequency = els.frequency.value;
        if (item.route) data.route = item.route;
      }
    }
    data.startDate = els.startDate.value;
    data.ongoing = els.ongoing.value;
    data.endDate = data.ongoing === '否' ? els.endDate.value : '';
    data.reason = data.ongoing === '否' ? els.reason.value : '';
    if (data.startDate && data.endDate && data.endDate < data.startDate) { message.textContent = '结束日期不能早于开始日期'; return; }
    if (edit >= 0) items[edit] = data; else items.push(data);
    try {
      localStorage.setItem(key, JSON.stringify(items));
      location.href = kind + '.html';
    } catch (err) {
      message.textContent = '保存失败，请检查浏览器存储设置';
    }
  });
})();
