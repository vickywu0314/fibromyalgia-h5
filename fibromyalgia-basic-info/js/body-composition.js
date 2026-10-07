(function(){
  const U = window.FormUtils;
  const f = document.querySelector("#form"), file = document.querySelector("#file"), box = document.querySelector("#preview"), img = document.querySelector("#previewImg");
  const FIELDS = ["bodyFatPercentage", "bodyFatMass", "skeletalMuscleMass", "skeletalMuscleIndex", "leanBodyMass", "visceralFatLevel", "waistHipRatio"];
  let imageData = "";
  function showImage(src){
    imageData = src || "";
    if (src) { img.src = src; box.hidden = false; } else { img.removeAttribute("src"); box.hidden = true; }
  }
  // 目前没有图片上传接口：图片以 dataURL 存在草稿 reportImages 里。
  // 为避免超出 localStorage 容量，先压缩为最长边 1600px 的 JPEG。
  function compress(dataUrl){
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => {
        const max = 1600, scale = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * scale); c.height = Math.round(im.height * scale);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        try { resolve(c.toDataURL("image/jpeg", 0.8)); } catch (e) { resolve(dataUrl); }
      };
      im.onerror = () => resolve(dataUrl);
      im.src = dataUrl;
    });
  }
  file.onchange = () => {
    const x = file.files[0];
    if (!x) return;
    if (x.size > 5 * 1024 * 1024) { FmsCase.toast("文件大小不能超过5M"); file.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => compress(reader.result).then(src => { showImage(src); store(); });
    reader.readAsDataURL(x);
  };
  document.querySelector("#remove").onclick = () => { file.value = ""; showImage(""); store(); };

  U.bind({form: f, path: "jbxx.bodyComposition", update: data => {
    // 内脏脂肪等级按结构体存为“5级”，回显时还原为下拉值
    const lv = String(data.visceralFatLevel || "").replace(/级$/, "");
    f.elements.visceralFatLevel.value = lv;
    const imgs = Array.isArray(data.reportImages) ? data.reportImages : [];
    showImage(imgs[0] || "");
  }});

  // 进度：7 个指标中已填数（上传检验图片为附件，不计入）；填写中暂存草稿（入口显示「填写中」）
  function draft(){
    const d = U.serialize(f), value = {};
    FIELDS.forEach(k => { value[k] = d[k] != null ? String(d[k]).trim() : ""; });
    if (value.visceralFatLevel) value.visceralFatLevel += "级";
    value.reportImages = imageData ? [imageData] : [];
    value.imageUrl = "";
    return value;
  }
  const tracker = FmsProgress.track(f);
  const store = U.autoStore(f, "jbxx.bodyComposition", draft);
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };

  f.onsubmit = e => {
    e.preventDefault();
    const value = Object.assign({finish: true}, draft());
    U.save("jbxx.bodyComposition", value, {back: "basic-info.html", button: f.querySelector('button[type="submit"]')});
  };
})();
