/* 本病治疗史 - 新增/编辑表单（西药 / 中药汤剂 / 非药物疗法 / 中成药 共用）
   结构（按新版 PDF）：无 / 有 →
     西药：药品 → 频次、用量(片/粒)；开始日期；是否沿用至今：是 / 否 → [结束日期, 停用原因]
     中药汤剂：开始日期；是否沿用至今：是 / 否 → [结束日期, 停用原因]
     非药物疗法：名称（其他→名称/具体治疗）→ 单次时长(分钟)、频次；开始日期；是否沿用至今 → [结束日期, 停用原因]
     中成药：药品 → 频次、用量(片/粒)、开始时间、结束时间（无“是否沿用至今/停用原因”）
   数据写入病例草稿 jbxx.treatmentHistory.<类别数组>，“无/有”写 has<类别>（见 store.js）。
   记录字段：name, dose, unit(固定“片/粒”), frequency, startDate, ongoing, endDate, reason, duration(非药物单次时长), durationUnit；
   西药同时写 medication（=name，对应结构体 medication）。
   页面顶部进度由 ../js/fms-progress.js 按本表单可见题目统计。 */
(function () {
  var D = window.BenbingData;
  var S = window.BenbingStore;
  var root = document.querySelector('[data-kind]');
  var kind = root.dataset.kind;
  var form = document.getElementById('entryForm');
  var els = form.elements;
  var details = document.getElementById('details');
  var itemDetail = document.getElementById('itemDetail');
  var customRow = document.getElementById('customRow');
  var stopped = document.getElementById('stopped');
  var message = document.getElementById('message');
  var submitBtn = form.querySelector('button[type="submit"]');
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

  /* 选中某个药品后，按字典生成该药品的 频次 / 用量 选项（PDF 各药品相同） */
  function buildDrug(item) {
    if (builtFor === item.name) return;
    builtFor = item.name;
    setOptions(els.frequency, item.freqs, '请选择频次');
    setOptions(els.dose, item.doses, '请选择用量');
    text('doseUnit', item.unit);
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
    if (els.ongoing) toggle(stopped, els.ongoing.value === '否');
  }


  /* 初始化静态选项 */
  if (list) setOptions(els[nameField], list.map(function (x) { return x.name; }), kind === 'xiyao' ? '请选择西药药品' : '请选择中成药');
  if (kind === 'fei-yaowu-liaofa') {
    setOptions(els.name, D.FEI_YAOWU.names, '请选择非药物名称');
    setOptions(els.duration, D.FEI_YAOWU.durations, '请选择单次时长');
    setOptions(els.frequency, D.FEI_YAOWU.freqs, '请选择频次');
  }
  if (els.reason) setOptions(els.reason, D.STOP_REASONS, '请选择停用原因');

  var items = S.items(kind);
  var params = new URLSearchParams(location.search);
  var edit = params.has('edit') ? Number(params.get('edit')) : -1;
  if (!(Number.isInteger(edit) && edit >= 0 && edit < items.length)) edit = -1;

  /* 编辑回显：逐级设值并刷新，保证条件区域正确显示 */
  if (edit >= 0) {
    var rec = items[edit];
    els.hasEntry.value = '有';
    refresh();
    if (els[nameField]) {
      var nm = rec.name || rec.medication || '';
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
    if (!els.ongoing) {
      if (rec.endDate) els.endDate.value = rec.endDate;
    } else if (rec.ongoing === '否') {
      if (rec.endDate) els.endDate.value = rec.endDate;
      if (rec.reason) els.reason.value = rec.reason;
    }
  } else if (S.has(kind) === '无' && !items.length) {
    els.hasEntry.value = '无';
  } else if (S.has(kind) === '有' || items.length) {
    els.hasEntry.value = '有'; // 已回答过“有”，新增记录时直接带出
  }

  /* 编辑已有记录时提供“删除此记录” */
  if (edit >= 0) {
    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'secondary';
    del.textContent = '删除此记录';
    del.style.marginTop = '12px';
    submitBtn.insertAdjacentElement('afterend', del);
    del.addEventListener('click', function () {
      if (!del.dataset.done) {
        if (!confirm('确定删除这条记录吗？')) return;
        items.splice(edit, 1);
        del.dataset.done = '1';
        submitBtn.disabled = true;
      }
      S.saveKind(kind, items, items.length ? '有' : S.has(kind), del);
    });
  }
  form.addEventListener('change', refresh);
  refresh();
  /* 进度：本条记录表单中当前可见、可填的项（无/有、药品、频次、用量、日期、是否沿用至今、结束日期、停用原因…）已填数 / 应填数 */
  if (window.FmsProgress) FmsProgress.track(form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    message.textContent = '';
    var has = els.hasEntry.value;
    if (!has) { message.textContent = '请选择无或有'; return; }
    if (has === '无') {
      if (items.length && !confirm('选择“无”将清空已添加的' + items.length + '条记录，确定吗？')) return;
      items = [];
      S.saveKind(kind, items, '无', submitBtn);
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
          if (!nm) { message.textContent = '请填写其他非药物疗法的名称（具体治疗）'; return; }
        }
        if (!els.duration.value || !els.frequency.value) { message.textContent = '请选择单次时长和频次'; return; }
        data.name = nm;
        data.duration = els.duration.value;
        data.durationUnit = D.FEI_YAOWU.durationUnit;
        data.frequency = els.frequency.value;
      } else {
        var item = findItem(nm);
        if (!els.frequency.value || !els.dose.value) { message.textContent = '请选择频次和用量'; return; }
        data.name = nm;
        if (kind === 'xiyao') data.medication = nm;
        data.frequency = els.frequency.value;
        data.dose = els.dose.value;
        data.unit = item.unit;
      }
    }
    data.startDate = els.startDate.value;
    if (els.ongoing) {
      data.ongoing = els.ongoing.value;
      data.endDate = data.ongoing === '否' ? els.endDate.value : '';
      data.reason = data.ongoing === '否' ? els.reason.value : '';
    } else {
      data.endDate = els.endDate.value; // 中成药：开始时间 / 结束时间
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) { message.textContent = '结束日期不能早于开始日期'; return; }
    if (edit >= 0) items[edit] = data;
    else { items.push(data); edit = items.length - 1; } // 提交失败重试时不重复新增
    S.saveKind(kind, items, '有', submitBtn);
  });
})();
