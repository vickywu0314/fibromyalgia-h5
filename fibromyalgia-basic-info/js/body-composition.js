(function(){
  const U = window.FormUtils;
  const f = document.querySelector("#form"), file = document.querySelector("#file"), box = document.querySelector("#preview"), img = document.querySelector("#previewImg");
  // 页面填写的指标（腰臀比为「0.」+ 两位小数的下划线空格）
  const FIELDS = ["height", "weight", "bodyFatPercentage", "bodyFatMass", "skeletalMuscleMass", "skeletalMuscleIndex", "waistHipRatio"];
  // 已去掉的指标（去脂体重、内脏脂肪等级）：页面不再填写，草稿 / 旧数据里已有的值原样保留
  const REMOVED = ["leanBodyMass", "visceralFatLevel"];

  // 数字按 PPT 做成「下划线空格」：每个空填 1 位数字，__ __.__ 为 2 位整数 + 1 位小数；
  // 身高 ____ 为一个空（最多 3 位）。真实取值写在同名隐藏域里，提交 / 回显仍用原字段名。
  const blankSets = [];
  f.querySelectorAll(".blanks[data-for]").forEach(box => {
    const hidden = f.elements[box.dataset.for];
    const iN = hidden.dataset.int === undefined ? 2 : Number(hidden.dataset.int), dN = Number(hidden.dataset.dec) || 0;
    const mk = (cls, max) => {
      const el = document.createElement("input");
      el.type = "text"; el.inputMode = dN ? "decimal" : "numeric"; el.maxLength = max; el.className = cls; el.autocomplete = "off";
      el.setAttribute("aria-label", box.closest(".field").querySelector("span").textContent);
      return el;
    };
    if (!dN) {
      // 单个空（身高）
      const one = mk("blank blank-wide", iN);
      box.appendChild(one);
      one.addEventListener("input", () => { one.value = one.value.replace(/\D/g, "").slice(0, iN); hidden.value = one.value; });
      blankSets.push({ hidden, render: v => { one.value = String(v || "").replace(/\D/g, "").slice(0, iN); } });
      return;
    }
    const ints = [], decs = [];
    for (let k = 0; k < iN; k++) ints.push(box.appendChild(mk("blank", 8)));
    // 没有整数位（腰臀比）时固定显示「0.」
    const dot = document.createElement("i"); dot.className = "blank-dot"; dot.textContent = iN ? "." : "0."; box.appendChild(dot);
    for (let k = 0; k < dN; k++) decs.push(box.appendChild(mk("blank", 8)));
    const slots = ints.concat(decs);
    const compose = () => {
      const ip = ints.map(x => x.value).join(""), dp = decs.map(x => x.value).join("");
      hidden.value = !ip && !dp ? "" : (ip ? String(Number(ip)) : "0") + (dp ? "." + dp : "");
    };
    slots.forEach((el, k) => {
      el.addEventListener("input", () => {
        // 在整数位输入「.」：跳到小数位（如体重 60.5：输入 6、0、. 、5）
        if (k < iN && el.value.indexOf(".") !== -1) {
          const [pre, post] = el.value.split(".");
          el.value = pre.replace(/\D/g, "").slice(-1);
          // 整数位右对齐（如只填了 7、2：显示为 _ 7 2）
          const ip = ints.map(x => x.value).join("").slice(-iN);
          ints.forEach((x, n) => { x.value = ip.charAt(n - (iN - ip.length)) || ""; });
          const dd = (post || "").replace(/\D/g, "");
          decs.forEach((x, n) => { if (dd.charAt(n)) x.value = dd.charAt(n); });
          compose();
          decs[Math.min(dd.length, dN - 1)].focus();
          return;
        }
        // 一次输入 / 粘贴多位数字时，依次填到后面的空里
        const digits = el.value.replace(/\D/g, "");
        let at = k;
        if (!digits) el.value = "";
        for (let n = 0; n < digits.length && at < slots.length; n++, at++) slots[at].value = digits.charAt(n);
        compose();
        const next = slots[Math.min(at, slots.length - 1)];
        if (digits && next !== el) next.focus();
      });
      el.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !el.value && slots[k - 1]) { e.preventDefault(); slots[k - 1].value = ""; slots[k - 1].focus(); compose(); slots[k - 1].dispatchEvent(new Event("input", { bubbles: true })); }
        if (e.key === "." && k < iN) { e.preventDefault(); decs[0].focus(); }
      });
      el.addEventListener("focus", () => el.select());
    });
    blankSets.push({ hidden, render: v => {
      const m = /^(\d*)(?:\.(\d*))?$/.exec(String(v == null ? "" : v).trim()) || ["", "", ""];
      const ip = (m[1] || "").slice(-iN), dp = (m[2] || "").slice(0, dN);
      ints.forEach((x, k) => { x.value = ip.charAt(k - (iN - ip.length)) || ""; });
      decs.forEach((x, k) => { x.value = dp.charAt(k) || ""; });
    }});
  });
  function renderBlanks(){ blankSets.forEach(b => b.render(b.hidden.value)); }

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
    renderBlanks();
    // 只回显已上传的 URL（旧草稿里的 base64 不再提交）；数组为空时用 imageUrl
    const imgs = (Array.isArray(data.reportImages) ? data.reportImages : []).filter(x => x && !/^data:/.test(x));
    showImage(imgs[0] || (data.imageUrl && !/^data:/.test(data.imageUrl) ? data.imageUrl : ""));
  }});

  // 填写中暂存草稿（入口显示「填写中」）；上传检验图片为附件
  function draft(){
    const d = U.serialize(f), value = {}, old = FmsCase.get("jbxx.bodyComposition") || {};
    FIELDS.forEach(k => { value[k] = d[k] != null ? String(d[k]).trim() : ""; });
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
