/* 本病治疗史 - 新增/编辑表单（西药 / 中药汤剂 / 非药物疗法 / 中成药 共用）
   结构（按新版 PDF）：无 / 有 →
     口服西药：与本次治疗方案西药一致——药物分类 → 药品名称 → 剂量(mg) → 频次（目录见 ../zhiliao-fangan/js/catalog.js）；
              「其他」手填药品名称 + 用量(mg) + 频次；非甾体抗炎药只选药品；开始日期；是否沿用至今：是 / 否 → [结束日期, 停用原因]
     中药汤剂：开始日期；是否沿用至今：是 / 否 → [结束日期, 停用原因]
     非药物疗法：名称（其他→名称/具体治疗）→ 单次时长(分钟)、频次；开始日期；是否沿用至今 → [结束日期, 停用原因]
     口服中成药：药品（可从药品库搜索选择，也可手动输入名称）→ 频次(日1/2/3次)、用量(1~5 片/粒)、开始时间、结束时间（无“是否沿用至今/停用原因”）
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
  var list = kind === 'zhongchengyao' ? D.ZHONGCHENGYAO : null;
  // 口服西药：按药物分类选药（与本次治疗方案共用目录）
  var WC = window.WESTERN_CATALOG || {}, WO = window.WESTERN_OTHER || { unit: 'mg', freqs: [] };
  var xy = kind === 'xiyao' ? {
    cat: '', drug: '',
    wrap: function (id) { return document.getElementById(id); },
    item: function () {
      var arr = WC[els.category.value] || [];
      for (var i = 0; i < arr.length; i++) if (arr[i].name === els.medication.value) return arr[i];
      return null;
    }
  } : null;
  function refreshXiyao() {
    var cat = els.category.value, other = cat === '其他';
    if (xy.cat !== cat) {
      xy.cat = cat; xy.drug = '';
      setOptions(els.medication, (WC[cat] || []).map(function (d) { return d.name; }), '请选择药品');
    }
    toggle(xy.wrap('nameWrap'), !!cat && !other);
    toggle(xy.wrap('customWrap'), other);
    toggle(xy.wrap('otherDoseWrap'), other);
    var item = other ? null : xy.item();
    var drugKey = other ? '其他' : (item ? item.name : '');
    if (xy.drug !== drugKey) {
      xy.drug = drugKey;
      if (item) {
        setOptions(els.dose, item.doses, '请选择剂量');
        setOptions(els.frequency, item.freqs, '请选择频次');
        text('doseUnit', item.unit || 'mg');
      } else if (other) setOptions(els.frequency, WO.freqs, '请选择频次');
    }
    var showDose = !!(item && item.doses.length), showFreq = other || !!(item && item.freqs.length);
    toggle(xy.wrap('doseWrap'), showDose);
    toggle(xy.wrap('freqWrap'), showFreq);
    // 只有一个选项（如助眠药 3mg / 晚1次）时直接带出
    if (showDose && item.doses.length === 1 && !els.dose.value) els.dose.value = item.doses[0];
    if (item && item.freqs.length === 1 && !els.frequency.value) els.frequency.value = item.freqs[0];
  }
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
    // 口服中成药可手动输入药库以外的名称：用量、频次与药库相同
    if (kind === 'zhongchengyao' && name && String(name).trim()) {
      return { name: String(name).trim(), doses: list[0].doses, unit: list[0].unit, freqs: list[0].freqs };
    }
    return null;
  }

  function text(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* 选中某个药品后，按字典生成该药品的 频次 / 用量 选项（PDF 各药品相同） */
  function buildDrug(item) {
    // 中成药所有药品选项相同，只生成一次（避免输入名称时清掉已选的频次 / 用量）
    var key = kind === 'zhongchengyao' ? 'zcy' : item.name;
    if (builtFor === key) return;
    builtFor = key;
    setOptions(els.frequency, item.freqs, '请选择频次');
    setOptions(els.dose, item.doses, '请选择用量');
    text('doseUnit', item.unit);
  }

  function refresh() {
    toggle(details, els.hasEntry.value === '有');
    if (xy) {
      if (!details.hidden) refreshXiyao();
    } else if (list) {
      var item = findItem(els[nameField].value);
      if (item) buildDrug(item);
      else if (kind !== 'zhongchengyao') builtFor = null;
      toggle(itemDetail, !!item);
    } else if (kind === 'fei-yaowu-liaofa') {
      toggle(itemDetail, !!els.name.value);
      toggle(customRow, els.name.value === '其他');
    }
    if (els.ongoing) toggle(stopped, els.ongoing.value === '否');
  }


  /* 初始化静态选项 */
  if (list && els[nameField].tagName === 'SELECT') setOptions(els[nameField], list.map(function (x) { return x.name; }), '请选择中成药');
  // 口服中成药：输入时在下方列出药品库中匹配的药品，可点选；不在列表中的直接保留输入的名称
  var suggest = document.getElementById('zcyList');
  if (suggest && list) {
    var input = els[nameField];
    // 药品库：先用内置 15 种，接口返回后换成完整药品库（约 2300 种 + 补充项）
    var zcyNames = list.map(function (x) { return x.name; });
    var pinyinHits = null, pinyinFor = '', pinyinTimer = null;
    if (D.zcyLibrary) D.zcyLibrary().then(function (names) { zcyNames = names; if (document.activeElement === input) renderSuggest(); }).catch(function () {});
    var MAX_SHOW = 100; // 列表一次最多显示 100 条，输入关键字缩小范围
    var renderSuggest = function () {
      var q = input.value.trim();
      var hits;
      if (/^[a-z]+$/i.test(q)) {
        // 输入拼音首字母（如 wljn）：交给后端按拼音头检索
        hits = pinyinFor === q.toLowerCase() && pinyinHits ? pinyinHits : [];
        if (pinyinFor !== q.toLowerCase()) {
          clearTimeout(pinyinTimer);
          pinyinTimer = setTimeout(function () {
            var kw = input.value.trim().toLowerCase();
            if (!/^[a-z]+$/.test(kw) || !D.loadZhongchengyao) return;
            D.loadZhongchengyao({ kw: kw }).then(function (names) {
              if (input.value.trim().toLowerCase() !== kw) return;
              pinyinFor = kw; pinyinHits = names; renderSuggest();
            }).catch(function () {});
          }, 250);
        }
      } else hits = zcyNames.filter(function (n) { return !q || n.indexOf(q) !== -1; });
      hits = hits.slice(0, MAX_SHOW);
      suggest.innerHTML = '';
      // 列表里没有完全一致的药名：第一行提供「手动输入」，点选即使用输入的名称
      if (q && !/^[a-z]+$/i.test(q) && zcyNames.indexOf(q) === -1) {
        var manual = document.createElement('li');
        manual.className = 'manual';
        manual.setAttribute('role', 'option');
        manual.dataset.value = q;
        manual.textContent = '手动输入：' + q;
        suggest.appendChild(manual);
      }
      hits.forEach(function (n) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.value = n;
        var i = q ? n.indexOf(q) : -1;
        if (i !== -1) { li.append(n.slice(0, i)); var m = document.createElement('mark'); m.textContent = q; li.append(m, n.slice(i + q.length)); }
        else li.textContent = n;
        if (n === q) li.className = 'on';
        suggest.appendChild(li);
      });
      suggest.hidden = !suggest.children.length || document.activeElement !== input;
    };
    input.addEventListener('focus', renderSuggest);
    input.addEventListener('input', function () { renderSuggest(); refresh(); });
    suggest.addEventListener('pointerdown', function (e) { e.preventDefault(); }); // 点选时不让输入框先失焦
    suggest.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) return;
      input.value = li.dataset.value;
      suggest.hidden = true;
      input.blur();
      refresh();
    });
    input.addEventListener('blur', function () { setTimeout(function () { suggest.hidden = true; input.value = input.value.trim(); refresh(); }, 120); });
  }
  if (xy) setOptions(els.category, Object.keys(WC), '请选择药物分类');
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
    if (xy) {
      // 口服西药：按记录的分类回显；旧记录没有分类时按药名在目录中查找，找不到按「其他」回显
      var xname = rec.medication || rec.name || '', xcat = rec.category && WC[rec.category] ? rec.category : '';
      if (!xcat) Object.keys(WC).forEach(function (c) { if (!xcat && WC[c].some(function (d) { return d.name === xname; })) xcat = c; });
      if (!xcat && xname) xcat = '其他';
      els.category.value = xcat; refresh();
      if (xcat === '其他') { els.customName.value = xname; refresh(); els.otherDose.value = rec.dose || ''; }
      else { els.medication.value = xname; refresh(); }
    } else if (els[nameField]) {
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
      if (xy && f === 'dose' && els.category.value === '其他') return;
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
    if (xy) {
      var cat = els.category.value;
      if (!cat) { message.textContent = '请选择药物分类'; return; }
      data.category = cat;
      if (cat === '其他') {
        var cn = els.customName.value.trim();
        if (!cn) { message.textContent = '请填写药品名称'; return; }
        if (!els.otherDose.value || !els.frequency.value) { message.textContent = '请填写用量并选择频次'; return; }
        data.name = data.medication = cn;
        data.dose = els.otherDose.value; data.unit = WO.unit || 'mg'; data.frequency = els.frequency.value;
      } else {
        var it = xy.item();
        if (!it) { message.textContent = '请选择药品'; return; }
        if ((it.doses.length && !els.dose.value) || (it.freqs.length && !els.frequency.value)) { message.textContent = '请选择剂量和频次'; return; }
        data.name = data.medication = it.name;
        data.dose = it.doses.length ? els.dose.value : '';
        data.unit = it.doses.length ? (it.unit || 'mg') : '';
        data.frequency = it.freqs.length ? els.frequency.value : '';
      }
    } else if (kind === 'zhongyao-tangji') {
      data.name = edit >= 0 && items[edit].name ? items[edit].name : '汤剂' + (items.length + 1);
    } else {
      var nm = String(els[nameField].value || '').trim();
      if (!nm) { message.textContent = kind === 'fei-yaowu-liaofa' ? '请选择非药物名称' : kind === 'zhongchengyao' ? '请选择或输入中成药名称' : '请选择药品'; return; }
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
