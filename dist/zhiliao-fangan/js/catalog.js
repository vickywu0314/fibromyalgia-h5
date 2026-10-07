(() => {
 const day12 = ['日1次', '日2次'];
 const day123 = ['日1次', '日2次', '日3次'];
 const night = ['晚1次'];

 // 西药：分类 → 药品 → { doses 剂量选项, frequencies 频次选项, unit 单位 }。
 // 非甾体抗炎类药物在规范中只有药名，无剂量/频次子项。
 window.WESTERN_CATALOG = {
  '改善纤维肌痛综合征病情药物': {
   '普瑞巴林胶囊': { doses: ['75', '150', '225'], frequencies: day12 },
   '苯磺酸美洛加巴林片': { doses: ['5', '10', '15'], frequencies: day12 },
   '苯磺酸克利加巴林胶囊': { doses: ['20', '40'], frequencies: ['日2次'] },
   '加巴喷丁胶囊': { doses: ['300'], frequencies: day123 },
   '盐酸度洛西汀肠溶胶囊': { doses: ['20', '30', '40', '60'], frequencies: day12 }
  },
  '改善焦虑、抑郁药物': {
   '氟哌噻吨美利曲片': { doses: ['1', '2'], frequencies: day12, unit: '片' },
   '盐酸阿米替林片': { doses: ['25', '50', '75', '100'], frequencies: day123 },
   '盐酸舍曲林片': { doses: ['50', '100', '150', '200'], frequencies: ['日1次'] },
   '草酸艾司西酞普兰片': { doses: ['5', '10', '15', '20'], frequencies: ['日1次'] },
   '文拉法辛': { doses: ['25', '37.5', '75'], frequencies: day123 }
  },
  '助眠药': {
   '右佐匹克隆': { doses: ['3'], frequencies: night },
   '酒石酸唑吡坦片': { doses: ['10'], frequencies: night },
   '艾司唑仑片': { doses: ['1'], frequencies: night },
   '劳拉西泮片': { doses: ['1'], frequencies: night },
   '盐酸曲唑酮片': { doses: ['50'], frequencies: ['日1次'] }
  },
  '非甾体抗炎类药物': {
   '布洛芬': {}, '双氯芬酸': {}, '吲哚美辛': {}, '洛索洛芬': {}, '美洛昔康': {},
   '萘普生': {}, '塞来昔布': {}, '依托考昔': {}, '对乙酰氨基酚': {}
  },
  '肌松药': {
   '环苯扎林': { doses: ['15', '30'], frequencies: ['日1次'] },
   '氯唑沙宗': { doses: ['200'], frequencies: ['日3次'] }
  },
  '其他': {}
 };

 // 西药“其他”：药品名称 + 用量(mg) + 以下频次
 window.WESTERN_OTHER_FREQUENCIES = ['日1次', '日2次', '日3次', '日4次', '晚1次', '每4小时1次', '每6小时1次', '每12小时1次', '隔日1次', '必要时'];

 // 中成药：规范要求的 15 个中成药必须内置；如宿主注入 RA 数据库目录
 // (window.RA_PATENT_CATALOG，结构相同)，其余药物追加在后，内置项以规范为准。
 const patent = {
  '乌灵胶囊': { doses: ['1', '2', '3'], unit: '粒', frequencies: day123 },
  '通络开痹片': { doses: ['1', '2', '3'], unit: '片', frequencies: ['日1次'] },
  '盘龙七片': { doses: ['1', '2', '3', '4'], unit: '片', frequencies: day123 },
  '祖师麻片': { doses: ['1', '2', '3'], unit: '片', frequencies: day123 },
  '元胡止痛滴丸': { doses: ['10', '20', '30'], unit: '丸', frequencies: day123 },
  '新癀片': { doses: ['1', '2', '3', '4'], unit: '片', frequencies: day123 },
  '金匮肾气丸': { doses: ['20', '25'], unit: '粒', frequencies: day12 },
  '大活络丸': { doses: ['1'], unit: '丸', frequencies: day12 },
  '风湿去痛胶囊': { doses: ['5'], unit: '粒', frequencies: day123 },
  '舒眠胶囊': { doses: ['3'], unit: '粒', frequencies: day12 },
  '疏肝解郁胶囊': { doses: ['2'], unit: '粒', frequencies: day12 },
  '瘀血痹胶囊': { doses: ['6'], unit: '粒', frequencies: day123 },
  '骨康胶囊': { doses: ['3', '4'], unit: '粒', frequencies: day123 },
  '痹祺胶囊': { doses: ['4'], unit: '粒', frequencies: day123 },
  '逍遥丸': { doses: ['1', '1.5'], unit: '袋', frequencies: day12 }
 };
 const extra = window.RA_PATENT_CATALOG && typeof window.RA_PATENT_CATALOG === 'object' ? window.RA_PATENT_CATALOG : {};
 window.PATENT_CATALOG = Object.assign({}, patent);
 Object.keys(extra).forEach(name => { if (!patent[name]) window.PATENT_CATALOG[name] = extra[name]; });
})();
