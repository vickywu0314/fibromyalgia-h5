(function(){
  const U = window.FormUtils;
  const form = document.getElementById("csiForm");
  const scoreText = document.getElementById("scoreText");
  const result = document.getElementById("resultText");
  const scoreInput = document.getElementById("scoreInput");
  const over18Input = document.getElementById("over18Input");
  const STORAGE_KEY = "fibromyalgia:csi9";

  // 每题 0=从不 1=很少 2=有时 3=经常 4=总是；总分 ≥18 分判定为“是”
  function calculate(){
    let score = 0, answered = 0;
    for (let i = 1; i <= 9; i++) {
      const checked = form.querySelector('input[name="q' + i + '"]:checked');
      if (checked) { score += Number(checked.value); answered++; }
    }
    const done = answered === 9;
    scoreText.textContent = answered ? String(score) : "--";
    result.textContent = done ? (score >= 18 ? "是" : "否") : "--";
    scoreInput.value = done ? String(score) : "";
    over18Input.value = done ? (score >= 18 ? "是" : "否") : "";
  }

  form.addEventListener("change", calculate);
  U.bind({form: form, key: STORAGE_KEY, update: calculate});
  form.addEventListener("submit", function(e){
    e.preventDefault();
    calculate();
    U.save("csi9", U.serialize(form), STORAGE_KEY);
  });
})();
