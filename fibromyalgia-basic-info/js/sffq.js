(()=>{
  const f=document.querySelector("#sffqForm");
  FmsCase.fillForm(f,FmsCase.ext("sffq")?.answers);
  f.onsubmit=e=>{
    e.preventDefault();
    FmsCase.run(f.querySelector('button[type="submit"]'),async()=>{
      const answers=FmsCase.readForm(f);
      // 每种食物的食用频率都选了才算完成。
      const finish=Object.entries(answers).filter(([k])=>k.endsWith("_freq")).every(([,v])=>v);
      await FmsCase.saveExt("sffq",{finish,score:"",result:"",answers});
      FmsCase.back("basic-info.html");
    });
  };
})();
