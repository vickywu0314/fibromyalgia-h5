(function(){
  const form = document.getElementById("csiForm");
  const result = document.getElementById("resultText");
  const scoreMap = {"从不":0,"很少":1,"有时":2,"经常":3,"总是":4};

  function calculate(){
    let score = 0, answered = 0;
    for(let i=1;i<=9;i++){
      const checked = form.querySelector('input[name="q'+i+'"]:checked');
      if(checked){ score += scoreMap[checked.value]; answered++; }
    }
    result.textContent = answered === 9 ? (score > 18 ? "是" : "否") : "--";
  }

  form.addEventListener("change", calculate);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if(window.webkit?.messageHandlers?.saveForm){
      window.webkit.messageHandlers.saveForm.postMessage({type:"csi9",data:data});
    }else if(window.Android && typeof window.Android.saveForm==="function"){
      window.Android.saveForm(JSON.stringify({type:"csi9",data:data}));
    }else{
      console.log("[CSI-9] save",data);
    }
  });
})();