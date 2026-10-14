// 新增病例：全模块共用的草稿与保存。
// 所有模块页面把数据写进同一个草稿（localStorage），按顶层模块 part 调用
// POST /api/fms/patient/case/add 提交整份结构体；后端返回的病例 id 写回草稿，后续保存带上 id。
// 依赖 fms-api.js（FmsApi.getDoctorId）。子目录页面引用 ../js/fms-api.js 与 ../js/fms-case.js。
(function () {
  var KEY = 'fms_case_draft';
  var API = '/api/fms/patient/case/add';
  var PARTS = ['jbxx', 'bsbq', 'zhpd', 'fzjc', 'bqpg', 'zlfa', 'blsj'];
  var PART_NAMES = { jbxx: '基本信息', bsbq: '病史病情', zhpd: '证候判断', fzjc: '辅助检查', bqpg: '病情评估', zlfa: '本次治疗方案', blsj: '不良反应' };
  // 病情评估 9 个量表
  var BQPG_SCALES = ['vas', 'fiqr', 'pcs', 'mfi20', 'psqi', 'had', 'sf12', 'painDetect', 'cfq'];
  // 按需求放在病情评估前 3 位的问卷：数据存 bqpg.csi / bqpg.tpc / bqpg.fs（病情评估的子项，后端确认）
  var BQPG_EXTRA = ['csi', 'tpc', 'fs'];
  // 病情评估全部 12 项（3 项 + 9 个量表）都完成时 bqpg.finish = true
  var BQPG_ALL = BQPG_EXTRA.concat(BQPG_SCALES);
  function bqpgDone(b) { return BQPG_ALL.every(function (k) { return !!(b && b[k] && b[k].finish); }); }

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

  // 病例标识：每次新建患者 / 新增随访 / 打开已有记录 / 清空时换一个新值。
  // 浏览器（尤其手机侧滑返回）会从页面缓存（bfcache）恢复旧页面，页面上显示的还是之前那条记录的作答；
  // 若期间已切换到另一条记录，恢复时重新加载页面，避免把上一条记录的内容保存进当前记录。
  var TOKEN_KEY = 'fms_case_token';
  function caseToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function newCaseToken() { try { localStorage.setItem(TOKEN_KEY, Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); } catch (e) {} }
  var pageToken = caseToken();
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && caseToken() !== pageToken) location.reload();
  });
  // 关闭浏览器的「返回时恢复表单填写内容」：返回到某页时，浏览器会把上次离开时表单里的选项盖回去，
  // 而那可能是另一条记录的作答（如先看随诊、再切到基线后返回）。各页面都按病例草稿自行回显，不需要浏览器恢复。
  function noFormRestore() {
    document.querySelectorAll('form').forEach(function (f) { f.setAttribute('autocomplete', 'off'); });
    document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(function (el) { if (!el.hasAttribute('autocomplete')) el.setAttribute('autocomplete', 'off'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', noFormRestore); else noFormRestore();
  window.addEventListener('pagehide', noFormRestore);

  // 打开已有记录（BASE_KEY='view'）仍记录下来供患者资料页显示标题；
  // 按需求模块页不再有只读「查看模式」：进入即可编辑，已有内容回填，isViewMode() 恒为 false
  var MODE_KEY = 'fms_case_mode';      // 'view' | 'edit'
  var BASE_KEY = 'fms_case_base';      // 'view'：本次是查看已有记录
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function isViewMode() { return false; }
  function isViewingRecord() { return ss(BASE_KEY) === 'view'; }
  function setMode(m) { ss(MODE_KEY, m || null); }

  // 本病例整体进度（与患者资料页「资料完成度」一致）：模块已保存（finish）且已提交才算完成；
  // 随诊病例没有基本信息模块，按 6 个模块算。
  function overall() {
    var c = load();
    var parts = c.visitType === '随诊' ? PARTS.filter(function (p) { return p !== 'jbxx'; }) : PARTS;
    var done = parts.filter(function (p) { return c[p] && c[p].finish && isSynced(p); }).length;
    return { done: done, total: parts.length, pct: parts.length ? Math.round(done / parts.length * 100) : 0 };
  }
  // 各模块页顶部进度条统一显示整体进度（不再是当前页的填写进度）
  function renderOverall() {
    var o = overall();
    document.querySelectorAll('.progress-block').forEach(function (block) {
      var bar = block.querySelector('.progress'), fill = bar && bar.querySelector('span'), text = block.querySelector('p');
      if (fill) fill.style.width = o.pct + '%';
      if (bar) { bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(o.pct)); bar.setAttribute('aria-label', '资料整体完成度'); }
      if (text) text.textContent = '资料整体完成度 ' + o.pct + '%（' + o.done + '/' + o.total + '）';
    });
    return o;
  }

  // 模块里除 finish 外是否有任何已填内容（后端不接受空模块）
  function hasData(v) {
    if (v == null || v === '') return false;
    if (Array.isArray(v)) return v.some(hasData);
    if (typeof v === 'object') return Object.keys(v).some(function (k) { return k !== 'finish' && hasData(v[k]); });
    return v !== false;
  }

  // 旧数据兼容：CSI / TPC / FS 以前存在 jbxx 下，读取时若 bqpg 下还没有，就把 jbxx 下的复制过来（jbxx 下的原样保留）
  function migrateBqpgExtra(c) {
    if (!c || !c.jbxx || typeof c.jbxx !== 'object') return false;
    if (!c.bqpg || typeof c.bqpg !== 'object') c.bqpg = { finish: false };
    var moved = false;
    BQPG_EXTRA.forEach(function (k) {
      if (!c.bqpg[k] && c.jbxx[k] && typeof c.jbxx[k] === 'object' && hasData(c.jbxx[k])) { c.bqpg[k] = JSON.parse(JSON.stringify(c.jbxx[k])); moved = true; }
    });
    if (moved) c.bqpg.finish = bqpgDone(c.bqpg);
    return moved;
  }

  function load() {
    var c = read();
    if (!c) { c = skeleton(); write(c); }
    else if (migrateBqpgExtra(c)) write(c);
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
    if (keys[0] === 'bqpg') c.bqpg.finish = bqpgDone(c.bqpg);
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
    newCaseToken();
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
    newCaseToken();
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
    newCaseToken();
    ss(BASE_KEY, 'view'); setMode('view');
    return c;
  }

  function clear() { try { localStorage.removeItem(KEY); localStorage.removeItem(UNSYNCED_KEY); } catch (e) {} newCaseToken(); setMode(null); ss(BASE_KEY, null); }

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


  // 下拉框统一箭头：去掉浏览器自带箭头（各浏览器位置不一、常贴着右边框），换成 12px 的 ⌄ 箭头，
  // 距右边框 14px，文字右侧留出箭头空间。用 !important 是因为各页样式用 background 简写会覆盖背景图。
  (function selectArrowStyle() {
    if (document.getElementById('fmsSelectArrow')) return;
    var svg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";
    var st = document.createElement('style');
    st.id = 'fmsSelectArrow';
    st.textContent = 'select:not([multiple]):not([size]){-webkit-appearance:none!important;-moz-appearance:none!important;appearance:none!important;' +
      'background-image:' + svg + '!important;background-repeat:no-repeat!important;background-position:right 14px center!important;background-size:12px 8px!important;padding-right:36px!important}' +
      'select:not([multiple]):not([size])::-ms-expand{display:none}';
    (document.head || document.documentElement).appendChild(st);
  })();

  // 模块页顶部返回栏：‹ + 页面标题，返回「上一级」页面（按页面层级，不用浏览器历史——
  // 保存并返回会新增历史记录，用 history.back() 会退回到刚保存的表单）。
  var DETAIL = '../patient-detail.html', BASIC = '../fibromyalgia-basic-info/basic-info.html';
  var PARENT = {
    'fibromyalgia-basic-info/basic-info.html': DETAIL,
    'fibromyalgia-basic-info/csi.html': '../bingqing-pinggu/index.html', 'fibromyalgia-basic-info/tpc.html': '../bingqing-pinggu/index.html',
    'fibromyalgia-basic-info/fs.html': '../bingqing-pinggu/index.html', 'fibromyalgia-basic-info/work.html': 'basic-info.html',
    'fibromyalgia-basic-info/body-composition.html': 'basic-info.html', 'fibromyalgia-basic-info/tipi.html': 'basic-info.html',
    'fibromyalgia-basic-info/sffq.html': 'basic-info.html',
    'fibromyalgia-basic-info/wpi.html': 'fs.html', 'fibromyalgia-basic-info/sss.html': 'fs.html',
    'benbing-zhiliaoshi/benbing-zhiliaoshi.html': BASIC,
    'benbing-zhiliaoshi/xiyao.html': 'benbing-zhiliaoshi.html', 'benbing-zhiliaoshi/zhongchengyao.html': 'benbing-zhiliaoshi.html',
    'benbing-zhiliaoshi/zhongyao-tangji.html': 'benbing-zhiliaoshi.html', 'benbing-zhiliaoshi/fei-yaowu-liaofa.html': 'benbing-zhiliaoshi.html',
    'benbing-zhiliaoshi/kaiyao-huizong.html': 'benbing-zhiliaoshi.html',
    'benbing-zhiliaoshi/add-xiyao.html': 'xiyao.html', 'benbing-zhiliaoshi/add-zhongchengyao.html': 'zhongchengyao.html',
    'benbing-zhiliaoshi/add-zhongyao-tangji.html': 'zhongyao-tangji.html', 'benbing-zhiliaoshi/add-fei-yaowu-liaofa.html': 'fei-yaowu-liaofa.html',
    'jiwang-bingshi/index.html': BASIC, 'jiwang-bingshi/choose.html': 'index.html',
    'hebing-yaowu/index.html': BASIC, 'hebing-yaowu/add.html': 'index.html',
    'fibromyalgia-condition-history/condition-history.html': DETAIL,
    'fibromyalgia-syndrome-differentiation/syndrome-differentiation.html': DETAIL,
    'fibromyalgia-auxiliary-exam/auxiliary-exam.html': DETAIL,
    'fibromyalgia-adverse-reaction/adverse-reaction.html': DETAIL,
    'bingqing-pinggu/index.html': DETAIL,
    'zhiliao-fangan/index.html': DETAIL,
    'zhiliao-fangan/xiyao.html': 'index.html', 'zhiliao-fangan/zhongchengyao.html': 'index.html',
    'zhiliao-fangan/fei-yaowu.html': 'index.html', 'zhiliao-fangan/zhongyao-yinpian.html': 'index.html',
    'zhiliao-fangan/huizong.html': 'index.html',
    'zhiliao-fangan/add-xiyao.html': 'xiyao.html', 'zhiliao-fangan/add-zhongchengyao.html': 'zhongchengyao.html',
    'zhiliao-fangan/add-fei-yaowu.html': 'fei-yaowu.html', 'zhiliao-fangan/add-zhongyao-yinpian.html': 'zhongyao-yinpian.html'
  };
  // 目录下其余页面：病情评估各量表 → 病情评估首页；既往疾病各类别 → 选择疾病类别
  var DIR_DEFAULT = { 'bingqing-pinggu': 'index.html', 'jiwang-bingshi': 'choose.html' };
  function pageKey() {
    var parts = decodeURIComponent(location.pathname).split('/').filter(Boolean);
    return parts.slice(-2).join('/');
  }
  function parentUrl() {
    var key = pageKey();
    if (PARENT[key]) return PARENT[key];
    var dir = key.split('/')[0];
    return DIR_DEFAULT[dir] || DETAIL;
  }
  // 一级页面（患者列表、新增患者、患者资料、随访记录、病例查看）：只有「‹」，返回上一页。
  // 「上一页」按业务关系确定（不用浏览器历史，避免保存后退回到刚保存的表单）；患者列表返回进入本系统前的页面。
  var MODULE_DIRS = /^(fibromyalgia-[a-z-]+|benbing-zhiliaoshi|bingqing-pinggu|jiwang-bingshi|hebing-yaowu|zhiliao-fangan)$/;
  var ROOT_PAGES = { 'patient-list.html': 1, 'patient-add.html': 1, 'patient-detail.html': 1, 'follow-up-list.html': 1, 'case-view.html': 1 };
  function rootBack(file) {
    var c = read() || {};
    if (file === 'patient-add.html') return 'patient-list.html';
    if (file === 'follow-up-list.html') return 'patient-list.html';
    if (file === 'case-view.html') return 'patient-detail.html';
    if (file === 'patient-detail.html') {
      // 与患者资料页「完成录入」后的去向一致：随访 / 从随访记录进入的回随访记录，否则回患者列表
      var fromFollowUp = ss('fms_case_from') === 'followup';
      if ((c.visitType === '随诊' || fromFollowUp) && c.patientId != null) {
        return 'follow-up-list.html?' + new URLSearchParams({ patientId: c.patientId, name: (c.jbxx && c.jbxx.name) || '', cardno: (c.jbxx && c.jbxx.idCard) || '' });
      }
      return 'patient-list.html';
    }
    return null; // 患者列表：浏览器返回
  }
  var BAR_CSS = 'position:sticky;top:0;z-index:9998;display:flex;align-items:center;height:44px;margin:0 0 8px;background:#fff;border-bottom:1px solid #eceef1;box-sizing:border-box;padding-top:env(safe-area-inset-top)';
  var ARROW_CSS = 'display:flex;align-items:center;justify-content:center;width:36px;height:40px;font-size:30px;line-height:1;color:#222;text-decoration:none;background:none;border:0;padding:0;cursor:pointer';
  function mountTopBar() {
    if (document.getElementById('fmsTopBar')) return;
    var parts = pageKey().split('/'), file = parts[parts.length - 1], dirName = parts.length > 1 ? parts[0] : '';
    // 模块目录下的页面为二级页面；项目根目录（本地为站点根，服务器为 /fms/）下的列表、患者资料等为一级页面
    var isModule = MODULE_DIRS.test(dirName);
    var isRoot = !isModule && !!ROOT_PAGES[file];
    if (!isRoot && !isModule) return;
    var bar = document.createElement('div');
    bar.id = 'fmsTopBar';
    bar.style.cssText = BAR_CSS + ';padding-left:' + (isModule ? 112 : 44) + 'px;padding-right:' + (isModule ? 112 : 44) + 'px';
    var left = document.createElement('div');
    left.style.cssText = 'position:absolute;left:4px;top:50%;transform:translateY(-50%);display:flex;align-items:center';
    var back;
    if (isModule) {
      // 二级页面：「‹」返回上一级；右侧「返回目录」回到患者资料（模块目录）
      back = document.createElement('a'); back.href = parentUrl();
      var dir = document.createElement('a');
      dir.href = DETAIL; dir.textContent = '返回目录';
      dir.style.cssText = 'font-size:15px;color:#168bdd;text-decoration:none;white-space:nowrap;padding:8px 4px 8px 0';
      left.appendChild(back); left.appendChild(dir);
    } else {
      var to = rootBack(file);
      if (to) { back = document.createElement('a'); back.href = to; }
      else {
        back = document.createElement('button'); back.type = 'button';
        back.addEventListener('click', function () { if (history.length > 1) history.back(); });
      }
      left.appendChild(back);
    }
    back.setAttribute('aria-label', isModule ? '返回上一级' : '返回上一页');
    back.textContent = '‹';
    back.style.cssText = ARROW_CSS;
    var title = document.createElement('div');
    title.textContent = document.title;
    title.style.cssText = 'flex:1;min-width:0;text-align:center;font-size:17px;font-weight:500;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    bar.appendChild(left); bar.appendChild(title);
    document.body.insertBefore(bar, document.body.firstChild);
  }
  // 统一日期选择器（底部拉起的年/月/日滚轮），与本文件同目录的 fms-datepicker.js
  var SELF_SRC = document.currentScript && document.currentScript.src;
  function loadDatePicker() {
    if (window.FmsDatePicker || document.getElementById('fmsDatePickerJs') || !SELF_SRC) return;
    var sc = document.createElement('script');
    sc.id = 'fmsDatePickerJs';
    sc.src = SELF_SRC.replace(/fms-case\.js(\?.*)?$/, 'fms-datepicker.js');
    document.head.appendChild(sc);
  }
  function onReady() { mountTopBar(); renderOverall(); loadDatePicker(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
  window.addEventListener('pageshow', function (e) { if (e.persisted) renderOverall(); });

  window.FmsCase = {
    KEY: KEY, API: API, PARTS: PARTS, PART_NAMES: PART_NAMES, BQPG_SCALES: BQPG_SCALES, BQPG_EXTRA: BQPG_EXTRA, BQPG_ALL: BQPG_ALL,
    load: load, get: get, set: set, submit: submit, save: save, syncAll: syncAll, isSynced: isSynced, hasData: hasData,
    startNew: startNew, startFollowUp: startFollowUp, loadCase: loadCase, clear: clear, toast: toast,
    formData: formData, fillForm: fillForm, sumRadios: sumRadios,
    isViewMode: isViewMode, isViewingRecord: isViewingRecord, setMode: setMode,
    overall: overall, renderOverall: renderOverall
  };
})();
