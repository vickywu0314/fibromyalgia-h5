// 生成 Swagger 风格的接口文档页 docs/api/index.html。
// 模块字段（题目、类型、取值）来自 js/case-record-schema.js（由 scripts/extract-case-schema.mjs 从页面提取），
// 接口、列表类数据结构在本文件中定义。运行：node scripts/build-api-doc.mjs
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(await readFile('js/case-record-schema.js', 'utf8'), sandbox);
const SCHEMA = sandbox.window.CASE_RECORD_SCHEMA;

// ---------- 字段转换 ----------
const typeOf = f => f.type === 'multi' ? 'string[]' : (f.type === 'number' || f.numeric) ? 'number' : 'string';
const valuesOf = f => {
  if (f.type === 'date') return 'yyyy-MM-dd';
  if (f.values && f.values.length) {
    // 选项值就是文字时用 / 连成一行；「代码 = 文字」时每项一行。
    const coded = f.values.some(v => f.options && f.options[v] && f.options[v] !== v);
    return coded ? f.values.map(v => (f.options[v] && f.options[v] !== v) ? `${v} = ${f.options[v]}` : v).join('\n') : f.values.join(' / ');
  }
  if (f.type === 'number') return '0–10';
  return f.unit ? `数值（${f.unit}）` : '';
};
const fromSchema = (fields, extra = []) => [
  ...fields.map(f => ({
    key: f.key, type: typeOf(f),
    desc: (f.group && f.group !== f.label ? f.group + ' · ' : '') + f.label + (f.unit && f.type !== 'single' ? `（${f.unit}）` : ''),
    values: valuesOf(f)
  })),
  ...extra
];
const FINISH = { key: 'finish', type: 'boolean', desc: '保存时为 true，表示该部分已保存', values: 'true' };
const ref = (name, isArray) => ({ ref: name, array: !!isArray });

// ---------- 数据模型 ----------
const subs = SCHEMA.jbxx.subs;
const models = {
  'Result': { title: '通用返回结构', fields: [
    { key: 'success', type: 'boolean', desc: 'true 表示成功；其他情况页面按失败处理', values: 'true / false' },
    { key: 'message', type: 'string', desc: '失败原因，页面直接提示' },
    { key: 'data', type: 'object / array', desc: '业务数据，见各接口' }
  ] },
  'PatientItem': { title: '患者列表项', fields: [
    { key: 'id', type: 'long', desc: '患者 ID，进入随访记录时带上' },
    { key: 'name', type: 'string', desc: '患者姓名；为空时显示「未命名患者」' },
    { key: 'lastFollowUpDate', type: 'string / null', desc: '上次随访（新增记录）日期；没有随访时为 null，显示「暂无新增记录」', values: 'yyyy-MM-dd' },
    { key: 'followUpCount', type: 'number', desc: '累计随访次数，显示「已添加 N 条」' }
  ] },
  'FollowUpItem': { title: '随诊列表项', fields: [
    { key: 'id', type: 'long', desc: '随诊 ID（即 caseId），进入录入开始页及各模块时使用' },
    { key: 'followUpDate', type: 'string', desc: '随访日期，列表按此倒序', values: 'yyyy-MM-dd' }
  ] },
  'CaseDetailData': { title: '随诊详情 data（按模块代码分组，只返回请求的模块）', fields: [
    { key: 'jbxx', ...ref('jbxx'), desc: '基本信息（含「患者评估与病史」10 个子模块）' },
    { key: 'bsbq', ...ref('bsbq'), desc: '病史病情' },
    { key: 'zhpd', ...ref('zhpd'), desc: '证候判断' },
    { key: 'fzjc', ...ref('fzjc'), desc: '辅助检查' },
    { key: 'bqpg', ...ref('bqpg'), desc: '病情评估（按量表分组）' },
    { key: 'zlfa', ...ref('zlfa'), desc: '本次治疗方案（按类别分组）' },
    { key: 'blsj', ...ref('blsj'), desc: '不良反应' }
  ] },
  'jbxx': { title: '基本信息 jbxx', page: 'fibromyalgia-basic-info/basic-info.html', fields: fromSchema(SCHEMA.jbxx.fields, [
    { key: 'signature', type: 'string', desc: '患者知情同意签字图片 URL（App 原生签字组件提供）' },
    FINISH,
    { key: 'treatmentHistory', ...ref('jbxx.treatmentHistory'), desc: '本病治疗史' },
    { key: 'diseaseHistory', ...ref('DiseaseHistoryItem', true), desc: '既往疾病史' },
    { key: 'concomitantMedication', ...ref('ConcomitantMedicationItem', true), desc: '合并药物' },
    { key: 'csi', ...ref('jbxx.csi'), desc: '中枢敏化程度（CSI-9）' },
    { key: 'work', ...ref('jbxx.work'), desc: '间接成本评估' },
    { key: 'bodyComposition', ...ref('jbxx.bodyComposition'), desc: '人体成分分析' },
    { key: 'tipi', ...ref('jbxx.tipi'), desc: '人格评估（TIPI-C）' },
    { key: 'sffq', ...ref('jbxx.sffq'), desc: '膳食摄入评估（SFFQ）' },
    { key: 'tpc', ...ref('jbxx.tpc'), desc: '压痛点（TPC）' },
    { key: 'fs', ...ref('jbxx.fs'), desc: '纤维肌痛症状量表（FS）' }
  ]) },
  'jbxx.treatmentHistory': { title: '本病治疗史 jbxx.treatmentHistory', page: 'benbing-zhiliaoshi/', fields: [
    { key: 'xiyao', ...ref('TreatmentHistoryItem', true), desc: '西药（名称字段为 medication）' },
    { key: 'zhongyaoTangji', ...ref('TreatmentHistoryItem', true), desc: '中药汤剂' },
    { key: 'feiYaowuLiaofa', ...ref('TreatmentHistoryItem', true), desc: '非药物疗法' },
    { key: 'zhongchengyao', ...ref('TreatmentHistoryItem', true), desc: '中成药' },
    FINISH
  ] },
  'TreatmentHistoryItem': { title: '本病治疗史条目', fields: [
    { key: 'medication', type: 'string', desc: '西药名称（仅 xiyao）' },
    { key: 'name', type: 'string', desc: '名称（中药汤剂按录入顺序为「汤剂1」「汤剂2」…）' },
    { key: 'frequency', type: 'string', desc: '频次（xiyao、zhongchengyao、feiYaowuLiaofa）', values: '药物：日1次 / 日2次 / 日3次 / 按需服用\n非药物：每天一次 / 每周一次 / 每周二次 / 每周三次 / 按需进行' },
    { key: 'dose', type: 'string', desc: '单次用量（xiyao、zhongchengyao）' },
    { key: 'unit', type: 'string', desc: '用量单位', values: '片/粒' },
    { key: 'duration', type: 'string', desc: '单次时长，分钟（feiYaowuLiaofa）', values: '15 / 30 / 45 / 60 / 90 / 120' },
    { key: 'startDate', type: 'string', desc: '开始日期', values: 'yyyy-MM-dd' },
    { key: 'ongoing', type: 'string', desc: '是否沿用至今（xiyao、zhongyaoTangji、feiYaowuLiaofa）', values: '是 / 否' },
    { key: 'endDate', type: 'string', desc: '结束日期（ongoing 为「否」时）', values: 'yyyy-MM-dd' },
    { key: 'reason', type: 'string', desc: '停用原因（ongoing 为「否」时）', values: '疗效不佳或无效 / 症状缓解 / 不良反应 / 病情好转 / 患者自行停用 / 经济原因 / 治疗方案调整 / 疗程结束 / 其他' }
  ] },
  'DiseaseHistoryItem': { title: '既往疾病史条目', page: 'jiwang-bingshi/', fields: [
    { key: 'category', type: 'string', desc: '疾病类别代码', values: 'fengshi 风湿性疾病\nhuxi 呼吸系统疾病\nxiaohua 消化系统疾病\nxunhuan 循环系统疾病\nneifenmi 内分泌和代谢性疾病\nshen 肾病系统\nguke 骨科系统\nshengzhi 生殖系统\nxinli 精神心理疾病\ntengtong 慢性重叠疼痛综合征' },
    { key: 'categoryLabel', type: 'string', desc: '疾病类别名称' },
    { key: 'name', type: 'string', desc: '疾病名称（选「其他」时为填写的名称）' },
    { key: 'years', type: 'number / null', desc: '病程（年）' }
  ] },
  'ConcomitantMedicationItem': { title: '合并药物条目', page: 'hebing-yaowu/', fields: [
    { key: 'name', type: 'string', desc: '药物名称' }
  ] },
  'jbxx.csi': { title: '中枢敏化程度 jbxx.csi', page: 'fibromyalgia-basic-info/csi.html', fields: fromSchema(subs.csi.fields, [
    { key: 'score', type: 'number', desc: '总分（9 题全答时页面计算：从不 0 / 很少 1 / 有时 2 / 经常 3 / 总是 4）' },
    { key: 'result', type: 'string', desc: '是否中枢敏化（总分 > 18 为「是」）', values: '是 / 否' },
    FINISH
  ]) },
  'jbxx.work': { title: '间接成本评估 jbxx.work', page: 'fibromyalgia-basic-info/work.html', note: 'q1 为「否」时 q2–q5 不提交；q4 为 0 时 q5 不提交。', fields: fromSchema(subs.work.fields, [FINISH]) },
  'jbxx.bodyComposition': { title: '人体成分分析 jbxx.bodyComposition', page: 'fibromyalgia-basic-info/body-composition.html', note: '腰臀比按小数点后两位分别输入：ratio1 第 1 位、ratio2 第 2 位，显示为 0.{ratio1}{ratio2}。', fields: fromSchema(subs.bodyComposition.fields, [
    { key: 'reportImages', type: 'string[]', desc: '检验报告图片 URL' }, FINISH
  ]) },
  'jbxx.tipi': { title: '人格评估 jbxx.tipi', page: 'fibromyalgia-basic-info/tipi.html', fields: fromSchema(subs.tipi.fields, [FINISH]) },
  'jbxx.sffq': { title: '膳食摄入评估 jbxx.sffq', page: 'fibromyalgia-basic-info/sffq.html', note: 'sX_Y_freq 食用频率、sX_Y_amt 每次食用量、sX_Y_extra 选「以上」时的具体数量。', fields: fromSchema(subs.sffq.fields, [FINISH]) },
  'jbxx.tpc': { title: '压痛点 jbxx.tpc', page: 'fibromyalgia-basic-info/tpc.html', fields: fromSchema(subs.tpc.fields, [FINISH]) },
  'jbxx.fs': { title: '纤维肌痛症状量表 jbxx.fs', page: 'fibromyalgia-basic-info/fs.html', fields: [
    { key: 'wpi', ...ref('jbxx.fs.wpi'), desc: '普遍疼痛指数（WPI）' },
    { key: 'sss', ...ref('jbxx.fs.sss'), desc: '症状严重性量表（SSS）' }
  ] },
  'jbxx.fs.wpi': { title: '普遍疼痛指数 jbxx.fs.wpi', page: 'fibromyalgia-basic-info/wpi.html', fields: fromSchema(subs['fs.wpi'].fields, [FINISH]) },
  'jbxx.fs.sss': { title: '症状严重性量表 jbxx.fs.sss', page: 'fibromyalgia-basic-info/sss.html', fields: fromSchema(subs['fs.sss'].fields, [FINISH]) },
  'bsbq': { title: '病史病情 bsbq', page: 'fibromyalgia-condition-history/condition-history.html', fields: fromSchema(SCHEMA.bsbq.fields, [FINISH]) },
  'zhpd': { title: '证候判断 zhpd', page: 'fibromyalgia-syndrome-differentiation/syndrome-differentiation.html', fields: fromSchema(SCHEMA.zhpd.fields, [FINISH]) },
  'fzjc': { title: '辅助检查 fzjc', page: 'fibromyalgia-auxiliary-exam/auxiliary-exam.html', note: 'xxx_status 与 xxx_value 成对：检查状态和检测数值。', fields: fromSchema(SCHEMA.fzjc.fields, [
    { key: 'labReportImages', type: 'string[]', desc: '检验报告图片 URL' },
    { key: 'ecgReportImages', type: 'string[]', desc: '心电图报告图片 URL' },
    FINISH
  ]) },
  'bqpg': { title: '病情评估 bqpg', page: 'bingqing-pinggu/', note: '按量表分组。不同量表有同名字段（如 vas 与 painDetect 都有 pain3），不能平铺。单选题为分值代码，取值列为「代码 = 选项文字」。', fields: Object.entries(SCHEMA.bqpg.scales).map(([key, scale]) => ({ key, ...ref('bqpg.' + key), desc: scale.title })) },
  ...Object.fromEntries(Object.entries(SCHEMA.bqpg.scales).map(([key, scale]) => [
    'bqpg.' + key,
    { title: `${scale.title} bqpg.${key}`, page: `bingqing-pinggu/${key === 'painDetect' ? 'pain-detect' : key}.html`,
      note: key === 'painDetect' ? 'painRegions 为疼痛部位数组，如 ["正面-1", "背面-40"]。' : (key === 'psqi' ? 'bedtime、waketime 为 HH:mm。' : ''),
      fields: fromSchema(scale.fields, [FINISH]).map(f => (key === 'painDetect' && f.key === 'painRegions') ? { ...f, type: 'string[]', values: '正面-1 … 正面-34\n背面-35 … 背面-69' } : (key === 'psqi' && (f.key === 'bedtime' || f.key === 'waketime')) ? { ...f, values: 'HH:mm' } : f) }
  ])),
  'zlfa': { title: '本次治疗方案 zlfa', page: 'zhiliao-fangan/', fields: [
    { key: 'xiyao', ...ref('ZlfaDrugItem', true), desc: '西药' },
    { key: 'zhongchengyao', ...ref('ZlfaDrugItem', true), desc: '中成药' },
    { key: 'zhongyaoYinpian', ...ref('ZlfaYinpianItem', true), desc: '中药饮片' },
    { key: 'feiYaowu', ...ref('ZlfaDrugItem', true), desc: '非药物疗法' }
  ] },
  'ZlfaDrugItem': { title: '治疗方案条目（西药 / 中成药 / 非药物疗法）', fields: [
    { key: 'name', type: 'string', desc: '药品 / 疗法名称' },
    { key: 'category', type: 'string', desc: '药物分类（西药）', values: '改善纤维肌痛综合征病情药物 / 改善焦虑、抑郁药物 / 助眠药 / 非甾体抗炎类药物 / 肌松药 / 其他' },
    { key: 'dose', type: 'string', desc: '剂量（西药、中成药）' },
    { key: 'unit', type: 'string', desc: '剂量单位', values: 'mg / 片 / 粒' },
    { key: 'frequency', type: 'string', desc: '频次', values: '日1次 / 日2次 / 日3次 / 晚1次 / 按需使用（非药物疗法为页面频次文字）' },
    { key: 'duration', type: 'string', desc: '单次时长，分钟（非药物疗法）' },
    { key: 'instructions', type: 'string', desc: '用法说明' },
    { key: 'adjust', type: 'string', desc: '是否调整', values: '是 / 否' },
    { key: 'adjustment', type: 'string', desc: '调整内容（adjust 为「是」时）', values: '加量 / 减量 / 停药 / 换药' },
    { key: 'reason', type: 'string', desc: '调整原因（adjust 为「是」时）', values: '疗效不佳或无效 / 症状缓解 / 不良反应 / 患者自行停用 / 经济原因 / 治疗方案调整 / 疗程结束 / 其他' }
  ] },
  'ZlfaYinpianItem': { title: '治疗方案条目（中药饮片）', fields: [
    { key: 'name', type: 'string', desc: '名称（同处方类型，未选时为「口服中药汤剂」）' },
    { key: 'syndrome', type: 'string', desc: '中医证型', values: '肝郁气滞证 / 寒湿痹阻证 / 瘀热扰心证 / 肝肾不足证' },
    { key: 'recipe', type: 'string', desc: '处方类型', values: '逍遥散 / 柴胡桂枝汤 / 血府逐瘀汤 / 蠲痹汤 / 温胆汤' },
    { key: 'prescription', type: 'string', desc: '处方组成，药物用逗号分隔' },
    { key: 'image', type: 'string', desc: '处方图片 URL' }
  ] },
  'blsj': { title: '不良反应 blsj', page: 'fibromyalgia-adverse-reaction/adverse-reaction.html', note: 'hasAdverseEvent 为「无」时只有该字段。', fields: fromSchema(SCHEMA.blsj.fields, [FINISH]) },
  'CaseAddResult': { title: '保存结果 data', fields: [
    { key: 'id', type: 'long', desc: '随诊 ID（新增时为新生成的 ID），后续保存带上' },
    { key: 'patientId', type: 'long', desc: '患者 ID（新患者建档后返回）' }
  ] }
};

// ---------- 接口 ----------
const DOCTOR = { name: 'doctorId', in: 'query', type: 'long', required: true, desc: '医生 ID。App 内 WenwenClass.getUserId()；localhost 开发为 5065' };
const RESEARCH = { name: 'researchType', in: 'query', type: 'long', required: true, desc: '研究平台，固定 12（纤维肌痛）' };
const endpoints = [
  { method: 'GET', path: '/api/fms/patient/list', summary: '查询患者列表', pages: 'research-platform.html（预取第 1 页）→ patient-list.html',
    desc: '医生名下纤维肌痛研究的患者，分页。列表页滚动到底部加载下一页；搜索在已加载的患者中按姓名本地过滤。success 不为 true 时按空列表处理。',
    params: [
      { name: 'pageNo', in: 'query', type: 'int', required: true, desc: '页码，从 1 开始' },
      { name: 'pageSize', in: 'query', type: 'int', required: true, desc: '每页条数，页面固定 20' },
      DOCTOR, RESEARCH
    ],
    response: { fields: [
      { key: 'success', type: 'boolean', desc: '是否成功', values: 'true / false' },
      { key: 'message', type: 'string', desc: '失败原因' },
      { key: 'data', ...ref('PatientItem', true), desc: '患者数组' },
      { key: 'totalPages', type: 'number', desc: '总页数，pageNo < totalPages 时还有下一页' },
      { key: 'totalCount', type: 'number', desc: '总条数' }
    ], example: { success: true, data: [{ id: 1, name: '张三', lastFollowUpDate: '2020-11-04', followUpCount: 2 }], totalPages: 1, totalCount: 1 } } },
  { method: 'GET', path: '/api/fms/patient/followup/list', summary: '查询患者随诊列表', pages: 'patient-list.html 点击患者 → follow-up-list.html?id={患者ID}&name=',
    desc: '某患者的随诊记录，分页，后端按 followUpDate 倒序（同一天按 id 倒序）。点击随诊进入录入开始页（查看）。',
    params: [
      { name: 'pageNo', in: 'query', type: 'int', required: true, desc: '页码，从 1 开始' },
      { name: 'pageSize', in: 'query', type: 'int', required: true, desc: '每页条数，页面固定 20' },
      { name: 'patientId', in: 'query', type: 'long', required: true, desc: '患者 ID' },
      DOCTOR, RESEARCH
    ],
    response: { fields: [
      { key: 'success', type: 'boolean', desc: '是否成功', values: 'true / false' },
      { key: 'message', type: 'string', desc: '失败原因' },
      { key: 'data', ...ref('FollowUpItem', true), desc: '随诊数组（后端 List 序列化）' },
      { key: 'totalPages', type: 'number', desc: '总页数' },
      { key: 'totalCount', type: 'number', desc: '总条数' }
    ], example: { success: true, data: [{ id: 1001, followUpDate: '2020-10-15' }, { id: 1000, followUpDate: '2020-09-15' }], totalPages: 1, totalCount: 2 } } },
  { method: 'GET', path: '/api/fms/patient/case/detail', summary: '查询患者随诊详情', pages: 'follow-up-entry.html（单模块查看、查看随诊病历）、各模块页 mode=view、录入时回显',
    desc: '按模块返回某次随诊的数据。字段名与页面表单控件 name 一致：单选 / 下拉为选项值，多选为数组，日期 yyyy-MM-dd，图片为 URL 数组。未填写的模块返回 {} 或不返回。',
    params: [
      { name: 'patientId', in: 'query', type: 'long', required: true, desc: '患者 ID' },
      DOCTOR,
      { name: 'caseId', in: 'query', type: 'long', required: true, desc: '随诊 ID（随诊列表的 data[].id）' },
      { name: 'parts', in: 'query', type: 'string', required: true, desc: '模块代码，多个用逗号分隔：jbxx 基本信息 / bsbq 病史病情 / zhpd 证候判断 / fzjc 辅助检查 / bqpg 病情评估 / zlfa 治疗方案 / blsj 不良反应' }
    ],
    response: { fields: [
      { key: 'success', type: 'boolean', desc: '是否成功', values: 'true / false' },
      { key: 'message', type: 'string', desc: '失败原因' },
      { key: 'data', ...ref('CaseDetailData'), desc: '以模块代码为 key' }
    ], example: { success: true, data: { zhpd: { mainSyndrome: '肝郁气滞证', hasSecondary: '否', finish: true } } } } },
  { method: 'POST', path: '/api/fms/patient/case/add', summary: '新增 / 修改患者随诊', pages: 'patient-detail.html（录入入口）下的各模块页「保存」',
    desc: 'id 为空新增随诊，有值修改该随诊。每次只提交一个模块（part），{part} 中只需包含本次修改的一级 key：后端以模块内一级 key 为单位覆盖，未提交的 key 保持不变。列表类（治疗史、疾病史、合并药物、治疗方案各类）每次整组提交。新患者 patientId 为空，第一次只能保存 jbxx，后端用 jbxx.name、jbxx.idCard 建档。数据结构与查看接口相同。',
    params: [
      { name: 'body', in: 'body', type: 'application/json', required: true, desc: '见下方请求体' }
    ],
    body: { fields: [
      { key: 'id', type: 'long / null', desc: '随诊 ID；空 = 新增' },
      { key: 'patientId', type: 'long / null', desc: '患者 ID；新患者第一次保存时为空' },
      { key: 'doctorId', type: 'long', desc: '医生 ID' },
      { key: 'researchType', type: 'long', desc: '固定 12', values: '12' },
      { key: 'visitDate', type: 'string', desc: '本次随诊日期（保存基本信息时取 jbxx.visitDate，新随诊默认当天）', values: 'yyyy-MM-dd' },
      { key: 'part', type: 'string', desc: '本次保存的模块代码', values: 'jbxx / bsbq / zhpd / fzjc / bqpg / zlfa / blsj' },
      { key: '{part}', ...ref('CaseDetailData'), desc: '该模块数据，key 与 part 相同（模型见 CaseDetailData 中对应模块）' }
    ], example: { id: 20001, patientId: 10001, doctorId: 5065, researchType: 12, visitDate: '2024-09-24', part: 'jbxx', jbxx: { csi: { q1: '经常', q2: '有时', score: 22, result: '是', finish: true } } } },
    response: { fields: [
      { key: 'success', type: 'boolean', desc: '是否成功', values: 'true / false' },
      { key: 'message', type: 'string', desc: '失败原因，页面直接提示，停留在当前页' },
      { key: 'data', ...ref('CaseAddResult'), desc: '保存结果' }
    ], example: { success: true, message: '', data: { id: 20001, patientId: 10001 } } } },
  { method: 'GET', path: '/api/fms/patient/get/cardno', summary: '按身份证号查询患者（新增患者查重）', pages: 'patient-add.html「下一步」',
    desc: '新增患者前查重。success 为 true 且 data 有内容表示患者已存在，进入录入入口时带上患者 ID；data 为空表示新患者。success 为 false 时提示错误，不当作查无此人。',
    params: [
      { name: 'name', in: 'query', type: 'string', required: true, desc: '患者姓名' },
      { name: 'cardno', in: 'query', type: 'string', required: true, desc: '身份证号（18 位，末位 X 大写）' },
      DOCTOR
    ],
    response: { fields: [
      { key: 'success', type: 'boolean', desc: '是否成功', values: 'true / false' },
      { key: 'message', type: 'string', desc: '失败原因' },
      { key: 'data', type: 'object / null', desc: '已存在时为患者信息；页面使用 id、name、researchNo（研究编号，或 patientNo）' }
    ], example: { success: true, data: { id: 10001, name: '张三', researchNo: 'FM-0001' } } } }
];


// ---------- 与原接口定义（需求截图 / 示例）的差异 ----------
// 原定义来源：patient/list 为需求文字中的请求地址和返回示例；followup/list、case/detail 为 Swagger 截图；
// case/add 为需求中给出的请求体示例。kind：changed 变更 / added 新增 / removed 删除。
const SOURCES = {
  '/api/fms/patient/list': '需求文字中的请求地址和返回示例',
  '/api/fms/patient/followup/list': 'Swagger 截图（查询患者随诊列表）',
  '/api/fms/patient/case/detail': 'Swagger 截图（查询患者随诊详情，截图仅显示 data.blsj 部分）',
  '/api/fms/patient/case/add': '需求中给出的请求体示例 JSON',
  '/api/fms/patient/get/cardno': '无截图，沿用页面已有调用，无差异'
};
// 接口级差异：[接口, 区域(params/body/response), key, kind, 原定义, 原因]
const OP_DIFFS = [
  ['/api/fms/patient/list', 'params', 'pageSize', 'changed', '100', '手机端改为滚动分页加载，每页 20 条'],
  ['/api/fms/patient/list', 'response', 'success', 'changed', '示例为 false', '约定 true 表示成功；示例中的 false 视为占位'],
  ['/api/fms/patient/list', 'response', 'message', 'added', '无', '失败时页面提示原因'],
  ['/api/fms/patient/list', 'response', 'data', 'changed', 'lastFollowUpDate 示例为 null，未定义格式', 'lastFollowUpDate 定为 yyyy-MM-dd，无随访时为 null'],
  ['/api/fms/patient/followup/list', 'response', 'data', 'changed', 'data: {}（对象，未定义字段）', '后端返回 List，定为数组，元素为 FollowUpItem（id、followUpDate），按 followUpDate 倒序'],
  ['/api/fms/patient/followup/list', 'response', 'totalPages', 'added', '无', '分页需要判断是否还有下一页'],
  ['/api/fms/patient/followup/list', 'response', 'totalCount', 'added', '无', '与患者列表接口保持一致'],
  ['/api/fms/patient/case/detail', 'response', 'data', 'changed', '截图仅有 data.blsj 部分字段', '补全 7 个模块；结构与 case/add 请求体一致，模块内字段差异见各 Model'],
  ['/api/fms/patient/case/add', 'body', 'part', 'changed', '"part_bsbq"', '取值改为模块代码 "bsbq"，与 case/detail 的 parts 一致'],
  ['/api/fms/patient/case/add', 'body', 'page', 'removed', 'page: 1', '与保存无关'],
  ['/api/fms/patient/case/add', 'body', 'id', 'changed', 'id: 20001（未说明）', '补充规则：为空表示新增随诊，有值表示修改'],
  ['/api/fms/patient/case/add', 'body', 'patientId', 'changed', 'patientId: 10001（未说明）', '补充规则：新患者为空，第一次保存 jbxx 时后端用 name、idCard 建档'],
  ['/api/fms/patient/case/add', 'response', 'data', 'added', '未给出返回结构', '返回 CaseAddResult（id、patientId），页面用于后续保存']
];
// 模型字段级差异：模型 → key → [kind, 原定义, 原因]
const MODEL_DIFFS = {
  'jbxx': {
    idCard: ['changed', 'cardNo', '与页面字段名一致'],
    phone: ['changed', 'mobile', '与页面字段名一致'],
    marriage: ['changed', 'marry', '与页面字段名一致'],
    visitDate: ['added', '仅顶层有 visitDate', '页面「本次就诊时间」'],
    hospitalLevel: ['changed', '示例值「三级甲等」', '取页面选项：1级 / 2级 / 3级 / 无级别'],
    workStatus: ['changed', '示例值「在职」', '取页面选项：在职人员 / 退休人员 / 家庭主妇 / 无业人员 / 其他'],
    smokingYears: ['changed', 'string（"5"）', '数字输入框，改为 number'],
    drinkingYears: ['changed', 'string（"3"）', '数字输入框，改为 number'],
    drinkAmount: ['changed', 'string（"100"）', '数字输入框，改为 number'],
    treatmentHistory: ['changed', 'ext.benbingTreatment（缺西药）', '去掉 ext 一层；补充 xiyao'],
    diseaseHistory: ['changed', 'ext.pastDiseases', '去掉 ext 一层，与查看接口一致'],
    concomitantMedication: ['changed', 'ext.concomitantDrugs: ["…"]', '改为 [{ name }]，便于后续扩展'],
    csi: ['changed', 'ext.csi9，仅 finish/result/score', '改名 csi；提交 q1–q9 全部答案'],
    work: ['changed', 'ext.work，仅 finish/result/score', '提交全部题目答案'],
    bodyComposition: ['changed', 'ext.bodyComposition（height/weight/bmi/waist/hip…）', '改为页面实际字段'],
    tipi: ['changed', 'ext.tipi，仅 finish/result/score', '提交全部题目答案'],
    sffq: ['changed', 'ext.sffq，仅 finish/result/score', '提交全部题目答案'],
    tpc: ['changed', 'ext.tpc，仅 finish/result/score', '提交全部题目答案'],
    fs: ['changed', 'ext.fs、ext.wpi、ext.sss 三个平级对象', 'WPI、SSS 归入 fs.wpi、fs.sss'],
    'ext': ['removed', 'jbxx.ext', '子模块直接放在 jbxx 下，与查看接口一致'],
    'id': ['removed', 'jbxx.id: 10001', '随诊 ID 只在顶层 id 传递']
  },
  'jbxx.treatmentHistory': {
    xiyao: ['added', '无西药分类', '页面有「西药」类别']
  },
  'TreatmentHistoryItem': {
    medication: ['added', '无', '西药名称字段（与页面一致）'],
    unit: ['added', '无', '用量单位']
  },
  'DiseaseHistoryItem': {
    years: ['changed', 'string（"2"）', '改为 number']
  },
  'ConcomitantMedicationItem': {
    name: ['changed', '字符串数组元素 "string"', '改为对象 { name }']
  },
  'jbxx.csi': {
    score: ['changed', 'string（"22"）', '改为 number，9 题全答时页面计算'],
    _note: ['changed', 'ext.csi9，仅 finish/result/score', '提交 q1–q9 全部答案（查看页需要回显），score 改为 number']
  },
  'jbxx.bodyComposition': {
    reportImages: ['changed', 'imageUrl（string）', '改为 URL 数组'],
    bodyFatPercentage: ['added', '无', '页面字段'], bodyFatMass: ['added', '无', '页面字段'],
    skeletalMuscleMass: ['added', '无', '页面字段'], skeletalMuscleIndex: ['added', '无', '页面字段'],
    leanBodyMass: ['added', '无', '页面字段'], visceralFatLevel: ['added', '无', '页面字段'],
    'height / weight / bmi / waist / hip / waistHipRatio': ['removed', '示例字段', '页面没有这些项']
  },
  'jbxx.fs': {
    wpi: ['changed', 'ext.wpi（与 fs 平级）', '归入 fs'],
    sss: ['changed', 'ext.sss（与 fs 平级）', '归入 fs']
  },
  'bsbq': {
    systemic: ['changed', 'systemic[]', '多选 key 去掉 []'],
    menstrualItems: ['changed', 'menstrualItems[]', '多选 key 去掉 []']
  },
  'fzjc': {
    labReportImages: ['changed', 'lab_report_url（string）', '改为 URL 数组，可上传多张'],
    ecgReportImages: ['changed', 'ecg_report_url（string）', '改为 URL 数组，可上传多张']
  },
  'bqpg': Object.fromEntries(Object.keys(SCHEMA.bqpg.scales).map(k => [k, ['changed', '仅 finish/result/score', '提交全部题目答案，查看页需要回显']])),
  'zlfa': {
    xiyao: ['changed', 'chengyaoList（category=西药）', '按类别拆分'],
    zhongchengyao: ['changed', 'chengyaoList（中成药）', '按类别拆分'],
    zhongyaoYinpian: ['changed', 'tjList', '改名'],
    feiYaowu: ['changed', 'fywlfTxtList', '改名']
  },
  'ZlfaDrugItem': {
    name: ['changed', 'drugName', '与页面字段一致'],
    dose: ['changed', 'dosis', '与页面字段一致'],
    unit: ['changed', 'dosisUnit', '与页面字段一致'],
    frequency: ['changed', 'drugFreq / cureFreq', '与页面字段一致'],
    instructions: ['added', '无', '用法说明'],
    adjust: ['added', '无', '页面「是否调整」'],
    adjustment: ['added', '无', '页面「调整内容」'],
    reason: ['added', '无', '页面「调整原因」（原 stopReason 为停用原因，语义不同）'],
    'company / drugDelivery / drugExternal / drugWay / goodsName / startTime / endTime / stopReason / fromId / id / partOther / parts': ['removed', '示例字段', '页面没有这些项，不提交']
  },
  'ZlfaYinpianItem': {
    syndrome: ['changed', 'zhengName', '与页面字段一致'],
    recipe: ['changed', 'chuFangList（数组）', '页面为单选处方类型'],
    image: ['changed', 'imgs（数组）', '页面为单张处方图片'],
    'chuFangListQt / fromId / id': ['removed', '示例字段', '页面没有这些项']
  },
  'CaseAddResult': {
    id: ['added', '未给出', '保存后返回随诊 ID'],
    patientId: ['added', '未给出', '新患者建档后返回']
  }
};
// 量表模型：原示例只有 finish/result/score，题目答案均为新增
Object.keys(SCHEMA.bqpg.scales).forEach(k => { MODEL_DIFFS['bqpg.' + k] = { _note: ['changed', '仅 finish/result/score', '提交全部题目答案（下表除 finish 外均为新增）'] }; });
['jbxx.work', 'jbxx.tipi', 'jbxx.sffq', 'jbxx.tpc', 'jbxx.fs.wpi', 'jbxx.fs.sss'].forEach(m => { MODEL_DIFFS[m] = { ...(MODEL_DIFFS[m] || {}), _note: ['changed', '仅 finish/result/score', '提交全部题目答案（下表除 finish 外均为新增）'] }; });

// 应用差异：字段上加 diff，删除的字段追加为划线行，并汇总
const ALL_DIFFS = [];
OP_DIFFS.forEach(([path, area, key, kind, original, reason]) => {
  const op = endpoints.find(e => e.path === path);
  const list = area === 'params' ? op.params : op[area].fields;
  const field = list.find(f => (f.key || f.name) === key);
  const diff = { kind, original, reason };
  if (field) field.diff = diff;
  else list.push({ key, name: key, type: '', desc: '', diff, in: '', removedRow: true });
  (op.diffs = op.diffs || []).push({ key, ...diff });
  ALL_DIFFS.push({ where: path, anchor: 'op-' + endpoints.indexOf(op), area: { params: '请求参数', body: '请求体', response: '返回' }[area], key, ...diff });
});
endpoints.forEach(op => { op.source = SOURCES[op.path]; });
Object.entries(MODEL_DIFFS).forEach(([name, keys]) => {
  const model = models[name];
  Object.entries(keys).forEach(([key, [kind, original, reason]]) => {
    const diff = { kind, original, reason };
    if (key === '_note') model.diffNote = diff;
    else {
      const field = model.fields.find(f => f.key === key);
      if (field && kind !== 'removed') field.diff = diff;
      else model.fields.push({ key, type: '', desc: '', diff: { ...diff, kind: 'removed' }, removedRow: true });
    }
    ALL_DIFFS.push({ where: 'Model ' + name, anchor: 'model-' + name, area: '字段', key: key === '_note' ? '（全部题目）' : key, ...diff });
  });
});

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>纤维肌痛 H5 接口文档</title>
<style>
:root{--bg:#f7f8fa;--card:#fff;--text:#1f2937;--muted:#6b7280;--line:#e5e7eb;--get:#1d6fd6;--get-bg:#eaf2fd;--post:#178a4c;--post-bg:#e8f6ee;--code:#f3f4f6;--accent:#1257c4}
@media (prefers-color-scheme:dark){:root{--bg:#111418;--card:#1a1f26;--text:#e5e7eb;--muted:#9ca3af;--line:#2b323b;--get:#5fa2f5;--get-bg:#1a2a40;--post:#4cc58a;--post-bg:#15301f;--code:#222831;--accent:#7fb0f5}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif}
header{padding:24px 16px 8px;max-width:1100px;margin:auto}
header h1{margin:0;font-size:22px}
header p{margin:6px 0 0;color:var(--muted)}
nav.toc{max-width:1100px;margin:12px auto 0;padding:0 16px;display:flex;flex-wrap:wrap;gap:8px}
nav.toc a{font-size:12px;color:var(--accent);text-decoration:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:3px 10px}
main{max-width:1100px;margin:auto;padding:8px 16px 48px}
h2.section{font-size:17px;margin:28px 0 10px}
details.op,details.model{background:var(--card);border:1px solid var(--line);border-radius:8px;margin:10px 0;overflow:hidden}
details.op>summary,details.model>summary{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;list-style:none;flex-wrap:wrap}
details>summary::-webkit-details-marker{display:none}
.method{font-weight:700;font-size:12px;border-radius:4px;padding:3px 0;width:54px;text-align:center;color:#fff}
.GET .method{background:var(--get)}.POST .method{background:var(--post)}
details.GET{border-color:var(--get)}details.POST{border-color:var(--post)}
details.GET>summary{background:var(--get-bg)}details.POST>summary{background:var(--post-bg)}
.path{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600;word-break:break-all}
.summary{color:var(--muted);margin-left:auto}
.body{padding:4px 14px 14px}
.body h3{font-size:14px;margin:16px 0 6px}
.desc{margin:8px 0;white-space:pre-wrap}
.meta{color:var(--muted);font-size:12px}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;vertical-align:top;padding:7px 10px;border-bottom:1px solid var(--line)}
th{background:var(--code);font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:0}
td.key{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:600;white-space:normal;min-width:9em;max-width:22em}
td.type{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--accent);white-space:nowrap}
td.values{white-space:pre-line;color:var(--muted);min-width:180px}
.req{color:#d14343;font-weight:700}
a.ref{color:var(--accent);font-family:ui-monospace,Menlo,Consolas,monospace}
pre{background:var(--code);border-radius:6px;padding:10px 12px;overflow-x:auto;font-size:12px;margin:0}
.model>summary .name{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700}
.model>summary .title{color:var(--muted)}
.count{font-size:12px;color:var(--muted)}
.rules{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px}
.rules li{margin:4px 0}
/* 差异标注 */
:root{--chg:#b45309;--chg-bg:#fff7e6;--add:#15803d;--add-bg:#ecfdf3;--del:#b91c1c;--del-bg:#fef2f2}
@media (prefers-color-scheme:dark){:root{--chg:#f5b544;--chg-bg:#2e2412;--add:#5ad08a;--add-bg:#13291c;--del:#f37b7b;--del-bg:#2e1616}}
.badge{display:inline-block;white-space:nowrap;font-size:11px;font-weight:700;border-radius:4px;padding:0 5px;margin-left:6px;vertical-align:1px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
.badge.changed{color:var(--chg);background:var(--chg-bg);border:1px solid var(--chg)}
.badge.added{color:var(--add);background:var(--add-bg);border:1px solid var(--add)}
.badge.removed{color:var(--del);background:var(--del-bg);border:1px solid var(--del)}
tr.diff-changed td{background:var(--chg-bg)}tr.diff-added td{background:var(--add-bg)}tr.diff-removed td{background:var(--del-bg)}
tr.diff-removed td.key{text-decoration:line-through;color:var(--del)}
.diff-note{display:block;margin-top:3px;font-size:12px;color:var(--chg)}
tr.diff-added .diff-note{color:var(--add)}tr.diff-removed .diff-note{color:var(--del)}
.diff-box{border:1px solid var(--chg);background:var(--chg-bg);border-radius:6px;padding:8px 12px;margin:10px 0}
.diff-box h4{margin:0 0 4px;font-size:13px;color:var(--chg)}
.diff-box ul{margin:0;padding-left:18px}.diff-box li{margin:2px 0;font-size:13px}
.source{font-size:12px;color:var(--muted)}
.diff-count{font-size:11px;font-weight:700;color:var(--chg);border:1px solid var(--chg);border-radius:999px;padding:0 7px}
.filter{display:flex;align-items:center;gap:6px;margin:8px 0 0;font-size:13px;color:var(--muted)}
body.only-diff tbody tr:not([class*="diff-"]){display:none}
body.only-diff details:not(.has-diff){display:none}
</style>
</head>
<body>
<header>
  <h1>纤维肌痛 H5 接口文档</h1>
  <p>共 ${endpoints.length} 个接口 · 生成自 scripts/build-api-doc.mjs，字段题目和取值来自各模块页面（js/case-record-schema.js）</p>
  <p>与原接口定义（需求截图 / 示例）不同的地方共 <a href="#diffs"><strong>${ALL_DIFFS.length} 处</strong></a>，已在下方用 <span class="badge changed">变更</span><span class="badge added">新增</span><span class="badge removed">删除</span> 标出。</p>
  <label class="filter"><input type="checkbox" id="onlyDiff"> 只看有差异的接口、模型和字段</label>
</header>
<nav class="toc" id="toc"></nav>
<main>
  <h2 class="section">通用约定</h2>
  <ul class="rules">
    <li>所有接口走同源 <code>/api</code> 反向代理，携带 cookie，请求头 <code>X-Requested-With: XMLHttpRequest</code>；GET 超时 10 秒，POST 超时 15 秒。</li>
    <li>返回统一为 <a class="ref" href="#model-Result">Result</a>：<code>success === true</code> 才视为成功，失败时页面显示 <code>message</code>。</li>
    <li>模块字段名与页面表单控件 <code>name</code> 一致；单选 / 下拉为选项值，多选为字符串数组（key 不带 <code>[]</code>），日期 <code>yyyy-MM-dd</code>，数字输入为 number，图片为 URL 数组，未填写的字段不返回 / 不提交。</li>
    <li>模块代码：jbxx 基本信息、bsbq 病史病情、zhpd 证候判断、fzjc 辅助检查、bqpg 病情评估、zlfa 本次治疗方案、blsj 不良反应。</li>
  </ul>
  <h2 class="section" id="diffs">与原定义的差异汇总</h2>
  <p class="source">原定义来源：patient/list 为需求文字中的请求地址和返回示例；followup/list、case/detail 为 Swagger 截图；case/add 为需求中给出的请求体示例；get/cardno 无截图。字段级差异在各接口、模型中用颜色标出，并注明原写法和原因。</p>
  <div class="table-wrap"><table id="diffTable"><thead><tr><th>位置</th><th>区域</th><th>key</th><th>变化</th><th>原定义</th><th>现定义 / 原因</th></tr></thead><tbody></tbody></table></div>
  <h2 class="section">接口</h2>
  <div id="ops"></div>
  <h2 class="section">数据模型（Models）</h2>
  <div id="models"></div>
</main>
<script>
const ENDPOINTS = ${JSON.stringify(endpoints)};
const MODELS = ${JSON.stringify(models)};
const ALL_DIFFS = ${JSON.stringify(ALL_DIFFS)};
const KIND = { changed: '变更', added: '新增', removed: '删除' };
const badge = kind => el('span', { class: 'badge ' + kind }, KIND[kind]);
const diffNote = d => el('span', { class: 'diff-note' }, (d.kind === 'removed' ? '已删除：' : '原：') + d.original + (d.reason ? '（' + d.reason + '）' : ''));
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => k === 'class' ? n.className = v : k === 'html' ? n.innerHTML = v : n.setAttribute(k, v)); kids.flat().forEach(k => n.append(k)); return n; };
const typeCell = f => {
  const td = el('td', { class: 'type' });
  if (f.ref) { td.append(el('a', { class: 'ref', href: '#model-' + f.ref }, f.ref), f.array ? '[]' : ''); }
  else td.textContent = f.type || '';
  return td;
};
const fieldTable = fields => el('div', { class: 'table-wrap' }, el('table', {},
  el('thead', {}, el('tr', {}, el('th', {}, 'key'), el('th', {}, '类型'), el('th', {}, '说明'), el('th', {}, '取值 value'))),
  el('tbody', {}, fields.map(f => el('tr', f.diff ? { class: 'diff-' + f.diff.kind } : {},
    el('td', { class: 'key' }, f.key, f.diff ? badge(f.diff.kind) : ''), typeCell(f),
    el('td', {}, f.desc || '', f.diff ? diffNote(f.diff) : ''), el('td', { class: 'values' }, f.values || ''))))));
const toc = document.getElementById('toc');
ENDPOINTS.forEach((op, i) => {
  const id = 'op-' + i;
  toc.append(el('a', { href: '#' + id }, op.method + ' ' + op.path));
  const body = el('div', { class: 'body' },
    el('p', { class: 'desc' }, op.desc),
    el('p', { class: 'meta' }, '使用页面：' + op.pages),
    el('h3', {}, '请求参数'),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, '参数'), el('th', {}, '位置'), el('th', {}, '类型'), el('th', {}, '必填'), el('th', {}, '说明'))),
      el('tbody', {}, op.params.map(p => el('tr', p.diff ? { class: 'diff-' + p.diff.kind } : {}, el('td', { class: 'key' }, p.name, p.diff ? badge(p.diff.kind) : ''), el('td', {}, p.in), el('td', { class: 'type' }, p.type), el('td', {}, p.removedRow ? '' : p.required ? el('span', { class: 'req' }, '是') : '否'), el('td', {}, p.desc, p.diff ? diffNote(p.diff) : '')))))));
  // 原定义来源 + 差异清单
  body.prepend(el('p', { class: 'source' }, '原定义来源：' + op.source));
  if (op.diffs) body.insertBefore(el('div', { class: 'diff-box' }, el('h4', {}, '与原定义的差异（' + op.diffs.length + ' 处）'),
    el('ul', {}, op.diffs.map(d => el('li', {}, badge(d.kind), ' ', el('code', {}, d.key), '：原 ', d.original, ' → ', d.reason)))), body.children[3]);
  if (op.body) body.append(el('h3', {}, '请求体（application/json）'), fieldTable(op.body.fields), el('h3', {}, '请求示例'), el('pre', {}, JSON.stringify(op.body.example, null, 2)));
  body.append(el('h3', {}, '返回（200）'), fieldTable(op.response.fields), el('h3', {}, '返回示例'), el('pre', {}, JSON.stringify(op.response.example, null, 2)));
  document.getElementById('ops').append(el('details', { class: 'op ' + op.method + (op.diffs ? ' has-diff' : ''), id, open: '' },
    el('summary', {}, el('span', { class: 'method' }, op.method), el('span', { class: 'path' }, op.path), op.diffs ? el('span', { class: 'diff-count' }, op.diffs.length + ' 处差异') : '', el('span', { class: 'summary' }, op.summary)), body));
});
toc.append(el('a', { href: '#models' }, 'Models'));
Object.entries(MODELS).forEach(([name, model]) => {
  const body = el('div', { class: 'body' });
  if (model.page) body.append(el('p', { class: 'meta' }, '对应页面：' + model.page));
  if (model.note) body.append(el('p', { class: 'desc' }, model.note));
  if (model.diffNote) body.append(el('div', { class: 'diff-box' }, el('h4', {}, '与原定义的差异'), el('p', { class: 'desc' }, '原：' + model.diffNote.original + ' → ' + model.diffNote.reason)));
  body.append(fieldTable(model.fields));
  const diffCount = model.fields.filter(f => f.diff).length + (model.diffNote ? 1 : 0);
  document.getElementById('models').append(el('details', { class: 'model' + (diffCount ? ' has-diff' : ''), id: 'model-' + name },
    el('summary', {}, el('span', { class: 'name' }, name), el('span', { class: 'title' }, model.title), el('span', { class: 'count' }, model.fields.length + ' 个字段'), diffCount ? el('span', { class: 'diff-count' }, diffCount + ' 处差异') : ''), body));
});
// 差异汇总表
document.querySelector('#diffTable tbody').append(...ALL_DIFFS.map(d => el('tr', { class: 'diff-' + d.kind },
  el('td', {}, el('a', { class: 'ref', href: '#' + d.anchor }, d.where)), el('td', {}, d.area), el('td', { class: 'key' }, d.key),
  el('td', {}, badge(d.kind)), el('td', {}, d.original), el('td', {}, d.reason))));
// 只看差异：隐藏没有差异的接口、模型和字段行，并展开有差异的模型
document.getElementById('onlyDiff').addEventListener('change', e => {
  document.body.classList.toggle('only-diff', e.target.checked);
  if (e.target.checked) document.querySelectorAll('details.has-diff').forEach(d => { d.open = true; });
});
// 点击模型链接时展开目标模型
function openTarget() { const t = location.hash && document.getElementById(location.hash.slice(1)); if (t && t.tagName === 'DETAILS') { t.open = true; t.scrollIntoView(); } }
window.addEventListener('hashchange', openTarget); openTarget();
</script>
</body>
</html>
`;
await writeFile('docs/api/index.html', html);
console.log('已生成 docs/api/index.html');
