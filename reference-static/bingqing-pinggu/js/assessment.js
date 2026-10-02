(function(){
 var back=document.getElementById('back');if(back){back.addEventListener('click',function(){if(history.length>1)history.back();else location.href='index.html';});return;}
 var form=document.querySelector('[data-assessment]'),key='bingqing_'+form.dataset.assessment;
 try{var saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){Array.from(form.elements).forEach(function(input){if(!input.name)return;var value=saved[input.name];if(input.type==='radio'||input.type==='checkbox')input.checked=Array.isArray(value)?value.includes(input.value):value===input.value;else if(value!==undefined)input.value=value;});}}catch(e){}
 function updateRanges(){form.querySelectorAll('input[type=range]').forEach(function(input){var out=input.nextElementSibling.querySelector('output');out.value=input.value;});}
 form.addEventListener('input',updateRanges);updateRanges();
 form.addEventListener('submit',function(event){event.preventDefault();var values={};Array.from(form.elements).forEach(function(input){if(!input.name)return;if(input.type==='checkbox'){if(!values[input.name])values[input.name]=[];if(input.checked)values[input.name].push(input.value);}else if(input.type==='radio'){if(input.checked)values[input.name]=input.value;}else values[input.name]=input.value;});try{localStorage.setItem(key,JSON.stringify(values));location.href='index.html';}catch(e){form.querySelector('.error').textContent='保存失败，请检查浏览器存储设置';}});
})();
