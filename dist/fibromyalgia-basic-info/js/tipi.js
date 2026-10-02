(function(){
 const form=document.getElementById("tipiForm");
 form.addEventListener("submit",e=>{
   e.preventDefault();
   const data=Object.fromEntries(new FormData(form).entries());
   const payload={type:"tipi-c",data};
   if(window.webkit?.messageHandlers?.saveForm){
     window.webkit.messageHandlers.saveForm.postMessage(payload);
   }else if(window.Android&&typeof window.Android.saveForm==="function"){
     window.Android.saveForm(JSON.stringify(payload));
   }else{
     console.log("[TIPI-C] save",payload);
   }
 });
})();