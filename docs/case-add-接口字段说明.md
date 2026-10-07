# 新增病例提交接口：JSON 字段说明

- 接口：`POST /api/fms/patient/case/add`，`Content-Type: application/json`
- 完整示例：[`case-add-payload.example.json`](./case-add-payload.example.json)。这是前端把全部页面自动填完、点「完成本次资料录入」时实际发出的请求体，值是自动填的测试值。
- 前端代码：`js/fms-case.js`（草稿与提交），各模块页面负责写入自己那一段。

## 一、提交时机与顶层字段

| 字段 | 说明 |
|---|---|
| `id` | 病例 id。第一次提交为 `null`。前端从响应的 `data`（数字），或 `data.id` / `data.caseId` 取 id，之后每次提交都带上。**请后端确认：没有 id 就新增、有 id 就更新，并在响应里返回 id。** |
| `patientId` | 查重（`/api/fms/patient/get/cardno`）查到已有患者时，取该患者的 `id` / `patientId`；新患者为 `null`，前端会从响应 `data.patientId` 回填。 |
| `doctorId` | App 端用 `WenwenClass.getUserId()`，本地开发用 5065。 |
| `researchType` | 固定 12。 |
| `visitType` | **新增**。患者的第一条记录为基线访问，之后的都是随诊：`"基线"`：新增患者时的病例（含基本信息模块）；`"随诊"`：从患者的随访记录页「新增随访记录」创建，挂在该患者 `patientId` 下，不含基本信息模块，`visitDate` 为随诊日期。后端如果按记录先后自行判断，可忽略此字段。 |
| `visitDate` | 本次就诊时间，同 `jbxx.visitDate`，默认当天。 |
| `page` | 固定 1。 |
| `part` | 本次提交的模块：`jbxx` / `bsbq` / `zhpd` / `fzjc` / `bqpg` / `zlfa` / `blsj`（子模块按所属顶层模块，例如 CSI、TPC 都是 `jbxx`）。每个模块点保存时提交一次；同一次保存顺带写到别的模块时，会再按那个模块的 part 提交一次。「完成本次资料录入」不再用汇总的 part，只把还有未提交改动的模块按各自的 part 补交。 |

每次提交都是**整份结构体**，没填的模块也会带上，只是数据为空。

各模块都有 `finish`（布尔），表示该模块已保存。`bqpg.finish` 在 9 个量表都完成时才为 `true`。

## 二、新增的字段（结构体里原来没有）

### jbxx 基本信息
| 字段 | 类型 | 说明 |
|---|---|---|
| `city` | string | 常住地「市」，与 `province` 联动 |
| `drinkTypes` | string[] | 酒类多选，可选白酒、啤酒、红酒。`drinkType` 仍保留，是用「、」拼接的字符串 |
| `baijiuAmount / beerAmount / wineAmount` | number | 按 PDF 每种酒分别填写「每天用量」（ml），只有勾选了该酒类才有值，否则为空串。原来的 `drinkAmount` 保留，值为三者之和（ml/天），都没填时为空串 |
| `signature` | string | 患者知情同意告知与签署：电子签字，页面手写后存为 PNG 的 base64 dataURL；未签为空串（结构体原有字段，PDF 新版要求后重新提交） |
| `diseaseHistoryFinish` | bool | 合并疾病列表已保存 |
| `concomitantMedicationFinish` | bool | 合并药物列表已保存 |
| `csi/work/tipi/sffq/tpc.answers` | object | 各问卷的原始作答 |
| `sffq.answers` 键 | string | 油：`oil_type`、`oil_daily`（选「其他用量（g）」时 `oil_extra`）；第 2~10 组食物 `s{组}_{条目}_freq`（9 档，含「从不」）/ `s{组}_{条目}_amt`，选「5两以上（请填入两数）」「4个以上（请填入个数）」「大于500ml（请填入ml数）」时填 `s{组}_{条目}_extra`；鱼油/DHA：`dha_used`（无/有），有时 `dha_brand`（爱维乐/VIVA/WHC小千金/Swisse/汤臣倍健/金凯撒/其他，其他时 `dha_other` 名称）、`dha_dose`（无/1粒/天/2粒/天/3粒/天/4粒/天/其他剂量(粒/天)，其他时 `dha_dose_extra`）；其他食物：`other_food_used`（无/有），有时 `other_food_{1-5}_name` / `other_food_{1-5}_weight`（两，1两=25g）。`dha_dose`、`dha_dose_extra` 为新增 |
| `work.absenteeism` | string | WPAI 缺勤率（%），= Q2/(Q2+Q4)，仅 Q1=是 时计算 |
| `work.answers.q5 / q6` | string | 按 PDF 只有两个选项，值为选项文字：q5「健康问题对我的工作没有影响（0-4分）」/「健康问题使我完全无法工作（5-10分）」；q6「健康问题对我的日常活动没有影响（0-4分）」/「健康问题使我完全无法进行日常活动（5-10分）」。跳过的题为空串。原来的 `q5Score / q6Score`（0~10 分值）及据此计算的 `presenteeism / workImpairment / activityImpairment` 已删除 |
| `tipi.extraversion / agreeableness / conscientiousness / emotionalStability / openness` | string | TIPI 五个维度分，范围 1~7 |
| `fs.score / fs.result / fs.finish` | | FS = WPI + SSS；`result` 按 2016 标准判定，WPI≥7 且 SSS≥5，或 WPI 4~6 且 SSS≥9 时为「是」 |
| `fs.wpi.answers / fs.sss.answers` | object | 原始作答 |
| `diseaseHistory[]` | object[] | 每条 `{category, categoryLabel, name}`。新版 PDF 只有疾病名称（选「其他」时 `name` 为填写的疾病名称），没有病程、诊断时间。`category` 取值：`fengshi`（风湿性疾病）及其他系统疾病 `huxi / xiaohua / xunhuan / neifenmi / shen / guke / shengzhi / xinli / tengtong` |
| `concomitantMedication[]` | object[] | 每条只有 `{name}`（药物名称），与新版 PDF 一致 |
| `treatmentHistory.hasXiyao / hasZhongyaoTangji / hasFeiYaowuLiaofa / hasZhongchengyao` | string | 各类治疗史的「无/有」 |
| `treatmentHistory.xiyao[]` | object[] | `{name, medication, frequency, dose, unit, startDate, ongoing, endDate, reason}`。频次：日1次/日2次/日3次/晚1次；用量 `dose`：`"1"`~`"8"`，`unit` 固定「片/粒」；`ongoing` 为「否」时才有 `endDate`、`reason`（停用原因） |
| `treatmentHistory.zhongchengyao[]` | object[] | `{name, frequency, dose, unit, startDate, endDate}`。频次：日1次/日2次/日3次；用量 `dose`：`"1"`~`"5"`，`unit` 固定「片/粒」；`startDate / endDate` 为 PDF 的「开始时间 / 结束时间」，没有是否沿用至今、停用原因 |
| `treatmentHistory.feiYaowuLiaofa[]` | object[] | `{name, duration, durationUnit, frequency, startDate, ongoing, endDate, reason}`。`duration` 为单次时长 `"5"`~`"60"`（步长 5），`durationUnit` 固定「分钟」；频次 14 档（日1次…每月3次）；选「其他」时 `name` 为填写的名称（具体治疗） |

### bsbq 病史病情
| 字段 | 类型 | 说明 |
|---|---|---|
| `onsetTriggers` | string[] | 发病诱因，多选 |
| `aggravatingTriggers` | string[] | 加重诱因，多选 |
| `painNature` | string[] | 肌肉疼痛性质，多选 |
| `menstrualStage` | string | 月经情况分期，单选：绝经期、围绝经期、育龄期 |
| `periodTiming / periodColor / periodAmount / dysmenorrhea` | string | 经期（月经先期/月经后期/月经先后不定期/经期延长/正常）、经色（淡红/深红/紫暗/正常）、经量（月经过多/月经过少/正常）、痛经（有/无）。**只有 `menstrualStage` 为「围绝经期」时才填**，其他分期为空串 |

`bsbq` 里还有几点：
- `coatShape` 现在存的是「苔质」（厚、薄、润、滑、燥、腐、腻、剥、无）。
- 月经情况按新版 PDF 改为「分期 + 围绝经期子问题」，原来的 `menstrualItems`（9 项多选）不再提交。
- 「周身疼痛发病时间、是否确诊、确诊时间」按 PDF 在病史病情页填写，按结构体存在 `jbxx.painOnsetDate / diagnosed / diagnosisDate`；病史病情保存时会顺带以 `part: "jbxx"` 提交一次（随访同样如此）。

### zhpd 证候判断
| 字段 | 类型 | 说明 |
|---|---|---|
| `secondarySyndromes` | string[] | 兼证多选，且不能与主证相同。`secondarySyndrome` 仍保留，是用「、」拼接的字符串；`hasSecondary` 由前端自动计算 |

### fzjc 辅助检查
| 字段 | 类型 | 说明 |
|---|---|---|
| `stool_appearance` | string | 便外观性，单选：黏液便、脓血便、黑便、鲜红血便、陶土样便、正常、未查 |
| `stool_wbc_status / stool_rbc_status` | string | 便常规白细胞、红细胞：正常 / 数值 / 未查 |
| `stool_wbc_value / stool_rbc_value` | string | 选「数值」时填写（/ul），否则为空 |
| `cholesterol / triglyceride / ldl / hdl` | string | 胆固醇、甘油三酯、低密度/高密度脂蛋白胆固醇（mmol/L） |
| `apob / apoa` | string | 载脂蛋白B、载脂蛋白A（g/L） |
| `cholesterol_status` 等 6 个 `<血脂key>_status` | string | 该项勾选「未查」为「未查」（值为空），填了值为「已查」，没填为空串 |

- 血常规、尿常规各 `*_status`：该组勾选「未查」时为「未查」，此时 `*_value` 为空；填了值时为「已查」；没填为空串。
- 生化 `alt / ast / bun / cr` 的 `*_status` 改为单选：未查 / 正常 / 异常；只有「异常」时才有 `*_value`（ALT、AST 为 U/L，BUN 为 mmol/L，Cr 为 umol/L）。
- `stool_occult` 便潜血：阴性 / 阳性 / 未查。

`ecg` 增加选项「未查」。

### blsj 不良反应
| 字段 | 类型 | 说明 |
|---|---|---|
| `adverseEventOther` | string | 不良反应勾选「其他」时填写的名称；`adverseEvents` 里仍是「其他」 |

`adverseEvents` 存选项名称（不带百分比）。

### bqpg 病情评估（每个量表都有 `finish / score / result / answers`）
| 量表 | 额外字段 | score / result 规则 |
|---|---|---|
| vas | — | score：VAS 0~10；result：无痛/轻度/中度/重度/剧痛 |
| fiqr | `functionScore, impactScore, symptomScore, severity` | 总分 0~100；result 为空，`severity` 为轻/中/重度 |
| pcs | `rumination, magnification, helplessness` | 0~52；≥30 为「是」 |
| mfi20 | `generalFatigue, physicalFatigue, reducedActivity, reducedMotivation, mentalFatigue` | 20~100；result 为空 |
| psqi | `components{sleepQuality, sleepLatency, sleepDuration, sleepEfficiency, sleepDisturbance, sleepMedication, daytimeDysfunction}`（数字 0~3） | 0~21；>7 为「是」 |
| had | `anxietyScore, depressionScore, anxietyResult, depressionResult` | score 为焦虑与抑郁之和；任一 ≥8 为「是」 |
| sf12 | — | 未计分，score 和 result 都为空，只存 answers |
| painDetect | — | -1~38；result：阴性 / 不确定 / 阳性 |
| cfq | — | 0~100；result 为空 |

`bqpg` 里还有几点：
- 每个量表新增 `answered`、`total`（数字）：已作答题数 / 应答题数，用于「已填 x/N」进度显示。量表页边填边暂存到草稿：没答完时只有 `finish: false, answered, total, answers`，没有计分字段；答完后 `finish: true` 并带计分。点「保存并返回」或「完成本次资料录入」时随 `part: "bqpg"` 提交，所以后端可能收到 `finish: false` 的半填量表。`bqpg.finish` 仍只在 9 个量表都完成时为 `true`。
- 滑块题（VAS、FIQR、painDETECT 第 3~5 题）只有被拖动/点过才算作答，没作答的在 `answers` 里是空串。
- vas：`answers.painNature`（string[]）新增，肌肉疼痛性质多选：酸痛、胀痛、冷痛、刺痛、钝痛、灼痛、窜痛（选填，不计入进度）。
- fiqr：症状第 10 题的四个细项改为 `fiqr_3_10_1`~`fiqr_3_10_4`（噪音/明亮光线/异味/寒冷，原 `fiqr_3_11`~`fiqr_3_14`），不计分。
- mfi20：`answers.mfi1`~`mfi20` 的值改为 1~5（1 不符合 … 5 完全符合，原为 0~4），计分规则不变。
- psqi：上床/起床时间改为「时」「分」下拉，新增 `bedtimeHour, bedtimeMinute, waketimeHour, waketimeMinute`（不补零的数字字符串）；`bedtime / waketime` 仍保留，由前端合成 "HH:MM"。`hours` 改为 0~24 整数下拉。新增 `psqi5_10_note`（5j 其它影响睡眠的事情的说明，5j 选⑵~⑷时必填）。
- painDetect：第 1 题人体图选区 `painRegions` 选填，不计入进度。

### zlfa 本次治疗方案
| 字段 | 类型 | 说明 |
|---|---|---|
| `hasXiyao / hasZhongchengyao / hasFeiYaowu` | string | 「无/有」。选「无」时对应列表为空 |
| `xiyao[].category` | string | 药物分类：改善纤维肌痛综合征病情药物 / 改善焦虑、抑郁药物 / 助眠药 / 非甾体抗炎类药物 / 肌松药 / 其他。选「其他」时 `name` 为手填药品名称、`dose` 为手填用量、`unit` 为 mg |
| `xiyao[].dose / unit / frequency` | string | 剂量、单位（mg；氟哌噻吨美利曲片为「片」）、频次。非甾体抗炎类药物 PDF 只有药名，三者为空串 |
| `xiyaoCategoryAdjust` | `{[药物分类]: {adjust, adjustment, reason}}` | 西药按药物分类各回答一次「是否调整西药」（只含有药品的分类）。同样的值复制到该分类每条记录的 `adjust / adjustment / reason` 上 |
| `xiyaoAdjust` | `{adjust, adjustment, reason}` | 西药各分类的汇总：任一分类「是」即为「是」，全部「否」为「否」；`adjustment / reason` 为各「是」分类的「分类：值」，以「；」分隔 |
| `zhongchengyaoAdjust / feiYaowuAdjust` | `{adjust, adjustment, reason}` | 页面按类别回答一次「是否调整」。同样的值也复制到该类每条记录的 `adjust / adjustment / reason` 上 |
| `zhongchengyao[].spec / route` | string | 规格、给药方式（页面无输入，传空串） |
| `feiYaowu[].customName` | string | 非药物疗法选「其他」时填写的名称；此时 `name` 也是这个名称 |
| `zhongyaoYinpian[]` | object | 中药汤剂（key 沿用 zhongyaoYinpian，`name` 固定为「中药汤剂」）。`syndrome` 主要中医证型，`recipe` 方剂名，`composition` 方剂组成（string[]），`prescription` 补充药物（分号隔开），`image` 拍照上传的图片 |

## 三、结构体里有、但现在不提交的字段

按需求 PDF 页面已删除，或页面上没有对应输入：

| 字段 | 原因 |
|---|---|
| `jbxx.phone, jbxx.hospitalLevel` | 基本信息页 PDF 里没有手机号；确诊医疗机构级别属于「是否曾确诊」，该题在病史病情页填写，是否提交以病史病情模块说明为准 |
| `jbxx.work.answers.q5Score / q6Score`、`jbxx.work.presenteeism / workImpairment / activityImpairment` | WPAI 第5、6题按 PDF 改为两个选项，没有 0~10 分值，无法计算这三项 |
| `jbxx.bodyComposition.height, weight, bmi, waist, hip, ratio1, ratio2` | 人体成分 PDF 只有体脂百分比、体脂量、骨骼肌量、骨骼肌指数、去脂体重、内脏脂肪等级、腰臀比（`waistHipRatio` 直接填写）、上传检验 |
| `jbxx.diseaseHistory[].years / months / diagnosisDate` | 新版 PDF 既往疾病史只有疾病名称，不再有病程、诊断时间 |
| `jbxx.concomitantMedication[].dose / unit / frequency / startDate / ongoing / endDate / reason` | 新版 PDF 合并药物只有药物名称 |
| `treatmentHistory.xiyao[].spec / route`、`zhongchengyao[].ongoing / reason` | 新版 PDF 西药没有规格、给药方式（用量统一按 片/粒）；中成药只有开始时间、结束时间 |
| `bsbq.menstrualItems` | 新版 PDF 月经情况改为分期（`menstrualStage`）+ 围绝经期子问题，不再提交 |
| `fzjc.glucose_value, glucose_status` | 新版 PDF 生化没有血糖 |
| `fzjc.stool_status` | 新版 PDF 便常规各项分别有「未查」，不再有整组状态 |
| `treatmentHistory.*[].medication` 等 | 只有西药同时写 `medication`（等于 `name`）。中药汤剂只有开始日期、是否沿用至今、结束日期、停用原因；非药物疗法没有 `dose / unit`；中成药没有 `ongoing / reason`；各类都没有 `duration`（非药物的 `duration` 是单次时长） |
| `zlfa.*[].instructions`、`zlfa.zhongchengyao[].category` | 页面没有对应输入，西药和中成药传空串 |
| `zlfa.xiyao[].spec / route` | 新版 PDF 西药没有规格、给药方式，不再提交 |
| `zlfa.xiyao[] / zhongchengyao[].duration`、`zlfa.feiYaowu[].dose` | 页面没有对应输入，不传 |

## 四、其他请后端注意

1. **图片**：目前没有上传接口，以下字段放的是压缩后的 base64 dataURL（JPEG，最长边 1600px）：
   - 人体成分 `bodyComposition.reportImages[]`
   - 辅助检查 `fzjc.labReportImages[] / ecgReportImages[]`
   - 中药汤剂 `zlfa.zhongyaoYinpian[].image`

   对应的 `imageUrl / lab_report_url / ecg_report_url` 为空。如果提供上传接口，前端改为先上传、再填 url。
2. **数值类型**：大部分数值以字符串传，与原结构体一致，例如化验值 `"5.2"`、分数 `"22"`。`smokingYears / drinkingYears / drinkAmount / baijiuAmount / beerAmount / wineAmount` 为数字，没填时为空串；`psqi.components` 里是数字。
3. **answers 内的取值**：answers 里的值是页面选项的 value。有的是数字字符串，比如 CSI 的 `"0"~"4"`；有的是选项文字，比如 SSS 的 `"0（没有）"`。后端以 `score / result` 为准即可。
4. **日期格式**：一律 `yyyy-MM-dd`。时间（PSQI 上床/起床）格式为 `HH:mm`。

## 五、随访记录

流程：患者列表 → 点患者 → 随访记录（`follow-up-list.html?patientId=&name=&cardno=`）→「新增随访记录」→ 资料页（病史病情、证候判断、辅助检查、病情评估、本次治疗方案、不良反应，顶部可改随访日期）→ 各模块保存同样调用 `case/add`，请求里 `patientId` 为该患者 id、`visitType: "随诊"`、第一次无 `id`，后续带返回的 `id`。

- 患者列表接口返回的每个患者需有 `id`（或 `patientId`），前端据此把随访挂到该患者下。
- 随访记录列表：`GET /api/fms/patient/followup/list?pageNo=1&pageSize=100&patientId=&doctorId=&researchType=12`。前端从 `data` / `data.list` / `data.records` 取数组；每条用 `caseId`（或 `id`）作为病例 id，用 `visitDate`（或 `followupDate` / `createTime`）作为日期；有 `visitType` 用后端的，否则日期最早的一条显示为「基线访问」，其余为「随诊」。**请后端确认列表每条的 id 和日期字段名。**
- 打开某条记录：`GET /api/fms/patient/case/detail?patientId=&doctorId=&caseId=&parts=jbxx,bsbq,zhpd,fzjc,bqpg,zlfa,blsj`，返回的 `data` 按提交结构体回填到各页面；之后保存仍调 `case/add`，带 `id = caseId` 即为更新。
- 删除记录：`GET /api/fms/patient/del/followuphistory?id=<caseId>`，`success` 为 false 或 `data` 为 false 视为失败。
- 患者 id 统一用 `patientId`（患者列表、查重结果优先取 `patientId`，没有再取 `id`）。

## 六、模块从属（页面层级）

- 基本信息（`jbxx`）及其子模块：CSI-9（`csi`）、压痛点 TPC（`tpc`）、纤维肌痛症状量表 FS（`fs`，下含 WPI `fs.wpi`、SSS `fs.sss`）、间接成本评估（`work`）、人体成分分析（`bodyComposition`）、TIPI-C（`tipi`）、SFFQ（`sffq`）、本病治疗史（`treatmentHistory`）、合并疾病/既往疾病史（`diseaseHistory`）、合并药物（`concomitantMedication`）
- 病史病情（`bsbq`）：无子模块；页内第 1、2 题「周身疼痛发病时间」「是否曾确诊（确诊时间）」写入 `jbxx`
- 证候判断（`zhpd`）、辅助检查（`fzjc`）：无子模块
- 病情评估（`bqpg`）：9 个量表
- 本次治疗方案（`zlfa`）：西药、中药汤剂、中成药、非药物疗法、查看开药汇总
- 不良反应（`blsj`）

## 七、查看 / 编辑已有记录

- 患者列表 → 点患者 → 随访记录列表 → 点某条记录：调 `case/detail` 取整份数据，进入该记录的模块页（基线访问 7 个模块，随诊 6 个），**默认查看**。
- 点某个模块：模块页只读（输入锁定，隐藏保存/添加/删除），底部「返回」「编辑」。点「编辑」只放开当前模块（含其子页面），保存时调 `case/add`，带该记录的 `id`（= caseId），`part` 为该模块，即更新这一条记录；保存后回到模块列表，恢复只读。
- 模块列表底部「查看随诊病历」（基线为「查看病历」）：进入 `case-view.html`，把本条记录各模块的数据汇总成只读病历页。
