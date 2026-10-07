/* 本病治疗史入口页：显示各类别状态（未填写 / 填写中 / 已完成）；
   进度 = 已完成的类别数 / 4（“无”，或“有”且≥1条记录算完成）。
   “保存并返回”：4 类都完成时置 jbxx.treatmentHistory.finish = true，否则 finish = false（基本信息页显示“填写中”），回基本信息页。 */
(function(){
  var S = window.BenbingStore;
  var kinds = Object.keys(S.KINDS);

  function render() {
    document.querySelectorAll('[data-kind-link]').forEach(function (a) {
      var kind = a.dataset.kindLink, st = S.state(kind), n = S.items(kind).length, el = a.querySelector('.kind-status');
      if (!el) return;
      el.textContent = S.STATUS_TEXT[st] + (st === 'done' && n ? '（' + n + '条）' : '');
      el.className = 'kind-status' + (st === 'done' ? ' done' : st === 'doing' ? ' doing' : '');
    });
    S.setProgress(S.doneKinds(), kinds.length);
  }
  render();
  // 从子页面返回（含浏览器往返缓存）时按最新草稿刷新
  window.addEventListener('pageshow', function (e) { if (e.persisted) render(); });

  document.getElementById('saveButton').addEventListener('click', function () {
    var th = S.all(), pending = kinds.filter(function (kind) { return S.state(kind) !== 'done'; });
    if (pending.length && !confirm('以下类别尚未完成：' + pending.map(function (k) { return S.KINDS[k].label; }).join('、') + '。\n现在保存，本病治疗史将显示为“填写中”，确定保存并返回吗？')) return;
    var value = { finish: !pending.length };
    kinds.forEach(function (kind) {
      var k = S.KINDS[kind];
      if (!Array.isArray(th[k.key])) value[k.key] = [];
    });
    FmsCase.save(S.PATH, value, { merge: true, button: this, back: '../fibromyalgia-basic-info/basic-info.html' });
  });
})();
