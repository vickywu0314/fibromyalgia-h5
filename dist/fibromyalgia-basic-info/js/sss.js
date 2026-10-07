/* 症状严重性量表（SSS）：第 1 部分 3 项各 0~3 分，第 2 部分 3 项各 0/1 分，score 0~12；
   无公认单独二分判定，result 留空。写入 jbxx.fs.sss，并同步更新 jbxx.fs 汇总（见 fs.js）。 */
(function(){
  const form=document.getElementById("sssForm");
  const names=[...new Set([...form.querySelectorAll('input[type="radio"]')].map(r=>r.name))];

  const saved=FmsCase.get("jbxx.fs.sss");
  if(saved && saved.answers) FmsCase.fillForm(form, saved.answers);
  // 进度：已答题数 / 6；作答中暂存草稿（FS 入口显示「填写中」）
  FmsProgress.track(form);
  FormUtils.autoStore(form, "jbxx.fs.sss", ()=>{
    const answers={}; names.forEach(n=>{ const c=form.querySelector('input[name="'+n+'"]:checked'); answers[n]=c?c.value:""; });
    return { score:"", result:"", answers };
  });

  form.addEventListener("submit",e=>{
    e.preventDefault();
    const missing=names.find(n=>!form.querySelector('input[name="'+n+'"]:checked'));
    if(missing){
      const legend=form.querySelector('input[name="'+missing+'"]').closest("fieldset").querySelector("legend");
      FmsCase.toast("请完成："+(legend?legend.textContent:"全部题目"));
      return;
    }
    const answers={}; let score=0;
    names.forEach(n=>{ const v=form.querySelector('input[name="'+n+'"]:checked').value; answers[n]=v; score+=parseInt(v,10)||0; });
    const sss={ finish:true, score:String(score), result:"", answers };
    const fs=FmsCase.get("jbxx.fs")||{};
    const value=Object.assign({ sss }, FsScore.summary(fs.wpi, sss));
    FmsCase.save("jbxx.fs", value, { merge:true, back:"fs.html", button:document.getElementById("saveBtn") });
  });
})();
