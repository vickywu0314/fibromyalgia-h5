/* 本病治疗史入口页：显示各类别状态；“保存并返回”置 jbxx.treatmentHistory.finish = true 并回病史病情页 */
(function(){
  var S = window.BenbingStore;
  document.querySelectorAll('[data-kind-link]').forEach(function (a) {
    var kind = a.dataset.kindLink, n = S.items(kind).length, has = S.has(kind), el = a.querySelector('.kind-status');
    if (el) { el.textContent = n ? n + '条' : has === '无' ? '无' : '未填写'; el.className = 'kind-status' + (n || has ? ' done' : ''); }
  });
  S.setProgress(S.all().finish ? 100 : Math.round(S.doneKinds() / 4 * 100));

  document.getElementById('saveButton').addEventListener('click', function () {
    var th = S.all(), value = { finish: true };
    Object.keys(S.KINDS).forEach(function (kind) {
      var k = S.KINDS[kind];
      if (!Array.isArray(th[k.key])) value[k.key] = [];
    });
    FmsCase.save(S.PATH, value, { merge: true, button: this, back: '../fibromyalgia-condition-history/condition-history.html' });
  });
})();
