// 新增病例：全模块共用的草稿与保存。
// 所有模块页面把数据写进同一个草稿（localStorage），按顶层模块 part 调用
// POST /api/fms/patient/case/add 提交整份结构体；后端返回的病例 id 写回草稿，后续保存带上 id。
// 依赖 fms-api.js（FmsApi.getDoctorId）。子目录页面引用 ../js/fms-api.js 与 ../js/fms-case.js。
(function () {
  var KEY = 'fms_case_draft';
  var API = '/api/fms/patient/case/add';
  var PARTS = ['jbxx', 'bsbq', 'zhpd', 'fzjc', 'bqpg', 'zlfa', 'blsj'];
  var PART_NAMES = { jbxx: '基本信息', bsbq: '病史病情', zhpd: '证候判断', fzjc: '辅助检查', bqpg: '病情评估', zlfa: '本次治疗方案', blsj: '不良反应' };
  // 病情评估 9 个量表，全部完成时 bqpg.finish = true
  var BQPG_SCALES = ['vas', 'fiqr', 'pcs', 'mfi20', 'psqi', 'had', 'sf12', 'painDetect', 'cfq'];

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function skeleton() {
    var c = { id: null, patientId: null, doctorId: null, researchType: 12, visitType: '基线', visitDate: today(), page: 1, part: '' };
    PARTS.forEach(function (p) { c[p] = { finish: false }; });
    c.jbxx.visitDate = c.visitDate;
    return c;
  }

  function doctorId() {
    var id = window.FmsApi && FmsApi.getDoctorId ? FmsApi.getDoctorId() : '';
    return id && /^\d+$/.test(id) ? Number(id) : (id || null);
  }

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && typeof c === 'object') {
        PARTS.forEach(function (p) { if (!c[p] || typeof c[p] !== 'object') c[p] = { finish: false }; });
        return c;
      }
    } catch (e) {}
    return null;
  }

  function write(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { throw new Error('本地暂存失败，请检查存储空间'); }
  }

  // 本地有改动、尚未成功提交到后端的模块（part），单独存，不进入提交的 JSON
  var UNSYNCED_KEY = 'fms_case_unsynced';
  function unsynced() {
    try { var a = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function markUnsynced(part, on) {
    var a = unsynced().filter(function (p) { return p !== part; });
    if (on) a.push(part);
    try { localStorage.setItem(UNSYNCED_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function isSynced(part) { return unsynced().indexOf(part) === -1; }

  // 查看 / 编辑模式：从随访列表打开已有记录时为「查看」，模块页只读；点「编辑」后只放开当前模块
  var MODE_KEY = 'fms_case_mode';      // 'view' | 'edit'
  var BASE_KEY = 'fms_case_base';      // 'view'：本次是查看已有记录
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function isViewMode() { return ss(MODE_KEY) === 'view'; }
  function isViewingRecord() { return ss(BASE_KEY) === 'view'; }
  function setMode(m) { ss(MODE_KEY, m || null); }

  // 模块里除 finish 外是否有任何已填内容（后端不接受空模块）
  function hasData(v) {
    if (v == null || v === '') return false;
    if (Array.isArray(v)) return v.some(hasData);
    if (typeof v === 'object') return Object.keys(v).some(function (k) { return k !== 'finish' && hasData(v[k]); });
    return v !== false;
  }

  function load() {
    var c = read();
    if (!c) { c = skeleton(); write(c); }
    return c;
  }

  function split(path) { return String(path).split('.').filter(Boolean); }

  function get(path) {
    var cur = load();
    var keys = split(path);
    for (var i = 0; i < keys.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[keys[i]];
    }
    return cur;
  }

  // 写入 path；merge=true 时与原对象浅合并（保留子模块对象，如 jbxx.csi）
  function set(path, value, merge) {
    if (isViewMode()) return load(); // 查看模式不改草稿（防止页面暂存逻辑用只读表单覆盖数据）
    var c = load();
    var keys = split(path);
    var obj = c;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object' || Array.isArray(obj[keys[i]])) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    var last = keys[keys.length - 1];
    if (merge && obj[last] && typeof obj[last] === 'object' && !Array.isArray(obj[last]) && value && typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach(function (k) { obj[last][k] = value[k]; });
    } else {
      obj[last] = value;
    }
    if (keys[0] === 'bqpg') {
      c.bqpg.finish = BQPG_SCALES.every(function (s) { return c.bqpg[s] && c.bqpg[s].finish; });
    }
    if (keys[0] === 'jbxx' && keys.length === 1 && c.jbxx.visitDate) c.visitDate = c.jbxx.visitDate;
    write(c);
    if (PARTS.indexOf(keys[0]) !== -1) markUnsynced(keys[0], true);
    return c;
  }

  function partOf(path) { return split(path)[0]; }

  // 从后端响应里取病例 id / 患者 id
  function pickIds(c, result) {
    var d = result && result.data;
    if (d == null) return;
    if (typeof d === 'number' || (typeof d === 'string' && /^\d+$/.test(d))) { c.id = Number(d); return; }
    if (typeof d === 'object') {
      var id = d.id != null ? d.id : (d.caseId != null ? d.caseId : d.recordId);
      if (id != null) c.id = id;
      if (d.patientId != null) c.patientId = d.patientId;
    }
  }

  async function submit(part) {
    var c = load();
    var did = doctorId();
    if (!did) throw new Error('未取得医生身份，请在 App 内打开');
    c.doctorId = did;
    c.researchType = 12;
    c.page = 1;
    c.part = part || '';
    // 基线访问以基本信息里的就诊时间为准；随诊没有基本信息页，用随诊日期
    c.visitDate = (c.visitType === '随诊' ? c.visitDate : (c.jbxx && c.jbxx.visitDate) || c.visitDate) || today();
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    var result;
    try {
      var response = await fetch(API, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(c)
      });
      if (!response.ok) throw new Error('保存失败（' + response.status + '），请稍后重试');
      result = await response.json().catch(function () { return {}; });
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('保存超时，请稍后重试');
      throw e;
    } finally { clearTimeout(timer); }
    if (result && (result.success === false || (result.code != null && ![0, 200, '0', '200'].includes(result.code)))) {
      throw new Error(result.message || result.msg || '保存失败，请稍后重试');
    }
    pickIds(c, result);
    write(c);
    if (PARTS.indexOf(part) !== -1) markUnsynced(part, false);
    return result;
  }

  // 完成录入：各模块保存时已提交；这里只把仍有未提交改动的模块按各自的 part 补交
  // （后端要求 part 必须是具体模块且该模块有数据，所以不能用一个汇总的 part）
  async function syncAll(onProgress) {
    var c = load();
    if (!PARTS.some(function (p) { return hasData(c[p]); })) throw new Error('还没有填写任何资料');
    var pending = unsynced();
    var parts = PARTS.filter(function (p) { return pending.indexOf(p) !== -1 && hasData(c[p]); });
    for (var i = 0; i < parts.length; i++) {
      if (onProgress) onProgress(i + 1, parts.length, parts[i]);
      try { await submit(parts[i]); }
      catch (e) { throw new Error((PART_NAMES[parts[i]] || parts[i]) + '：' + (e.message || '提交失败')); }
    }
    return parts;
  }

  function toast(text) {
    var t = document.getElementById('fmsToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'fmsToast';
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:80%;background:rgba(17,24,39,.92);color:#fff;font-size:13px;line-height:1.4;padding:9px 14px;border-radius:8px;z-index:9999;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.style.opacity = '1';
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.style.opacity = '0'; }, 1800);
  }

  /**
   * 保存一个模块/子模块：写草稿 → 提交接口 → 跳回 back。
   * opts: { merge, back, button, submit(默认 true) }
   * 提交失败时数据仍保留在本地草稿，停留在当前页并提示。
   */
  var saving = false;
  async function save(path, value, opts) {
    opts = opts || {};
    if (isViewMode()) { toast('当前为查看模式，点「编辑」后再保存'); return false; }
    if (saving) return false;
    saving = true;
    var btn = opts.button;
    var label = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = '正在保存…'; }
    try {
      set(path, value, opts.merge);
      if (opts.submit !== false) {
        await submit(partOf(path));
        // 同一次保存里顺带写入了其他模块（如病史病情页写 jbxx 的发病时间），一并提交
        var c = load();
        var pending = unsynced().filter(function (p) { return hasData(c[p]); });
        for (var i = 0; i < pending.length; i++) await submit(pending[i]);
      }
      toast('已保存');
      if (opts.back) setTimeout(function () { location.href = opts.back; }, 400);
      return true;
    } catch (e) {
      toast(e.message || '保存失败，请稍后重试');
      return false;
    } finally {
      saving = false;
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }

  // 新增患者：开始新的病例草稿，带入姓名 / 身份证号（已存在的患者带入 patientId）
  function startNew(info) {
    info = info || {};
    setMode(null); ss(BASE_KEY, null);
    var c = skeleton();
    var p = info.patient || {};
    try { localStorage.removeItem(UNSYNCED_KEY); } catch (e) {}
    c.doctorId = doctorId();
    c.patientId = p.patientId != null ? p.patientId : (p.id != null ? p.id : null);
    c.jbxx.name = info.name || p.name || '';
    c.jbxx.idCard = info.idCard || p.cardno || p.cardNo || p.idCard || '';
    // 性别：优先用已有患者资料，统一成「男/女」；没有时按 18 位身份证第 17 位推出（奇男偶女）
    var g = String(p.gender != null ? p.gender : (p.sex != null ? p.sex : ''));
    var gender = { '男': '男', '女': '女', '1': '男', '2': '女', 'M': '男', 'F': '女', 'male': '男', 'female': '女' }[g] || '';
    if (!gender && /^\d{17}[\dXx]$/.test(c.jbxx.idCard)) gender = Number(c.jbxx.idCard.charAt(16)) % 2 ? '男' : '女';
    if (gender) c.jbxx.gender = gender;
    write(c);
    return c;
  }

  // 新增随访：挂在已有患者（patientId）下的一条新病例；不含基本信息模块，只带入姓名 / 身份证号用于展示
  function startFollowUp(info) {
    info = info || {};
    setMode(null); ss(BASE_KEY, null);
    var c = skeleton();
    try { localStorage.removeItem(UNSYNCED_KEY); } catch (e) {}
    c.visitType = '随诊';
    c.doctorId = doctorId();
    c.patientId = info.patientId != null && info.patientId !== '' ? (/^\d+$/.test(String(info.patientId)) ? Number(info.patientId) : info.patientId) : null;
    c.jbxx.name = info.name || '';
    c.jbxx.idCard = info.idCard || '';
    write(c);
    return c;
  }

  // 打开已有病例（随诊列表点某一条）：按 caseId 查详情，写入草稿，后续保存带同一个 id 即为更新
  var DETAIL_API = '/api/fms/patient/case/detail';
  async function loadCase(info) {
    info = info || {};
    var did = doctorId();
    if (!did) throw new Error('未取得医生身份，请在 App 内打开');
    var result = await FmsApi.get(DETAIL_API, {
      patientId: info.patientId != null ? info.patientId : '',
      doctorId: did,
      caseId: info.caseId,
      parts: PARTS.join(',')
    });
    if (!result || result.success === false) throw new Error((result && result.message) || '病例详情加载失败');
    var d = result.data && typeof result.data === 'object' ? result.data : {};
    var c = skeleton();
    Object.keys(d).forEach(function (k) { if (d[k] != null) c[k] = d[k]; });
    PARTS.forEach(function (p) { if (!c[p] || typeof c[p] !== 'object') c[p] = { finish: false }; });
    c.id = d.id != null ? d.id : (d.caseId != null ? d.caseId : info.caseId);
    c.patientId = d.patientId != null ? d.patientId : (info.patientId != null && info.patientId !== '' ? info.patientId : null);
    c.doctorId = did;
    c.visitType = d.visitType || info.visitType || c.visitType;
    c.visitDate = d.visitDate || (c.jbxx && c.jbxx.visitDate) || info.visitDate || c.visitDate;
    if (!c.jbxx.name && info.name) c.jbxx.name = info.name;
    if (!c.jbxx.idCard && info.idCard) c.jbxx.idCard = info.idCard;
    try { localStorage.removeItem(UNSYNCED_KEY); } catch (e) {}
    write(c);
    ss(BASE_KEY, 'view'); setMode('view');
    return c;
  }

  function clear() { try { localStorage.removeItem(KEY); localStorage.removeItem(UNSYNCED_KEY); } catch (e) {} setMode(null); ss(BASE_KEY, null); }

  // 表单工具：FormData → 对象（同名多值为数组；有 data-array 的复选框始终为数组）
  function formData(form) {
    var data = {};
    new FormData(form).forEach(function (v, k) {
      if (v instanceof File) return;
      if (data[k] === undefined) data[k] = v;
      else if (Array.isArray(data[k])) data[k].push(v);
      else data[k] = [data[k], v];
    });
    form.querySelectorAll('input[type=checkbox][name]').forEach(function (cb) {
      if (cb.disabled) return;
      if (data[cb.name] === undefined) { if (form.querySelectorAll('input[type=checkbox][name="' + cb.name + '"]').length > 1) data[cb.name] = []; }
      else if (!Array.isArray(data[cb.name])) data[cb.name] = [data[cb.name]];
    });
    return data;
  }

  // 回显：按 name 写回
  function fillForm(form, data) {
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(function (name) {
      var els = form.querySelectorAll('[name="' + (window.CSS && CSS.escape ? CSS.escape(name) : name) + '"]');
      if (!els.length) return;
      var v = data[name];
      if (v == null || typeof v === 'object' && !Array.isArray(v)) return;
      var list = Array.isArray(v) ? v.map(String) : [String(v)];
      els.forEach(function (el) {
        if (el.type === 'radio' || el.type === 'checkbox') el.checked = list.indexOf(el.value) !== -1;
        else if (el.type !== 'file') el.value = list[0];
      });
    });
  }

  // 量表计分：所有选中单选值为数字时求和
  function sumRadios(form) {
    var total = 0, n = 0;
    form.querySelectorAll('input[type=radio]:checked').forEach(function (r) {
      var v = Number(r.value);
      if (!isNaN(v) && r.value !== '') { total += v; n++; }
    });
    return { total: total, answered: n };
  }


  // 模块页在查看模式下只读：锁定输入、隐藏保存/添加/删除，底部给「返回」「编辑」
  var NON_MODULE = /(patient-(list|add|detail)|follow-up-list|case-view|research-platform)\.html$/;
  // 页面内容区宽度（扣除左右内边距），手机上即屏宽减边距
  function contentWidth() {
    var m = document.querySelector('main .page, main.page, .page, main') || document.body;
    var cs = getComputedStyle(m);
    var w = m.getBoundingClientRect().width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    return Math.max(200, Math.min(w || window.innerWidth, window.innerWidth - 32));
  }
  function applyReadonly() {
    if (!isViewMode() || NON_MODULE.test(location.pathname) || document.getElementById('fmsViewBar')) return;
    var root = document.querySelector('main') || document.body;
    root.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });
    root.querySelectorAll('button, a, label.upload-box, .photo-field label').forEach(function (el) {
      var t = (el.textContent || '').replace(/\s+/g, '');
      if (el.type === 'submit' || /^(保存|添加|删除|提交|拍照|从相册|上传)/.test(t) || /保存/.test(t) || el.classList.contains('visit-del')) el.style.display = 'none';
    });
    var bar = document.createElement('div');
    bar.id = 'fmsViewBar';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9998;box-sizing:border-box;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -1px 0 #eceef1';
    var back = document.createElement('button');
    back.type = 'button'; back.textContent = '返回';
    back.style.cssText = 'flex:1;min-width:0;box-sizing:border-box;width:auto;margin:0;min-height:44px;border:1px solid #d4d7dc;border-radius:6px;background:#fff;color:#333;font-size:15px';
    back.onclick = function () { if (history.length > 1) history.back(); else location.href = '/patient-detail.html'; };
    var edit = document.createElement('button');
    edit.type = 'button'; edit.textContent = '编辑';
    edit.style.cssText = 'flex:2;min-width:0;box-sizing:border-box;width:auto;margin:0;min-height:44px;border:0;border-radius:6px;background:#168bdd;color:#fff;font-size:15px';
    edit.onclick = function () { setMode('edit'); location.reload(); };
    // 按钮放在与页面内容同宽的容器里，宽屏下不会拉满整屏
    var inner = document.createElement('div');
    inner.style.cssText = 'display:flex;gap:10px;width:100%;max-width:' + contentWidth() + 'px;margin:0 auto;box-sizing:border-box';
    inner.appendChild(back); inner.appendChild(edit);
    bar.appendChild(inner);
    document.body.appendChild(bar);
    window.addEventListener('resize', function () { inner.style.maxWidth = contentWidth() + 'px'; });
    document.body.style.paddingBottom = '72px';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(applyReadonly, 0); });
  else setTimeout(applyReadonly, 0);
  window.addEventListener('pageshow', function (e) { if (e.persisted && isViewMode()) setTimeout(applyReadonly, 0); });

  window.FmsCase = {
    KEY: KEY, API: API, PARTS: PARTS, PART_NAMES: PART_NAMES, BQPG_SCALES: BQPG_SCALES,
    load: load, get: get, set: set, submit: submit, save: save, syncAll: syncAll, isSynced: isSynced, hasData: hasData,
    startNew: startNew, startFollowUp: startFollowUp, loadCase: loadCase, clear: clear, toast: toast,
    formData: formData, fillForm: fillForm, sumRadios: sumRadios,
    isViewMode: isViewMode, isViewingRecord: isViewingRecord, setMode: setMode
  };
})();
