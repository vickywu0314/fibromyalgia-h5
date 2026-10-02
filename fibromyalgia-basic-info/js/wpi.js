(function(){
  const form=document.querySelector("form");
  FmsCase.fillForm(form,FmsCase.ext("wpi")?.answers);
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const answers=FmsCase.readForm(form);
    // 分数为疼痛部位个数（0～19），可以一个都不选。
    FmsCase.run(form.querySelector('button[type="submit"]'),async()=>{
      await FsScale.save("wpi",{finish:true,score:String(answers.painArea.length),result:"",answers});
      FmsCase.back("fs.html");
    });
  });
})();
