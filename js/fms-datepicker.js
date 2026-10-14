// 统一日期选择：页面上所有 <input type="date"> 点击后从页面底部拉起「年 / 月 / 日」滚轮选择器，
// 顶部「取消 · 日期选择器 · 确定」。由 fms-case.js 自动加载，页面无需改动。
// 输入框保留 type="date"（样式、取值格式 yyyy-MM-dd 不变），加 readonly 阻止手机原生日期弹窗；
// 确定后写回 value 并触发 input / change，原有的回显、暂存、校验逻辑照常工作。
(function () {
  if (window.FmsDatePicker) return;
  var ITEM = 40, ROWS = 5; // 每行高度、可见行数（中间一行为选中）
  var css = '' +
    '.fdp-mask{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.35);opacity:0;transition:opacity .2s}' +
    '.fdp-mask.show{opacity:1}' +
    '.fdp-sheet{position:fixed;left:0;right:0;bottom:0;z-index:10001;background:#fff;border-radius:12px 12px 0 0;transform:translateY(100%);transition:transform .25s ease;padding-bottom:env(safe-area-inset-bottom);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}' +
    '.fdp-sheet.show{transform:none}' +
    '.fdp-head{display:flex;align-items:center;justify-content:space-between;height:52px;padding:0 6px;border-bottom:1px solid #eceef1}' +
    '.fdp-head button{border:0;background:none;padding:0 14px;height:44px;font-size:16px;color:#888;cursor:pointer}' +
    '.fdp-head .fdp-ok{color:#168bdd}' +
    '.fdp-title{font-size:17px;color:#222}' +
    '.fdp-body{position:relative;display:flex;height:' + ITEM * ROWS + 'px;margin:12px 0 18px}' +
    '.fdp-col{flex:1;height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:' + ITEM * 2 + 'px 0;box-sizing:border-box;' +
      '-webkit-mask-image:linear-gradient(to bottom,rgba(0,0,0,.25),#000 40%,#000 60%,rgba(0,0,0,.25));mask-image:linear-gradient(to bottom,rgba(0,0,0,.25),#000 40%,#000 60%,rgba(0,0,0,.25))}' +
    '.fdp-col::-webkit-scrollbar{display:none}' +
    '.fdp-col div{height:' + ITEM + 'px;line-height:' + ITEM + 'px;text-align:center;font-size:17px;color:#999;scroll-snap-align:center}' +
    '.fdp-col div.on{color:#222;font-size:18px}' +
    '.fdp-band{position:absolute;left:0;right:0;top:' + ITEM * 2 + 'px;height:' + ITEM + 'px;border-top:1px solid #e3e5e8;border-bottom:1px solid #e3e5e8;pointer-events:none}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function daysIn(y, m) { return new Date(y, m, 0).getDate(); }
  function parse(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? [+m[1], +m[2], +m[3]] : null; }

  var mask, sheet, cols = {}, target = null, sel = {};

  function build() {
    mask = document.createElement('div'); mask.className = 'fdp-mask';
    sheet = document.createElement('div'); sheet.className = 'fdp-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '日期选择器');
    sheet.innerHTML = '<div class="fdp-head"><button type="button" class="fdp-cancel">取消</button><span class="fdp-title">日期选择器</span><button type="button" class="fdp-ok">确定</button></div>' +
      '<div class="fdp-body"><div class="fdp-col" data-k="y"></div><div class="fdp-col" data-k="m"></div><div class="fdp-col" data-k="d"></div><div class="fdp-band"></div></div>';
    document.body.appendChild(mask); document.body.appendChild(sheet);
    ['y', 'm', 'd'].forEach(function (k) {
      var col = cols[k] = sheet.querySelector('[data-k="' + k + '"]'), timer;
      col.addEventListener('scroll', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { settle(k); }, 90);
      });
      // 点某一项直接滚到该项
      col.addEventListener('click', function (e) {
        var i = Array.prototype.indexOf.call(col.children, e.target);
        if (i >= 0) col.scrollTo({ top: i * ITEM, behavior: 'smooth' });
      });
    });
    mask.addEventListener('click', close);
    sheet.querySelector('.fdp-cancel').addEventListener('click', close);
    sheet.querySelector('.fdp-ok').addEventListener('click', confirm);
  }

  function fill(k, values, suffix, current) {
    var col = cols[k];
    col.innerHTML = values.map(function (v) { return '<div data-v="' + v + '">' + v + suffix + '</div>'; }).join('');
    var i = Math.max(0, values.indexOf(current));
    col.scrollTop = i * ITEM;
    mark(k, i);
    return values[i];
  }
  function mark(k, i) {
    Array.prototype.forEach.call(cols[k].children, function (el, j) { el.classList.toggle('on', j === i); });
  }
  function settle(k) {
    var col = cols[k], i = Math.min(col.children.length - 1, Math.max(0, Math.round(col.scrollTop / ITEM)));
    if (Math.abs(col.scrollTop - i * ITEM) > 1) col.scrollTo({ top: i * ITEM, behavior: 'smooth' });
    mark(k, i);
    sel[k] = +col.children[i].dataset.v;
    if (k !== 'd') renderDays(); // 年、月变化后重算当月天数
  }
  function renderDays() {
    var n = daysIn(sel.y, sel.m), days = [];
    for (var d = 1; d <= n; d++) days.push(d);
    sel.d = fill('d', days, '日', Math.min(sel.d, n));
  }

  function open(input) {
    if (!sheet) build();
    target = input;
    var today = new Date();
    var min = parse(input.min), max = parse(input.max);
    var y0 = min ? min[0] : 1920, y1 = max ? max[0] : today.getFullYear() + 10;
    var cur = parse(input.value) || [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    cur[0] = Math.min(y1, Math.max(y0, cur[0]));
    sheet.querySelector('.fdp-title').textContent = '日期选择器';
    mask.style.display = sheet.style.display = 'block';
    var years = [], months = [];
    for (var y = y0; y <= y1; y++) years.push(y);
    for (var m = 1; m <= 12; m++) months.push(m);
    sel.y = fill('y', years, '年', cur[0]);
    sel.m = fill('m', months, '月', cur[1]);
    sel.d = cur[2];
    renderDays();
    // 先强制一次重排再加 show，保证滑入动画生效（不依赖 requestAnimationFrame，后台 / 低端 WebView 也能打开）
    void sheet.offsetHeight;
    mask.classList.add('show'); sheet.classList.add('show');
  }
  function close() {
    if (!sheet) return;
    mask.classList.remove('show'); sheet.classList.remove('show');
    setTimeout(function () { if (!sheet.classList.contains('show')) mask.style.display = sheet.style.display = 'none'; }, 260);
    target = null;
  }
  function confirm() {
    ['y', 'm', 'd'].forEach(settleNow);
    var v = sel.y + '-' + pad(sel.m) + '-' + pad(Math.min(sel.d, daysIn(sel.y, sel.m)));
    var input = target;
    close();
    if (!input) return;
    if (input.min && v < input.min) v = input.min;
    if (input.max && v > input.max) v = input.max;
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // 确定时按当前滚动位置取值（滚动刚停还没触发 settle 的情况）
  function settleNow(k) {
    var col = cols[k], i = Math.min(col.children.length - 1, Math.max(0, Math.round(col.scrollTop / ITEM)));
    sel[k] = +col.children[i].dataset.v;
  }

  // 接管页面上的日期输入框：只读（不弹原生选择器），点击拉起底部选择器
  function adopt(root) {
    (root.querySelectorAll ? root.querySelectorAll('input[type=date]') : []).forEach(function (el) {
      if (el.dataset.fmsDate) return;
      el.dataset.fmsDate = '1';
      el.readOnly = true;
      el.setAttribute('inputmode', 'none');
      el.style.cursor = 'pointer';
    });
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('input[data-fms-date]');
    if (!el || el.disabled) return;
    e.preventDefault();
    el.blur();
    open(el);
  }, true);
  // 键盘用户：回车 / 空格打开
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (el && el.dataset && el.dataset.fmsDate && !el.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(el); }
    if (e.key === 'Escape' && target) close();
  });
  function start() {
    adopt(document);
    if (window.MutationObserver) new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) adopt(n.matches && n.matches('input[type=date]') ? n.parentNode || n : n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.FmsDatePicker = { open: open, close: close };
})();
