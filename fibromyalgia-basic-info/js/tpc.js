(function(){
  const form = document.getElementById("tpcForm");

  // “左”和“右”可同时选择；选择“无”时取消左右，选择左右时取消“无”。
  form.querySelectorAll(".question").forEach(question => {
    question.addEventListener("change", e => {
      if(e.target.type !== "checkbox") return;
      const boxes = [...question.querySelectorAll('input[type="checkbox"]')];
      const none = boxes.find(x => x.dataset.none !== undefined);

      if(e.target === none && none.checked){
        boxes.forEach(x => { if(x !== none) x.checked = false; });
      }else if(e.target !== none && e.target.checked && none){
        none.checked = false;
      }
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = {};
    for(let i=1;i<=9;i++){
      data["q"+i] = [...form.querySelectorAll('input[name="q'+i+'"]:checked')].map(x => x.value);
    }

    const payload = {type:"tpc",data};
    if(window.webkit?.messageHandlers?.saveForm){
      window.webkit.messageHandlers.saveForm.postMessage(payload);
    }else if(window.Android && typeof window.Android.saveForm === "function"){
      window.Android.saveForm(JSON.stringify(payload));
    }else{
      console.log("[TPC] save", payload);
    }
  });
})();