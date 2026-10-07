// 页面顶部进度条：按实际填写情况显示「已完成 x%」，不再写死。
// 用法：
//   表单页：FmsProgress.track(form, { optional: ['备注字段名'], extra: () => ({ answered, total }) })
//           按「每个 name 算一题」统计当前可见、可用的题目；隐藏的条件题、上传、只读字段不计。
//           在表单 input/change 以及条件区域显隐变化时自动刷新；回显数据后可调用返回的 refresh()。
//   汇总/列表页：FmsProgress.set(answered, total)
(function () {
  function render(answered, total) {
    var pct = total > 0 ? Math.round(Math.min(answered, total) / total * 100) : 0;
    document.querySelectorAll('.progress-block').forEach(function (block) {
      var bar = block.querySelector('.progress');
      var fill = bar && bar.querySelector('span');
      var text = block.querySelector('p');
      if (fill) fill.style.width = pct + '%';
      if (bar) { bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(pct)); }
      if (text) text.textContent = '已完成' + pct + '%';
    });
    return pct;
  }

  function visible(el) {
    if (el.closest('[hidden]')) return false;
    var box = el.closest('label') || el.parentElement || el;
    return box.getClientRects().length > 0;
  }

  // 返回表单内需要作答的题目分组：{ name: [元素...] }
  function questions(form, optional) {
    var groups = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      var name = el.name;
      if (!name || el.disabled || optional.indexOf(name) !== -1) return;
      var type = (el.type || '').toLowerCase();
      if (['hidden', 'file', 'button', 'submit', 'reset'].indexOf(type) !== -1) return;
      if (el.hasAttribute('data-optional') || el.readOnly) return;
      if (!visible(el)) return;
      (groups[name] = groups[name] || []).push(el);
    });
    return groups;
  }

  function isAnswered(list) {
    var first = list[0], type = (first.type || '').toLowerCase();
    if (type === 'radio' || type === 'checkbox') return list.some(function (x) { return x.checked; });
    if (type === 'range') return list.some(function (x) { return x.dataset.touched === '1'; });
    return list.some(function (x) { return String(x.value || '').trim() !== ''; });
  }

  function count(form, opts) {
    var groups = questions(form, opts.optional || []);
    var names = Object.keys(groups);
    var answered = names.filter(function (n) { return isAnswered(groups[n]); }).length;
    var total = names.length;
    if (typeof opts.extra === 'function') {
      var e = opts.extra() || {};
      answered += e.answered || 0;
      total += e.total || 0;
    }
    return { answered: answered, total: total };
  }

  function track(form, opts) {
    opts = opts || {};
    if (!form) return { refresh: function () {} };
    var queued = false;
    function refresh() {
      queued = false;
      var r = count(form, opts);
      render(r.answered, r.total);
      return r;
    }
    function schedule() {
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(refresh);
    }
    form.addEventListener('input', function (e) { if (e.target && e.target.type === 'range') e.target.dataset.touched = '1'; schedule(); });
    form.addEventListener('change', schedule);
    form.addEventListener('click', schedule);
    // 条件题显隐（hidden / class / style 变化）后重新统计
    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(form, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'disabled'] });
    }
    window.addEventListener('pageshow', schedule);
    refresh();
    return { refresh: refresh, count: function () { return count(form, opts); } };
  }

  window.FmsProgress = { track: track, set: render, count: count };
})();
