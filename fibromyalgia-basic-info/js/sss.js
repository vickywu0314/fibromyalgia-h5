(function(){
  const form=document.querySelector("form");
  FmsCase.fillForm(form,FmsCase.ext("sss")?.answers);
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const answers=FmsCase.readForm(form);
    const values=Object.values(answers);
    // 选项以分值开头，如“2（中度）”；第 1 部分 0～9 分，第 2 部分 0～3 分。
    const finish=values.every(Boolean);
    const score=values.reduce((sum,v)=>sum+(parseInt(v,10)||0),0);
    FmsCase.run(form.querySelector('button[type="submit"]'),async()=>{
      await FsScale.save("sss",{finish,score:finish?String(score):"",result:"",answers});
      FmsCase.back("fs.html");
    });
  });
})();
