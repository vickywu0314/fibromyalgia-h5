/* 既往疾病史 - 新增 / 编辑一条记录（add.html）。疾病列表按需求汇总表：
   风湿性疾病 → 疾病单选（其他→填写名称）→ 病程（年）→ 是否长期用药干预
   其他系统疾病 → 下拉选系统 → 疾病单选（其他→填写名称）→ 病程（年）→ 是否长期用药干预
     · 肿瘤：手动输入肿瘤名称/部位 → 病程 → 是否手术、是否放疗/化疗（无「是否长期用药干预」）
     · 其他：手动输入疾病名称 → 病程 → 是否长期用药干预
   记录存病例草稿 jbxx.diseaseHistory[]：
     { category, categoryLabel, name, years, longTermMedication, surgery, radioChemotherapy }（「是」/「否」，不适用的为空串） */
(function () {
  var SYSTEMS = [
    { code: 'fengshi', label: '风湿性疾病', diseases: ['类风湿关节炎', '系统性红斑狼疮', '强直性脊柱炎', '骨关节炎', '干燥综合征', '痛风', '多发性肌炎', '其他'] },
    { code: 'xinnao', label: '心脑血管/呼吸系统疾病', diseases: ['冠心病', '高血压', '心力衰竭', '脑血管疾病', '慢性阻塞性肺疾病', '过敏性哮喘', '过敏性鼻炎', '睡眠呼吸暂停低通气综合征', '其他'] },
    { code: 'xiaohua', label: '消化系统疾病', diseases: ['慢性胃炎', '胃溃疡', '肠应激综合征', '克罗恩病', '溃疡性结肠炎', '胃食管反流', '脂肪肝', '其他'] },
    { code: 'neifenmi', label: '内分泌和代谢性疾病', diseases: ['高脂血症', '2型糖尿病', '甲状腺疾病（桥本甲状腺炎/甲减/甲亢/甲状腺结节）', '维生素D缺乏', '甲状旁腺功能亢进', '其他'] },
    { code: 'jingshen', label: '精神疾病', diseases: ['创伤后应激障碍', '抑郁症', '焦虑症', '人格障碍', '其他'] },
    { code: 'miniao', label: '泌尿与生殖系统', diseases: ['盆腔炎', '尿道炎', '间质性膀胱炎', '慢性前列腺炎', '其他'] },
    { code: 'shenjing', label: '神经系统疾病', diseases: ['多发性硬化', '不宁腿综合征', '偏头痛', '脊髓灰质炎', '帕金森', '其他'] },
    { code: 'zhongliu', label: '肿瘤', manual: '肿瘤名称/部位', tumor: true },
    { code: 'qita', label: '其他', manual: '疾病名称' }
  ];
  // 旧版类别编码 → 新系统（编辑旧记录时用）；对应不上的按「其他」回显
  var LEGACY = { huxi: 'xinnao', xunhuan: 'xinnao', xinli: 'jingshen', shengzhi: 'miniao', shen: 'miniao', guke: 'qita', tengtong: 'qita' };
  var byCode = function (code) { for (var i = 0; i < SYSTEMS.length; i++) if (SYSTEMS[i].code === code) return SYSTEMS[i]; return null; };

  var form = document.getElementById('diseaseForm'), els = form.elements;
  var systemWrap = document.getElementById('systemWrap'), diseaseWrap = document.getElementById('diseaseWrap'), diseaseList = document.getElementById('diseaseList');
  var otherWrap = document.getElementById('otherWrap'), otherLabel = document.getElementById('otherLabel');
  var detailWrap = document.getElementById('detailWrap'), medWrap = document.getElementById('medWrap'), tumorWrap = document.getElementById('tumorWrap');
  var error = document.getElementById('error'), submitBtn = form.querySelector('button[type="submit"]');

  function read() { var v = FmsCase.get('jbxx.diseaseHistory'); return Array.isArray(v) ? v.filter(function (r) { return r && typeof r === 'object'; }) : []; }
  var records = read();
  var params = new URLSearchParams(location.search), edit = params.has('edit') ? Number(params.get('edit')) : -1;
  if (!(Number.isInteger(edit) && edit >= 0 && edit < records.length)) edit = -1;

  // 下拉：其他系统
  els.system.replaceChildren(new Option('请选择系统', ''));
  SYSTEMS.slice(1).forEach(function (s) { els.system.add(new Option(s.label, s.code)); });

  /* 显示 / 隐藏区域：隐藏时禁用并清空其中的输入 */
  function show(el, on) {
    el.hidden = !on;
    el.querySelectorAll('input,select').forEach(function (c) {
      c.disabled = !on;
      if (!on) { if (c.type === 'radio' || c.type === 'checkbox') c.checked = false; else c.value = ''; }
    });
  }
  function checked(name) { var r = form.querySelector('[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function current() { var t = checked('type'); return t === '风湿性疾病' ? byCode('fengshi') : t === '其他系统疾病' ? byCode(els.system.value) : null; }

  var renderedFor = '';
  function renderDiseases(sys) {
    var key = sys ? sys.code : '';
    if (renderedFor === key) return;
    renderedFor = key;
    diseaseList.replaceChildren.apply(diseaseList, (sys && sys.diseases || []).map(function (d) {
      var l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span');
      l.className = 'choice'; i.type = 'radio'; i.name = 'disease'; i.value = d; s.textContent = d;
      l.append(i, s); return l;
    }));
  }
  function refresh() {
    var t = checked('type');
    show(systemWrap, t === '其他系统疾病');
    var sys = current();
    renderDiseases(sys && sys.diseases ? sys : null);
    show(diseaseWrap, !!(sys && sys.diseases));
    var manual = !!(sys && (sys.manual || checked('disease') === '其他'));
    otherLabel.textContent = sys && sys.manual ? sys.manual : '疾病名称';
    els.otherName.placeholder = '请输入' + (sys && sys.manual ? sys.manual : '疾病名称');
    show(otherWrap, manual);
    var ready = !!(sys && (sys.manual || checked('disease')));
    show(detailWrap, ready);
    if (ready) { show(medWrap, !sys.tumor); show(tumorWrap, !!sys.tumor); }
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'type' || e.target.name === 'system') { renderedFor = '__'; }
    refresh(); if (window.FmsProgress && tracker) tracker.refresh();
  });

  /* 编辑回显 */
  if (edit >= 0) {
    var rec = records[edit], code = LEGACY[rec.category] || rec.category, sys = byCode(code) || byCode('qita');
    var radio = form.querySelector('[name="type"][value="' + (sys.code === 'fengshi' ? '风湿性疾病' : '其他系统疾病') + '"]');
    radio.checked = true;
    if (sys.code !== 'fengshi') els.system.value = sys.code;
    refresh();
    if (sys.diseases) {
      var hit = sys.diseases.indexOf(rec.name) !== -1 && rec.name !== '其他';
      form.querySelector('[name="disease"][value="' + (hit ? rec.name : '其他') + '"]').checked = true;
      refresh();
      if (!hit) els.otherName.value = rec.name || '';
    } else els.otherName.value = rec.name || '';
    els.years.value = rec.years != null ? rec.years : '';
    ['longTermMedication', 'surgery', 'radioChemotherapy'].forEach(function (n) {
      var r = rec[n] && form.querySelector('[name="' + n + '"][value="' + rec[n] + '"]'); if (r && !r.disabled) r.checked = true;
    });
  }
  refresh();
  var tracker = window.FmsProgress ? FmsProgress.track(form) : null;

  /* 编辑时提供「删除此记录」 */
  if (edit >= 0) {
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'secondary'; del.textContent = '删除此记录'; del.style.marginTop = '12px';
    submitBtn.insertAdjacentElement('afterend', del);
    del.addEventListener('click', function () {
      if (!del.dataset.done) { if (!confirm('确定删除这条既往疾病记录吗？')) return; records.splice(edit, 1); del.dataset.done = '1'; submitBtn.disabled = true; }
      FmsCase.save('jbxx.diseaseHistory', records, { back: 'index.html', button: del });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); error.textContent = '';
    var sys = current();
    if (!checked('type')) { error.textContent = '请选择风湿性疾病或其他系统疾病'; return; }
    if (!sys) { error.textContent = '请选择系统'; return; }
    var name = sys.manual || checked('disease') === '其他' ? els.otherName.value.trim() : checked('disease');
    if (!sys.manual && !checked('disease')) { error.textContent = '请选择疾病'; return; }
    if (!name) { error.textContent = '请输入' + (sys.manual || '疾病名称'); els.otherName.focus(); return; }
    var years = String(els.years.value).trim();
    if (years === '' || !/^\d{1,3}$/.test(years) || Number(years) > 120) { error.textContent = '请填写该病病程（年），0~120 的整数'; els.years.focus(); return; }
    var record = { category: sys.code, categoryLabel: sys.label, name: name, years: Number(years), longTermMedication: '', surgery: '', radioChemotherapy: '' };
    if (sys.tumor) {
      record.surgery = checked('surgery'); record.radioChemotherapy = checked('radioChemotherapy');
      if (!record.surgery || !record.radioChemotherapy) { error.textContent = '请选择是否手术、是否放疗/化疗'; return; }
    } else {
      record.longTermMedication = checked('longTermMedication');
      if (!record.longTermMedication) { error.textContent = '请选择是否长期用药干预'; return; }
    }
    if (edit >= 0) records[edit] = record; else { records.push(record); edit = records.length - 1; } // 提交失败重试时不重复新增
    FmsCase.save('jbxx.diseaseHistory', records, { back: 'index.html', button: submitBtn });
  });
})();
