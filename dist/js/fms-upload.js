// 图片上传：沿用老前端的做法——前端直接 POST /api/upload/image，multipart/form-data 只放一个字段 file，
// 不加任何鉴权头，身份靠同域 Cookie（credentials: 'include'）。返回的图片 URL 写进表单数据，随 case/add 一起提交。
// 用法：
//   const url = await FmsUpload.image(file)            // File / Blob；图片会先压缩成最长边 1600px 的 JPEG
//   const url = await FmsUpload.image(blob, { compress: false, filename: 'signature.png' })
//   const blob = await FmsUpload.canvasToBlob(canvas)  // 电子签名等 canvas 转 PNG
(function () {
  var API = '/api/upload/image';
  var MAX_SIDE = 1600, QUALITY = 0.82, MAX_SIZE = 5 * 1024 * 1024;

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片无法读取，请重新选择')); };
      img.src = url;
    });
  }

  // 压缩为 JPEG；GIF 或压缩后反而更大时用原图
  async function compress(file) {
    if (!file.type || file.type === 'image/gif') return file;
    var img = await loadImage(file);
    var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    var w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    var blob = await new Promise(function (resolve) { c.toBlob(resolve, 'image/jpeg', QUALITY); });
    return blob && blob.size < file.size ? blob : file;
  }

  function canvasToBlob(canvas, type) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('签名图片生成失败')); }, type || 'image/png');
    });
  }

  // 从返回值里取图片地址（兼容 data 直接是字符串，或 data.url / data.path 等常见写法）
  function pickUrl(result) {
    if (!result) return '';
    if (typeof result === 'string') return result;
    var d = result.data;
    if (typeof d === 'string') return d;
    var keys = ['url', 'src', 'path', 'fileUrl', 'imageUrl', 'imgUrl', 'link'];
    var objs = [d, result].filter(function (o) { return o && typeof o === 'object'; });
    for (var i = 0; i < objs.length; i++) {
      for (var k = 0; k < keys.length; k++) if (typeof objs[i][keys[k]] === 'string' && objs[i][keys[k]]) return objs[i][keys[k]];
    }
    return '';
  }

  async function image(file, opts) {
    opts = opts || {};
    if (!file) throw new Error('请选择图片');
    if (file.size > MAX_SIZE) throw new Error('图片大小不能超过5M');
    var body = opts.compress === false ? file : await compress(file);
    var name = opts.filename || (body === file && file.name) || 'image.jpg';
    var fd = new FormData();
    fd.append('file', body, name);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);
    var response, result;
    try {
      // 不手动设置 Content-Type，浏览器会带上 multipart/form-data 和 boundary
      response = await fetch(API, { method: 'POST', body: fd, credentials: 'include', signal: controller.signal });
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? '图片上传超时，请稍后重试' : '图片上传失败，请检查网络');
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new Error('图片上传失败（' + response.status + '）');
    var text = await response.text();
    try { result = JSON.parse(text); } catch (e) { result = text.trim(); }
    if (result && typeof result === 'object' && (result.success === false || (result.code != null && [0, 200, '0', '200'].indexOf(result.code) === -1))) {
      throw new Error(result.message || result.msg || '图片上传失败');
    }
    var url = pickUrl(result);
    if (!url) throw new Error('图片上传成功但未返回地址');
    return url;
  }

  window.FmsUpload = { API: API, image: image, compress: compress, canvasToBlob: canvasToBlob, pickUrl: pickUrl };
})();
