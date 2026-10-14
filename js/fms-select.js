// 下拉选择：点击 <select> 时不弹手机原生选项框，改为在输入框正下方展开、与输入框左右对齐等宽的选项列表。
// 页面引入本文件即生效（main 内所有 select.control）；选项由页面脚本动态生成也没问题——每次展开时读取当前 options。
// 选中后写回 select.value 并触发 change / input，原有联动逻辑照常工作。
(function () {
  if (window.FmsSelect) return;
  var css = '' +
    '.fsel{position:relative;display:block;min-width:0}' +
    '.fsel>select{pointer-events:none}' +
    '.fsel-hit{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.fsel-hit:disabled{cursor:default}' +
    '.fsel.open>select{border-color:#168bdd}' +
    '.fsel-panel{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:60;max-height:264px;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0;padding:4px 0;list-style:none;background:#fff;border:1px solid #d4d7dc;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.12)}' +
    '.fsel-panel li{display:flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;font-size:15px;line-height:1.4;color:#222;cursor:pointer}' +
    '.fsel-panel li+li{border-top:1px solid #f0f1f3}' +
    '.fsel-panel li:active{background:#f3f8fd}' +
    '.fsel-panel li.on{color:#168bdd}' +
    '.fsel-panel li.on::after{content:"✓";margin-left:auto;font-size:15px}' +
    '.fsel-panel li[aria-disabled=true]{color:#b9bec5;cursor:default}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var current = null; // { wrap, panel }

  function close() {
    if (!current) return;
    current.panel.remove();
    current.wrap.classList.remove('open');
    current.hit.setAttribute('aria-expanded', 'false');
    current = null;
  }

  function open(wrap, select, hit) {
    if (current && current.wrap === wrap) { close(); return; }
    close();
    var panel = document.createElement('ul');
    panel.className = 'fsel-panel';
    panel.setAttribute('role', 'listbox');
    Array.prototype.forEach.call(select.options, function (o) {
      if (o.value === '' ) return; // 「请选择…」占位项不列出
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.textContent = o.textContent;
      li.dataset.value = o.value;
      if (o.value === select.value) { li.classList.add('on'); li.setAttribute('aria-selected', 'true'); }
      if (o.disabled) li.setAttribute('aria-disabled', 'true');
      panel.appendChild(li);
    });
    if (!panel.children.length) { var empty = document.createElement('li'); empty.textContent = '暂无可选项'; empty.setAttribute('aria-disabled', 'true'); panel.appendChild(empty); }
    panel.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li || li.getAttribute('aria-disabled') === 'true' || li.dataset.value == null) return;
      select.value = li.dataset.value;
      close();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      hit.focus();
    });
    wrap.appendChild(panel);
    wrap.classList.add('open');
    hit.setAttribute('aria-expanded', 'true');
    current = { wrap: wrap, panel: panel, hit: hit };
    var on = panel.querySelector('.on');
    if (on) panel.scrollTop = on.offsetTop - panel.clientHeight / 2 + on.offsetHeight / 2;
    // 向下展开；若面板底部超出屏幕，把页面往上滚一点让它完整可见
    var r = panel.getBoundingClientRect();
    if (r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 12, behavior: 'smooth' });
  }

  function enhance(select) {
    if (select.dataset.fsel || select.multiple) return;
    select.dataset.fsel = '1';
    var wrap = document.createElement('span');
    wrap.className = 'fsel';
    var cs = getComputedStyle(select);
    if (cs.flexGrow !== '0') { wrap.style.flex = cs.flex; } // 如剂量行里的 select（flex:1）
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    var hit = document.createElement('button');
    hit.type = 'button';
    hit.className = 'fsel-hit';
    hit.setAttribute('aria-haspopup', 'listbox');
    hit.setAttribute('aria-expanded', 'false');
    hit.setAttribute('aria-label', select.getAttribute('aria-label') || (select.closest('label') && select.closest('label').querySelector('.field-title') || {}).textContent || '请选择');
    select.tabIndex = -1;
    wrap.appendChild(hit);
    hit.addEventListener('click', function (e) {
      e.preventDefault();
      if (select.disabled) return;
      open(wrap, select, hit);
    });
    // 禁用状态同步到点击层
    var sync = function () { hit.disabled = select.disabled; };
    sync();
    if (window.MutationObserver) new MutationObserver(sync).observe(select, { attributes: true, attributeFilter: ['disabled'] });
  }

  function scan(root) {
    (root.querySelectorAll ? root.querySelectorAll('main select.control') : []).forEach(enhance);
  }
  document.addEventListener('pointerdown', function (e) { if (current && !current.wrap.contains(e.target)) close(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  function start() {
    scan(document);
    if (window.MutationObserver) new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches('main select.control')) enhance(n); else scan(n); } }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.FmsSelect = { close: close, enhance: enhance };
})();
