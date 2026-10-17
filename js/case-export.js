// 导出病历 PDF：按 caseId 从 case/detail 取服务器上已保存的病例（还没保存过的新病例用本地草稿），
// 用查看页同一套渲染（FmsCaseView.render）生成各模块内容，再按 A4 版式重新排版，逐页截图后合成 PDF。
// 版式参考 RA「随诊病历 / 查看随诊病例」：大标题 + 患者信息；各模块粗体标题，内容为「项目：值」；
// 基本信息按序号两列排列。按整行分页，不会把一行字切成两半。
//
// 生成后交给谁处理（依次尝试）：
//   1. App 原生接口（保存到本地 / 转发微信等需 App 提供）：
//      Android：WenwenClass.sharePdf(base64, fileName)
//      iOS：window.webkit.messageHandlers.sharePdf.postMessage({ base64, fileName })
//      base64 为 PDF 文件内容（不含 data: 前缀）。App 收到后保存文件并弹出系统分享面板。
//   2. 系统分享（navigator.share 带文件，手机浏览器 / 部分 WebView 支持）：可存到「文件」或发给微信。
//   3. 直接下载（电脑浏览器等）。
// 之后立即打开全屏预览（与 PDF 相同的页面图片），预览里可再次「保存 / 分享」或关闭。
(function () {
  var A4_W = 794, A4_H = 1123, PAD = 56; // A4 在 96dpi 下的像素尺寸、页边距
  var VENDOR = ['./js/vendor/html2canvas-1.4.1.min.js', './js/vendor/jspdf-2.5.1.umd.min.js'];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error('导出组件加载失败')); };
      document.head.appendChild(s);
    });
  }
  function loadVendors() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    return VENDOR.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve());
  }

  var CSS =
    '.px-page{position:relative;box-sizing:border-box;width:' + A4_W + 'px;height:' + A4_H + 'px;padding:' + PAD + 'px ' + PAD + 'px ' + (PAD + 20) + 'px;background:#fff;color:#111;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;overflow:hidden}' +
    '.px-title{text-align:center;font-size:26px;font-weight:700;margin:0 0 6px}' +
    '.px-meta{text-align:center;font-size:14px;color:#555;margin:0 0 18px}' +
    '.px-h2{font-size:20px;font-weight:700;margin:22px 0 8px;padding-top:14px;border-top:1px solid #e3e6ea}' +
    '.px-first{border-top:0;padding-top:0;margin-top:6px}' +
    '.px-sub{font-size:16px;font-weight:700;margin:12px 0 4px}' +
    '.px-row{font-size:15px;line-height:1.75;word-break:break-all}' +
    '.px-row b{font-weight:400;color:#333}' +
    '.px-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:28px}' +
    '.px-empty{font-size:14px;color:#888;line-height:1.75}' +
    '.px-foot{position:absolute;left:0;right:0;bottom:' + (PAD / 2) + 'px;text-align:center;font-size:12px;color:#999}';

  // 从渲染好的内容取出各模块：[{ title, items: [{type:'sub'|'row'|'empty', k, v}] }]
  function collectSections(root) {
    return Array.prototype.map.call(root.querySelectorAll(':scope > .cv-sec'), function (sec) {
      var items = [];
      Array.prototype.forEach.call(sec.children, function (el) {
        if (el.classList.contains('cv-sub')) items.push({ type: 'sub', text: el.textContent });
        else if (el.classList.contains('cv-row')) items.push({ type: 'row', k: el.querySelector('.k').textContent, v: el.querySelector('.v').textContent });
        else if (el.classList.contains('cv-empty')) items.push({ type: 'empty', text: el.textContent });
      });
      // 只有图片的小标题（检验报告、处方照片等）：PDF 不放图片，标题也不显示
      items = items.filter(function (it, i) { return it.type !== 'sub' || (items[i + 1] && items[i + 1].type !== 'sub'); });
      return { title: (sec.querySelector('h2') || {}).textContent || '', items: items };
    });
  }

  function div(cls, text) { var d = document.createElement('div'); d.className = cls; if (text != null) d.textContent = text; return d; }
  function rowEl(k, v, no) {
    var d = div('px-row'), b = document.createElement('b');
    b.textContent = (no ? no + '.' : '') + k + '：';
    d.appendChild(b); d.appendChild(document.createTextNode(v));
    return d;
  }

  // 按块排版到 A4 页：放不下就换页。标题与其后第一块一起换页，避免标题落在页底。
  function paginate(host, header, sections) {
    var pages = [];
    var page, body;
    function newPage() {
      page = div('px-page'); body = div('px-body');
      page.appendChild(body); host.appendChild(page); pages.push(page);
    }
    function fits() { return body.offsetHeight <= A4_H - PAD * 2 - 20; }
    function place(nodes) {
      nodes.forEach(function (n) { body.appendChild(n); });
      if (fits() || body.children.length === nodes.length) return;
      nodes.forEach(function (n) { body.removeChild(n); });
      newPage();
      // 换页后页首的模块标题不要分隔线和上边距
      if (nodes[0].classList.contains('px-h2')) nodes[0].classList.add('px-first');
      nodes.forEach(function (n) { body.appendChild(n); });
    }
    newPage();
    header.forEach(function (n) { body.appendChild(n); });
    sections.forEach(function (sec, si) {
      var h = div('px-h2' + (si === 0 ? ' px-first' : ''), sec.title);
      var blocks = [];
      var basic = sec.title === '基本信息';
      var no = 0, grid = null;
      sec.items.forEach(function (it) {
        if (it.type === 'sub') { grid = null; blocks.push(div('px-sub', it.text)); return; }
        if (it.type === 'empty') { blocks.push(div('px-empty', it.text)); return; }
        // 基本信息第一组（个人信息）按序号两列排列，每两项一行作为一个分页块
        if (basic && !blocks.some(function (b) { return b.className === 'px-sub'; })) {
          if (!grid || grid.children.length === 2) { grid = div('px-grid'); blocks.push(grid); }
          grid.appendChild(rowEl(it.k, it.v, ++no));
          return;
        }
        blocks.push(rowEl(it.k, it.v));
      });
      if (!blocks.length) blocks.push(div('px-empty', '未填写'));
      place([h, blocks[0]]);
      for (var i = 1; i < blocks.length; i++) place([blocks[i]]);
    });
    pages.forEach(function (p, i) { p.appendChild(div('px-foot', '第 ' + (i + 1) + ' / ' + pages.length + ' 页')); });
    return pages;
  }

  // 取病例：已保存过的（有 id）从 detail 接口取最新数据；否则用本地草稿
  async function caseData() {
    var draft = FmsCase.load();
    if (draft.id == null || !FmsCase.fetchCase) return draft;
    var c = await FmsCase.fetchCase({
      caseId: draft.id, patientId: draft.patientId, visitType: draft.visitType, visitDate: draft.visitDate,
      name: draft.jbxx && draft.jbxx.name, idCard: draft.jbxx && draft.jbxx.idCard, researchNo: draft.researchNo
    });
    return c;
  }

  async function buildPdf() {
    var c = await caseData();
    await loadVendors();
    var content = document.createElement('div');
    window.FmsCaseView.render(c, content);
    var isBaseline = c.visitType !== '随诊';
    var name = (c.jbxx && c.jbxx.name) || '患者';
    var host = div('px-host');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:' + A4_W + 'px;pointer-events:none';
    var style = document.createElement('style'); style.textContent = CSS; host.appendChild(style);
    document.body.appendChild(host);
    try {
      var header = [
        div('px-title', '纤维肌痛' + (isBaseline ? '基线访问病历' : '随诊病历')),
        div('px-meta', [name, c.researchNo ? '研究编号 ' + c.researchNo : '', isBaseline ? '基线访问' : '随诊', c.visitDate].filter(Boolean).join('　'))
      ];
      var pages = paginate(host, header, collectSections(content));
      var pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4', compress: true });
      var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      var images = []; // 每页图片，同时用于生成后立即打开的预览
      for (var i = 0; i < pages.length; i++) {
        var canvas = await window.html2canvas(pages[i], { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
        var img = canvas.toDataURL('image/jpeg', 0.92);
        images.push(img);
        if (i) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, 0, pw, ph);
      }
      var fileName = [name, c.researchNo, isBaseline ? '基线访问' : '随诊', c.visitDate].filter(Boolean).join('_').replace(/[\\/:*?"<>|\s]+/g, '') + '.pdf';
      return { blob: pdf.output('blob'), fileName: fileName, images: images };
    } finally {
      host.remove();
    }
  }

  function toBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).replace(/^data:[^,]*,/, '')); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  // 交给 App / 系统分享 / 下载；返回提示文字
  async function deliver(blob, fileName) {
    var native = window.WenwenClass;
    if (native && typeof native.sharePdf === 'function') {
      native.sharePdf(await toBase64(blob), fileName);
      return '';
    }
    var ios = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.sharePdf;
    if (ios) {
      ios.postMessage({ base64: await toBase64(blob), fileName: fileName });
      return '';
    }
    try {
      var file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        return '';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return ''; // 用户取消分享
    }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    return '已生成 PDF：' + fileName;
  }

  // 生成后立即打开：全屏预览 PDF 各页（App 的 WebView 多数不能直接显示 PDF 文件，这里用与 PDF 相同的页面图片显示）
  var PREVIEW_CSS =
    '#fmsPdfPreview{position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;background:#525659}' +
    '#fmsPdfPreview .pv-bar{flex:none;display:flex;align-items:center;gap:10px;padding:10px 12px;padding-top:calc(10px + env(safe-area-inset-top));background:#2f3136;color:#fff}' +
    '#fmsPdfPreview .pv-name{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#fmsPdfPreview button{flex:none;height:32px;padding:0 14px;border-radius:6px;font-size:14px;border:1px solid #fff;background:transparent;color:#fff}' +
    '#fmsPdfPreview button.pv-share{background:#168bdd;border-color:#168bdd}' +
    '#fmsPdfPreview .pv-pages{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px 12px calc(16px + env(safe-area-inset-bottom))}' +
    '#fmsPdfPreview .pv-pages img{display:block;width:100%;max-width:794px;margin:0 auto 12px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35)}' +
    '#fmsPdfPreview.zoom .pv-pages img{width:200%;max-width:none}' +
    '#fmsPdfPreview .pv-tip{text-align:center;color:#d0d3d8;font-size:12px;margin:0 0 12px}';
  function openPreview(out) {
    closePreview();
    if (!document.getElementById('fmsPdfPreviewCss')) {
      var st = document.createElement('style'); st.id = 'fmsPdfPreviewCss'; st.textContent = PREVIEW_CSS; document.head.appendChild(st);
    }
    var box = div(''); box.id = 'fmsPdfPreview';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'PDF 预览');
    var bar = div('pv-bar');
    var close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭';
    var share = document.createElement('button'); share.type = 'button'; share.className = 'pv-share'; share.textContent = '保存 / 分享';
    bar.appendChild(close); bar.appendChild(div('pv-name', out.fileName)); bar.appendChild(share);
    var list = div('pv-pages');
    list.appendChild(div('pv-tip', '共 ' + out.images.length + ' 页 · 点击页面放大 / 缩小'));
    // 点页面放大到 2 倍（可左右上下滑动查看），再点缩回
    list.addEventListener('click', function (e) { if (e.target.tagName === 'IMG') box.classList.toggle('zoom'); });
    out.images.forEach(function (src, i) { var im = document.createElement('img'); im.src = src; im.alt = '第 ' + (i + 1) + ' 页'; list.appendChild(im); });
    box.appendChild(bar); box.appendChild(list);
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';
    close.onclick = closePreview;
    share.onclick = async function () {
      try { var msg = await deliver(out.blob, out.fileName); if (msg) FmsCase.toast(msg); }
      catch (e) { FmsCase.toast((e && e.message) || '保存失败，请稍后重试'); }
    };
  }
  function closePreview() {
    var box = document.getElementById('fmsPdfPreview');
    if (box) box.remove();
    document.documentElement.style.overflow = '';
  }

  var busy = false;
  window.FmsCaseExport = {
    close: closePreview,
    build: buildPdf,
    run: async function (button) {
      if (busy) return;
      busy = true;
      var label = button && button.textContent;
      if (button) { button.disabled = true; button.textContent = '正在生成…'; }
      try {
        var out = await buildPdf();
        var msg = '';
        try { msg = await deliver(out.blob, out.fileName); } catch (e) { msg = '保存失败，可在预览里点「保存 / 分享」重试'; }
        openPreview(out); // 保存 / 下载后立即打开预览（保存失败也打开）
        if (msg) FmsCase.toast(msg);
      } catch (e) {
        FmsCase.toast((e && e.message) || '导出失败，请稍后重试');
      } finally {
        busy = false;
        if (button) { button.disabled = false; button.textContent = label; }
      }
    }
  };
})();
