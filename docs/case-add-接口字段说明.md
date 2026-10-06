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
| `visitType` | **新增**。`"首诊"`：新增患者时的病例（含基本信息模块）；`"随访"`：从患者的随访记录页「新增随访记录」创建，挂在该患者 `patientId` 下，不含基本信息模块，`visitDate` 为随访日期。同样不带 id 时新增、带 id 时更新。 |
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
| `diseaseHistoryFinish` | bool | 合并疾病列表已保存 |
| `concomitantMedicationFinish` | bool | 合并药物列表已保存 |
| `csi/work/tipi/sffq/tpc.answers` | object | 各问卷的原始作答 |
| `work.absenteeism / presenteeism / workImpairment / activityImpairment` | string | WPAI 四项百分比，分别是缺勤率、出勤受损、总体工作受损、活动受损 |
| `tipi.extraversion / agreeableness / conscientiousness / emotionalStability / openness` | string | TIPI 五个维度分，范围 1~7 |
| `fs.score / fs.result / fs.finish` | | FS = WPI + SSS；`result` 按 2016 标准判定，WPI≥7 且 SSS≥5，或 WPI 4~6 且 SSS≥9 时为「是」 |
| `fs.wpi.answers / fs.sss.answers` | object | 原始作答 |
| `diseaseHistory[].months` | string | 该病病程，单位月（PDF 规格要求按月）。代替原来的 `years` |
| `diseaseHistory[].diagnosisDate` | string | 诊断时间 |
| `concomitantMedication[]` 增加 `dose, unit, frequency, startDate, ongoing, endDate, reason` | string | 原来只有 `name`。`ongoing` 为「否」时才有 `endDate`、`reason`（停用原因） |
| `treatmentHistory.hasXiyao / hasZhongyaoTangji / hasFeiYaowuLiaofa / hasZhongchengyao` | string | 各类治疗史的「无/有」 |
| `treatmentHistory.xiyao[].spec / route` | string | 规格、给药方式（口服） |
| `treatmentHistory.feiYaowuLiaofa[].durationUnit` | string | 单次时长单位，固定为「分钟」 |

### bsbq 病史病情
| 字段 | 类型 | 说明 |
|---|---|---|
| `onsetTriggers` | string[] | 发病诱因，多选 |
| `aggravatingTriggers` | string[] | 加重诱因，多选 |
| `aggravatingTriggerNotes` | object | 加重诱因中「情绪波动、饮食不当、自然界因素、非自然界因素」的说明文字，key 分别为 `emotion / diet / naturalFactor / nonNaturalFactor` |
| `painNature` | string[] | 肌肉疼痛性质，多选 |

`bsbq` 里还有几点：
- `coatShape` 现在存的是「苔质」（厚、薄、润、滑、燥、腐、腻、剥、无）。
- `menstrualItems` 存月经情况，多选，可选项：正常、停经、延期、提前、血块、白带、量多、量少、男性。
- 「周身疼痛发病时间、是否确诊、确诊时间」在基本信息页填写，放在 `jbxx.painOnsetDate / diagnosed / diagnosisDate`。

### zhpd 证候判断
| 字段 | 类型 | 说明 |
|---|---|---|
| `secondarySyndromes` | string[] | 兼证多选，且不能与主证相同。`secondarySyndrome` 仍保留，是用「、」拼接的字符串；`hasSecondary` 由前端自动计算 |

### fzjc 辅助检查
| 字段 | 类型 | 说明 |
|---|---|---|
| `glucose_value / glucose_status` | string | 血糖（mmol/L），PDF 新增 |
| `stool_status` | string | 便常规：「未查」或「已查」 |

各 `*_status` 字段：该组勾选「未查」时为「未查」，此时 `*_value` 为空；填了值时为「已查」；没填为空串。

`ecg` 增加选项「未查」。

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

### zlfa 本次治疗方案
| 字段 | 类型 | 说明 |
|---|---|---|
| `xiyaoAdjust / zhongchengyaoAdjust / feiYaowuAdjust` | `{adjust, adjustment, reason}` | 页面按类别回答一次「是否调整」。同样的值也复制到该类每条记录的 `adjust / adjustment / reason` 上 |
| `hasZhongchengyao / hasFeiYaowu` | string | 「无/有」 |
| `xiyao[].spec / route`、`zhongchengyao[].spec / route` | string | 规格、给药方式 |
| `feiYaowu[].customName` | string | 非药物疗法选「其他」时填写的名称；此时 `name` 也是这个名称 |
| `zhongyaoYinpian[].composition` | string[] | 方剂组成。`recipe` 为方剂名，`prescription` 为补充药物（分号隔开），`image` 为拍照上传的图片 |

## 三、结构体里有、但现在不提交的字段

按需求 PDF 页面已删除，或页面上没有对应输入：

| 字段 | 原因 |
|---|---|
| `jbxx.phone, jbxx.hospitalLevel, jbxx.signature` | PDF 里没有手机号、确诊医疗机构级别、签名 |
| `jbxx.bodyComposition.height, weight, bmi, waist, hip, ratio1, ratio2` | 人体成分 PDF 只有体脂百分比、体脂量、骨骼肌量、骨骼肌指数、去脂体重、内脏脂肪等级、腰臀比（`waistHipRatio` 直接填写）、上传检验 |
| `jbxx.diseaseHistory[].years` | 改为 `months` |
| `bsbq.menstrualStage, periodTiming, periodColor, periodAmount, dysmenorrhea` | 月经情况按 PDF 改为 9 项多选，统一放 `menstrualItems` |
| `fzjc.apoa, apob, cholesterol, hdl, ldl, triglyceride` | PDF 辅助检查没有血脂 |
| `fzjc.stool_appearance, stool_rbc_*, stool_wbc_*` | PDF 便常规只有潜血 |
| `treatmentHistory.*[].medication` 等 | 只有西药同时写 `medication`（等于 `name`）。中药汤剂只有开始日期、是否沿用至今、结束日期、停用原因；非药物疗法没有 `dose / unit`；各类都没有 `duration`（非药物的 `duration` 是单次时长） |
| `zlfa.*[].category, instructions` | 页面没有对应输入，西药和中成药传空串 |
| `zlfa.xiyao[] / zhongchengyao[].duration`、`zlfa.feiYaowu[].dose` | 页面没有对应输入，不传 |

## 四、其他请后端注意

1. **图片**：目前没有上传接口，以下字段放的是压缩后的 base64 dataURL（JPEG，最长边 1600px）：
   - 人体成分 `bodyComposition.reportImages[]`
   - 辅助检查 `fzjc.labReportImages[] / ecgReportImages[]`
   - 中药饮片 `zlfa.zhongyaoYinpian[].image`

   对应的 `imageUrl / lab_report_url / ecg_report_url` 为空。如果提供上传接口，前端改为先上传、再填 url。
2. **数值类型**：大部分数值以字符串传，与原结构体一致，例如化验值 `"5.2"`、分数 `"22"`。`smokingYears / drinkingYears / drinkAmount` 为数字，没填时为空串；`psqi.components` 里是数字。
3. **answers 内的取值**：answers 里的值是页面选项的 value。有的是数字字符串，比如 CSI 的 `"0"~"4"`；有的是选项文字，比如 SSS 的 `"0（没有）"`。后端以 `score / result` 为准即可。
4. **日期格式**：一律 `yyyy-MM-dd`。时间（PSQI 上床/起床）格式为 `HH:mm`。

## 五、随访记录

流程：患者列表 → 点患者 → 随访记录（`follow-up-list.html?patientId=&name=&cardno=`）→「新增随访记录」→ 资料页（病史病情、证候判断、辅助检查、病情评估、本次治疗方案、不良反应，顶部可改随访日期）→ 各模块保存同样调用 `case/add`，请求里 `patientId` 为该患者 id、`visitType: "随访"`、第一次无 `id`，后续带返回的 `id`。

- 患者列表接口返回的每个患者需有 `id`（或 `patientId`），前端据此把随访挂到该患者下。
- 随访记录页的历史列表还没有接口，目前只显示「暂无随访记录」；请后端提供「按患者查询病例/随访列表」的接口（以及按 id 查询单次病例详情，用于查看/继续编辑）。

## 六、模块从属（页面层级）

- 基本信息（`jbxx`）及其子模块：CSI-9（`csi`）、压痛点 TPC（`tpc`）、纤维肌痛症状量表 FS（`fs`，下含 WPI `fs.wpi`、SSS `fs.sss`）、间接成本评估（`work`）、人体成分分析（`bodyComposition`）、TIPI-C（`tipi`）、SFFQ（`sffq`）、本病治疗史（`treatmentHistory`）、合并疾病/既往疾病史（`diseaseHistory`）、合并药物（`concomitantMedication`）
- 病史病情（`bsbq`）：无子模块
- 证候判断（`zhpd`）、辅助检查（`fzjc`）：无子模块
- 病情评估（`bqpg`）：9 个量表
- 本次治疗方案（`zlfa`）：西药、中药饮片、中成药、非药物疗法、查看开药汇总
- 不良反应（`blsj`）
