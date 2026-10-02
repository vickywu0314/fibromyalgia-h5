// WPI 与 SSS 共用：保存子量表的同时重新计算 FS（= WPI + SSS）。
window.FsScale = {
  save(key, value) {
    return FmsCase.save("jbxx", s => {
      const ext = s.jbxx.ext;
      ext[key] = value;
      const wpi = ext.wpi, sss = ext.sss;
      const finish = !!(wpi?.finish && sss?.finish);
      const w = Number(wpi?.score), v = Number(sss?.score);
      // 结果按 ACR 2010/2011 标准：WPI≥7 且 SSS≥5，或 WPI 3～6 且 SSS≥9。
      ext.fs = {
        finish,
        score: finish ? String(w + v) : "",
        result: finish ? ((w >= 7 && v >= 5) || (w >= 3 && w <= 6 && v >= 9) ? "是" : "否") : ""
      };
    });
  }
};
