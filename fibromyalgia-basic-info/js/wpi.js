/* 普遍疼痛指数（WPI）：过去一周疼痛部位数，每个部位 1 分，score 0~19；无公认单独二分判定，result 留空。
   写入 jbxx.fs.wpi，并同步更新 jbxx.fs 的汇总（score/result/finish，见 fs.js）。 */
(function(){
  const form=document.getElementById("wpiForm");
  const boxes=[...form.querySelectorAll('input[name="painArea"]')];

  function count(){
    const n=boxes.filter(b=>b.checked).length;
    const c=document.getElementById("wpiCount"); if(c) c.textContent=String(n);
  }
  const saved=FmsCase.get("jbxx.fs.wpi");
  if(saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  count();
  form.addEventListener("change", count);
  // 进度：WPI 只有一题（疼痛部位，多选），勾选任一部位即为已答；已保存（finish）时 0 个部位也算已答
  const tracker=FmsProgress.track(form, { optional:["painArea"], extra:()=>{
    const done=boxes.some(b=>b.checked) || !!((FmsCase.get("jbxx.fs.wpi")||{}).finish);
    return { answered: done?1:0, total:1 };
  }});
  // 作答中暂存草稿（不提交）：FS 入口 / 基本信息入口显示「填写中」
  FormUtils.autoStore(form, "jbxx.fs.wpi", ()=>({ score:"", result:"", answers:{ painArea: boxes.filter(b=>b.checked).map(b=>b.value) } }));

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const painArea=boxes.filter(b=>b.checked).map(b=>b.value);
    const wpi={ finish:true, score:String(painArea.length), result:"", answers:{ painArea } };
    const fs=FmsCase.get("jbxx.fs")||{};
    const value=Object.assign({ wpi }, FsScore.summary(wpi, fs.sss));
    FmsCase.save("jbxx.fs", value, { merge:true, back:"fs.html", button:document.getElementById("saveBtn") });
  });
})();
