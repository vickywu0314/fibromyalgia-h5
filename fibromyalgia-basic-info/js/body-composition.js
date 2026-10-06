(function(){
  const U = window.FormUtils;
  const f = document.querySelector("#form"), file = document.querySelector("#file"), box = document.querySelector("#preview"), img = document.querySelector("#previewImg");
  const STORAGE_KEY = "fibromyalgia:bodyComposition";
  let imageData = "";
  function showImage(src){
    imageData = src || "";
    if (src) { img.src = src; box.hidden = false; } else { img.removeAttribute("src"); box.hidden = true; }
  }
  file.onchange = () => {
    const x = file.files[0];
    if (!x) return;
    if (x.size > 5 * 1024 * 1024) { alert("文件大小不能超过5M"); file.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => showImage(reader.result);
    reader.readAsDataURL(x);
  };
  document.querySelector("#remove").onclick = () => { file.value = ""; showImage(""); };
  U.bind({form: f, key: STORAGE_KEY, update: data => showImage(data.reportImage || "")});
  f.onsubmit = e => {
    e.preventDefault();
    const d = U.serialize(f);
    if (imageData) d.reportImage = imageData;
    U.save("body-composition", d, null);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({}, d, {reportImage: undefined}))); } catch (err) {}
  };
})();
