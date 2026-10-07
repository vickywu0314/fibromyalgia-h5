(function(){
  const form = document.getElementById("csiForm");
  const result = document.getElementById("resultText");
  const scoreText = document.getElementById("scoreText");
  const totalScore = document.getElementById("totalScore");
  const over18 = document.getElementById("over18");

  // 选项值即分值：0=从不 1=很少 2=有时 3=经常 4=总是；总分≥18 判定为“是”
  function calculate(){
    let score = 0, answered = 0;
    for(let i=1;i<=9;i++){
      const checked = form.querySelector('input[name="q'+i+'"]:checked');
      if(checked){ score += Number(checked.value); answered++; }
    }
    const complete = answered === 9;
    scoreText.textContent = complete ? String(score) : "--";
    result.textContent = complete ? (score >= 18 ? "是" : "否") : "--";
    totalScore.value = complete ? String(score) : "";
    over18.value = complete ? result.textContent : "";
  }

  form.addEventListener("change", calculate);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    calculate();
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
