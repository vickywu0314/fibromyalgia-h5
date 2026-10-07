(function(){
 var form=document.querySelector('[data-assessment="pain-detect"]'),field=form.elements.painRegions;
 function sync(){field.value=Array.from(form.querySelectorAll('.body-zone[aria-pressed="true"]')).map(function(node){return node.dataset.region;}).join(',');field.dispatchEvent(new Event('change',{bubbles:true}));}
 form.querySelectorAll('.body-zone').forEach(function(zone){
  function toggle(){zone.setAttribute('aria-pressed',zone.getAttribute('aria-pressed')==='true'?'false':'true');sync();}
  zone.addEventListener('click',toggle);zone.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
 });
 var selected=field.value.split(',');form.querySelectorAll('.body-zone').forEach(function(zone){if(selected.includes(zone.dataset.region))zone.setAttribute('aria-pressed','true');});
})();
