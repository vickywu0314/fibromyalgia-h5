/* 本病治疗史 - 新增/编辑表单（西药 / 中药汤剂 / 非药物疗法 / 中成药 共用）
   结构：无 / 有 →
     口服西药：只有 普瑞巴林 / 度洛西汀 / 阿米替林 → 剂量(mg)、频次（取本次治疗方案目录 ../zhiliao-fangan/js/catalog.js 对应药品）；
              开始日期；是否沿用至今：是 / 否 → [结束日期, 停用原因]
     中药汤剂：只选「有/无」，没有记录
     非药物疗法：只选名称（其他→填写名称）
     口服中成药：只选名称（可从药品库搜索选择，也可手动输入）
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
  // 口服西药：只有 3 种药，名称用简称；剂量、频次取本次治疗方案目录里对应的药品
  var WC = window.WESTERN_CATALOG || {};
  var XY_NAMES = ['普瑞巴林', '度洛西汀', '阿米替林'];
  function catalogItem(label) {
    var found = null;
    Object.keys(WC).forEach(function (c) { (WC[c] || []).forEach(function (d) { if (!found && d.name.indexOf(label) !== -1) found = { item: d, category: c }; }); });
    return found;
  }
  // 旧记录可能是全称（如「普瑞巴林胶囊」），按包含的简称对应回来
  function xyLabelOf(name) { for (var i = 0; i < XY_NAMES.length; i++) if (String(name || '').indexOf(XY_NAMES[i]) !== -1) return XY_NAMES[i]; return ''; }
  var xy = kind === 'xiyao' ? {
    drug: '',
    wrap: function (id) { return document.getElementById(id); },
    item: function () { var f = catalogItem(els.medication.value); return f ? f.item : null; }
  } : null;
  function refreshXiyao() {
    var item = xy.item(), drugKey = item ? els.medication.value : '';
    if (xy.drug !== drugKey) {
      xy.drug = drugKey;
      if (item) {
        setOptions(els.dose, item.doses, '请选择剂量');
        setOptions(els.frequency, item.freqs, '请选择频次');
        text('doseUnit', item.unit || 'mg');
      }
    }
    toggle(xy.wrap('doseWrap'), !!(item && item.doses.length));
    toggle(xy.wrap('freqWrap'), !!(item && item.freqs.length));
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
      if (item && els.frequency) buildDrug(item); // 口服中成药已不填频次、用量
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
  if (xy) setOptions(els.medication, XY_NAMES, '请选择药品');
  if (kind === 'fei-yaowu-liaofa') setOptions(els.name, D.FEI_YAOWU.names, '请选择非药物名称');
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
      // 口服西药：旧记录的全称按简称回显；3 种以外的旧药名无法回显，需重新选择
      els.medication.value = xyLabelOf(rec.medication || rec.name); refresh();
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
      // 剂量、频次、开始日期、是否沿用至今：表单里有这一项才回显
      if (els[f] && rec[f]) els[f].value = rec[f];
    });
    refresh();
    if (!els.ongoing) {
      if (rec.endDate && els.endDate) els.endDate.value = rec.endDate;
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
    // 中药汤剂只记「有/无」
    if (S.KINDS[kind].hasOnly) { S.saveKind(kind, [], has, submitBtn); return; }
    if (has === '无') {
      if (items.length && !confirm('选择“无”将清空已添加的' + items.length + '条记录，确定吗？')) return;
      items = [];
      S.saveKind(kind, items, '无', submitBtn);
      return;
    }
    var data = {};
    if (xy) {
      var label = els.medication.value, found = catalogItem(label), it = found && found.item;
      if (!it) { message.textContent = '请选择药品'; return; }
      if ((it.doses.length && !els.dose.value) || (it.freqs.length && !els.frequency.value)) { message.textContent = '请选择剂量和频次'; return; }
      data.name = data.medication = label;
      data.category = found.category;
      data.dose = it.doses.length ? els.dose.value : '';
      data.unit = it.doses.length ? (it.unit || 'mg') : '';
      data.frequency = it.freqs.length ? els.frequency.value : '';
    } else {
      var nm = String(els[nameField].value || '').trim();
      if (!nm) { message.textContent = kind === 'fei-yaowu-liaofa' ? '请选择非药物名称' : kind === 'zhongchengyao' ? '请选择或输入中成药名称' : '请选择药品'; return; }
      if (kind === 'fei-yaowu-liaofa') {
        if (nm === '其他') {
          nm = els.customName.value.trim();
          if (!nm) { message.textContent = '请填写其他非药物疗法的名称（具体治疗）'; return; }
        }
        data.name = nm; // 非药物疗法只记名称
      } else {
        data.name = nm; // 口服中成药只记名称
      }
    }
    // 只有口服西药还有开始日期、是否沿用至今、结束日期、停用原因
    if (els.startDate) data.startDate = els.startDate.value;
    if (els.ongoing) {
      data.ongoing = els.ongoing.value;
      data.endDate = data.ongoing === '否' ? els.endDate.value : '';
      data.reason = data.ongoing === '否' ? els.reason.value : '';
    }
    if (data.startDate && data.endDate && data.endDate < data.startDate) { message.textContent = '结束日期不能早于开始日期'; return; }
    if (edit >= 0) items[edit] = data;
    else { items.push(data); edit = items.length - 1; } // 提交失败重试时不重复新增
    S.saveKind(kind, items, '有', submitBtn);
  });
})();
