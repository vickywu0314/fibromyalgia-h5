/* 普遍疼痛指数（WPI）：过去一周疼痛部位数，每个部位 1 分，score 0~19；无公认单独二分判定，result 留空。
   写入 jbxx.fs.wpi，并同步更新 jbxx.fs 的汇总（score/result/finish，见 fs.js）。 */
(function(){
  const form=document.getElementById("wpiForm");
  const boxes=[...form.querySelectorAll('input[name="painArea"]')];

  function progress(){ FsScore.setProgress(Math.round(boxes.filter(b=>b.checked).length/boxes.length*100)); }
  const saved=FmsCase.get("jbxx.fs.wpi");
  if(saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  progress();
  form.addEventListener("change", progress);

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const painArea=boxes.filter(b=>b.checked).map(b=>b.value);
    const wpi={ finish:true, score:String(painArea.length), result:"", answers:{ painArea } };
    const fs=FmsCase.get("jbxx.fs")||{};
    const value=Object.assign({ wpi }, FsScore.summary(wpi, fs.sss));
    FmsCase.save("jbxx.fs", value, { merge:true, back:"fs.html", button:document.getElementById("saveBtn") });
  });
})();
