/* 纤维肌痛症状量表（FS）= 普遍疼痛指数（WPI）+ 症状严重性量表（SSS）
   数据写入病例草稿 jbxx.fs：{ finish, score, result, wpi:{...}, sss:{...} }
   本文件也被 wpi.html / sss.html 引用以复用 FsScore.summary（汇总计算）。 */
(function(){
  /**
   * 汇总 FS：score = WPI(0~19) + SSS(0~12)，即 0~31；
   * result 按 2016 年 ACR 修订标准：WPI≥7 且 SSS≥5，或 WPI 4~6 且 SSS≥9 → “是”，否则“否”。
   * （2016 标准另要求症状持续≥3 个月、5 个区域中至少 4 个区域疼痛，此处仅按 WPI/SSS 判定。）
   * WPI 与 SSS 都完成时 finish=true，score/result 才有值。
   */
  function summary(wpi, sss){
    const done = !!(wpi && wpi.finish && sss && sss.finish);
    if(!done) return { finish:false, score:"", result:"" };
    const w = Number(wpi.score), s = Number(sss.score);
    const positive = (w >= 7 && s >= 5) || (w >= 4 && w <= 6 && s >= 9);
    return { finish:true, score:String(w + s), result: positive ? "是" : "否" };
  }
  window.FsScore = { summary };

  function setProgress(pct){
    const bar=document.getElementById("progressBar"), txt=document.getElementById("progressText");
    if(bar) bar.style.width=pct+"%";
    if(txt) txt.textContent="已完成"+pct+"%";
  }
  window.FsScore.setProgress = setProgress;

  if(!document.getElementById("fsSummary")) return; // 以下仅 fs.html 页面

  function render(){
    const fs = FmsCase.get("jbxx.fs") || {};
    let doneCount = 0;
    ["wpi","sss"].forEach(k=>{
      const el = document.querySelector('[data-status="'+k+'"]'), m = fs[k];
      const done = !!(m && m.finish);
      if(done) doneCount++;
      el.className = "status " + (done ? "done" : "pending");
      el.textContent = done ? "已完成（" + m.score + "分）" : "未填写";
    });
    setProgress(Math.round(doneCount / 2 * 100));
    const sum = summary(fs.wpi, fs.sss), box = document.getElementById("fsSummary");
    box.hidden = !sum.finish;
    if(sum.finish) box.textContent = "FS 总分（WPI+SSS）：" + sum.score + " 分；符合 2016 纤维肌痛诊断标准（WPI/SSS）：" + sum.result;
  }
  render();
  window.addEventListener("pageshow", e => { if(e.persisted) render(); });

  // 保存：合并写入 jbxx.fs（不覆盖 wpi/sss），回基本信息页
  document.getElementById("backBtn").addEventListener("click", function(){
    const fs = FmsCase.get("jbxx.fs") || {};
    FmsCase.save("jbxx.fs", summary(fs.wpi, fs.sss), {
      merge:true, button:this, back:"basic-info.html"
    });
  });
})();
