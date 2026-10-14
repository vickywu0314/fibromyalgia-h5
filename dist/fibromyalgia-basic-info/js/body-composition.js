(function(){
  const U = window.FormUtils;
  const f = document.querySelector("#form"), file = document.querySelector("#file"), box = document.querySelector("#preview"), img = document.querySelector("#previewImg");
  // 页面填写的指标（腰臀比由两个 0-9 下拉拼成 0.xy，单独处理）
  const FIELDS = ["height", "weight", "bodyFatPercentage", "bodyFatMass", "skeletalMuscleMass", "skeletalMuscleIndex"];
  // 已去掉的指标（去脂体重、内脏脂肪等级）：页面不再填写，草稿 / 旧数据里已有的值原样保留
  const REMOVED = ["leanBodyMass", "visceralFatLevel"];

  // 数字格式限制：data-int 位整数、data-dec 位小数（如 __ __.__ 为 2 位整数 1 位小数），输入时自动截断
  function clampNumber(input){
    const iMax = Number(input.dataset.int) || 3, dMax = Number(input.dataset.dec) || 0;
    let v = input.value.replace(/[^\d.]/g, "");
    const dot = v.indexOf(".");
    let ip = dot === -1 ? v : v.slice(0, dot), dp = dot === -1 ? "" : v.slice(dot + 1).replace(/\./g, "");
    ip = ip.slice(0, iMax);
    v = dMax && dot !== -1 ? ip + "." + dp.slice(0, dMax) : ip;
    if (v !== input.value) input.value = v;
  }
  f.querySelectorAll("input[data-int]").forEach(el => {
    el.addEventListener("input", () => clampNumber(el));
    el.addEventListener("blur", () => { if (/\.$/.test(el.value)) el.value = el.value.slice(0, -1); });
  });
  // 腰臀比：0.xy ↔ 两个下拉
  function waistHipRatio(){
    const a = f.elements.whr1.value, b = f.elements.whr2.value;
    return a === "" && b === "" ? "" : "0." + (a || "0") + (b || "0");
  }
  function fillRatio(v){
    const m = /^0?\.(\d)(\d)?/.exec(String(v || ""));
    f.elements.whr1.value = m ? m[1] : "";
    f.elements.whr2.value = m ? (m[2] || "0") : "";
  }
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
    fillRatio(data.waistHipRatio);
    // 只回显已上传的 URL（旧草稿里的 base64 不再提交）；数组为空时用 imageUrl
    const imgs = (Array.isArray(data.reportImages) ? data.reportImages : []).filter(x => x && !/^data:/.test(x));
    showImage(imgs[0] || (data.imageUrl && !/^data:/.test(data.imageUrl) ? data.imageUrl : ""));
  }});

  // 填写中暂存草稿（入口显示「填写中」）；上传检验图片为附件
  function draft(){
    const d = U.serialize(f), value = {}, old = FmsCase.get("jbxx.bodyComposition") || {};
    FIELDS.forEach(k => { value[k] = d[k] != null ? String(d[k]).trim().replace(/\.$/, "") : ""; });
    value.waistHipRatio = waistHipRatio();
    REMOVED.forEach(k => { if (old[k] != null) value[k] = old[k]; });
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
