(function(){
  const U = window.FormUtils;
  const f = document.querySelector("#form"), file = document.querySelector("#file"), box = document.querySelector("#preview"), img = document.querySelector("#previewImg");
  const FIELDS = ["bodyFatPercentage", "bodyFatMass", "skeletalMuscleMass", "skeletalMuscleIndex", "leanBodyMass", "visceralFatLevel", "waistHipRatio"];
  let imageData = "";
  function showImage(src){
    imageData = src || "";
    if (src) { img.src = src; box.hidden = false; } else { img.removeAttribute("src"); box.hidden = true; }
  }
  // 选图后先上传到 /api/upload/image，草稿和提交里只存返回的图片 URL
  let uploading = false;
  file.onchange = async () => {
    const x = file.files[0];
    if (!x) return;
    file.value = "";
    const local = URL.createObjectURL(x);
    img.src = local; box.hidden = false; uploading = true;
    FmsCase.toast("图片上传中…");
    try {
      const url = await FmsUpload.image(x);
      showImage(url); store();
      FmsCase.toast("图片已上传");
    } catch (e) {
      showImage(imageData);
      FmsCase.toast(e.message || "图片上传失败");
    } finally { uploading = false; URL.revokeObjectURL(local); }
  };
  document.querySelector("#remove").onclick = () => { file.value = ""; showImage(""); store(); };

  U.bind({form: f, path: "jbxx.bodyComposition", update: data => {
    // 内脏脂肪等级按结构体存为“5级”，回显时还原为下拉值
    const lv = String(data.visceralFatLevel || "").replace(/级$/, "");
    f.elements.visceralFatLevel.value = lv;
    // 只回显已上传的 URL（旧草稿里的 base64 不再提交）；数组为空时用 imageUrl
    const imgs = (Array.isArray(data.reportImages) ? data.reportImages : []).filter(x => x && !/^data:/.test(x));
    showImage(imgs[0] || (data.imageUrl && !/^data:/.test(data.imageUrl) ? data.imageUrl : ""));
  }});

  // 进度：7 个指标中已填数（上传检验图片为附件，不计入）；填写中暂存草稿（入口显示「填写中」）
  function draft(){
    const d = U.serialize(f), value = {};
    FIELDS.forEach(k => { value[k] = d[k] != null ? String(d[k]).trim() : ""; });
    if (value.visceralFatLevel) value.visceralFatLevel += "级";
    value.reportImages = imageData ? [imageData] : [];
    value.imageUrl = imageData;
    return value;
  }
  const tracker = FmsProgress.track(f);
  const store = U.autoStore(f, "jbxx.bodyComposition", draft);
  const setFormData = window.setFormData;
  window.setFormData = function(data){ setFormData(data); tracker.refresh(); };

  f.onsubmit = e => {
    e.preventDefault();
    if (uploading) { FmsCase.toast("图片还在上传，请稍候"); return; }
    const value = Object.assign({finish: true}, draft());
    U.save("jbxx.bodyComposition", value, {back: "basic-info.html", button: f.querySelector('button[type="submit"]')});
  };
})();
