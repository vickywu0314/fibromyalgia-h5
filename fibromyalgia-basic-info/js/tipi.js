(function(){
 const form=document.getElementById("tipiForm");
 FmsCase.fillForm(form,FmsCase.ext("tipi")?.answers);
 form.addEventListener("submit",e=>{
   e.preventDefault();
   FmsCase.run(form.querySelector('button[type="submit"]'),async()=>{
     const answers=FmsCase.readForm(form);
     const finish=Object.values(answers).every(Boolean);
     await FmsCase.saveExt("tipi",{finish,score:"",result:"",answers});
     FmsCase.back("basic-info.html");
   });
 });
})();
