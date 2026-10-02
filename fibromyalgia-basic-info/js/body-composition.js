(()=>{
  const f=document.querySelector("#form"),file=document.querySelector("#file"),box=document.querySelector("#preview"),img=document.querySelector("#previewImg");
  file.onchange=()=>{const x=file.files[0];if(!x)return;if(x.size>5*1024*1024){alert("文件大小不能超过5M");file.value="";return}img.src=URL.createObjectURL(x);box.hidden=false};
  document.querySelector("#remove").onclick=()=>{file.value="";img.removeAttribute("src");box.hidden=true};
  const saved=FmsCase.ext("bodyComposition");
  FmsCase.fillForm(f,saved);
  f.onsubmit=e=>{
    e.preventDefault();
    FmsCase.run(f.querySelector('button[type="submit"]'),async()=>{
      const d=FmsCase.readForm(f);
      d.waistHipRatio=d.ratio1||d.ratio2?"0."+(d.ratio1||"0")+(d.ratio2||""):"";
      // TODO 图片上传接口待定，暂不提交图片，沿用已保存的 imageUrl。
      d.imageUrl=saved?.imageUrl||"";
      d.finish=Object.entries(d).filter(([k])=>!["imageUrl","finish"].includes(k)).every(([,v])=>v!=="");
      await FmsCase.saveExt("bodyComposition",d);
      FmsCase.back("basic-info.html");
    });
  };
})();
