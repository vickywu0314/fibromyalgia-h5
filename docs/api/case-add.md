# 随诊录入接口（新增 / 修改）— POST /api/fms/patient/case/add

新增和修改是同一个接口：请求体 `id` 为空表示新增随诊，有值表示修改该随诊。各模块页「保存」时调用，**每次只提交一个模块（part）**。

数据结构与查看接口 `/api/fms/patient/case/detail` 完全一致：查看接口返回什么结构，保存就提交什么结构。字段定义见：

- [case-detail.md](case-detail.md)：7 个模块（jbxx 基本信息、bsbq、zhpd、fzjc、bqpg、zlfa、blsj）
- [basic-info-submodules.md](basic-info-submodules.md)：基本信息下的 10 个子模块

## 1. 页面流程

```
入口一：新增患者      patient-add.html（查重）→ patient-detail.html?t=…[&patientId=已有患者ID]
入口二：老患者新随访  follow-up-list.html「新增随访记录」→ patient-detail.html?patientId&name&t=…
入口三：修改已有随诊  follow-up-entry.html「修改本次随诊」→ patient-detail.html?patientId&caseId&name&t=…

patient-detail.html（录入入口，7 个模块 + 完成进度 n/7）
  ├─ 建立录入上下文 sessionStorage.fms_case_edit { token, patientId, caseId, name, visitDate, newPatient }
  ├─ 有随诊 ID 时请求 case/detail（全部 7 个模块），按数据标记模块完成（✓）和进度
  ├─ 点模块 → 模块填写页（不带 mode=view）
  │    ├─ 修改时先请求 case/detail 回显已保存的数据（可编辑）
  │    └─ 保存 → POST case/add（part=该模块）→ 返回随诊 ID 写回上下文 → 返回上一页
  ├─ 从模块页返回时刷新完成情况
  └─「完成本次资料录入」→ 回到该患者的随访记录列表
```

- `t` 标识一次录入：同一次录入里返回入口页会保留第一次保存后得到的随诊 ID；新开一次录入（新的 `t`）会重新开始。
- **新患者**（没有患者 ID）必须先保存「基本信息」：后端用其中的姓名和身份证号建档并返回患者 ID，之后才能保存其他模块。入口页和基本信息页会拦截并提示。
- 新增患者流程会把新增患者页填写的姓名、身份证号自动带入基本信息。
- 不经过录入入口、直接打开模块页时（原型预览），页面保持原来的本地演示行为，不调用接口。

## 2. 请求

```
POST /api/fms/patient/case/add
Content-Type: application/json
```

```json
{
  "id": 20001,
  "patientId": 10001,
  "doctorId": 5065,
  "researchType": 12,
  "visitDate": "2024-09-24",
  "part": "bsbq",
  "bsbq": {
    "systemic": ["肝郁气滞", "焦虑易怒"],
    "stool": "稀溏",
    "finish": true
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | long / null | 否 | 随诊 ID。空 = 新增随诊；有值 = 修改该随诊 |
| patientId | long / null | 否 | 患者 ID。新患者第一次保存（只能是 jbxx）时为空，后端用 `jbxx.name`、`jbxx.idCard` 建档 |
| doctorId | long | 是 | 医生 ID，App 内 `WenwenClass.getUserId()` |
| researchType | int | 是 | 固定 `12`（纤维肌痛） |
| visitDate | string | 是 | 本次随诊日期 yyyy-MM-dd，即随诊列表的 `followUpDate`。保存基本信息时取 `jbxx.visitDate`（本次就诊时间），否则沿用已有值，新随诊默认当天 |
| part | string | 是 | 本次保存的模块代码：`jbxx` / `bsbq` / `zhpd` / `fzjc` / `bqpg` / `zlfa` / `blsj`，与查看接口 `parts` 相同 |
| {part} | object | 是 | 该模块的数据，key 与 `part` 相同 |

### 合并规则（后端）

**以模块内一级 key 为单位覆盖，没有提交的一级 key 保持不变。** 各页面只提交自己负责的部分：

| 页面 | part | 提交内容（`{part}` 下的一级 key） |
|---|---|---|
| 基本信息 `basic-info.html` | jbxx | 基本信息表单字段（visitDate、name、idCard…），不含子模块 |
| 本病治疗史（4 类的添加页） | jbxx | `treatmentHistory`：4 类列表整组提交 |
| 既往疾病史（各疾病类别页） | jbxx | `diseaseHistory`：整个列表 |
| 合并药物 `add.html` | jbxx | `concomitantMedication`：整个列表 |
| CSI / 间接成本 / 人体成分 / TIPI / SFFQ / 压痛点 | jbxx | `csi` / `work` / `bodyComposition` / `tipi` / `sffq` / `tpc` |
| WPI / SSS | jbxx | `fs`：`{ wpi, sss }` 整体（页面先合并另一半已保存的数据） |
| 病史病情 | bsbq | 表单字段 |
| 证候判断 | zhpd | 表单字段 |
| 辅助检查 | fzjc | 表单字段 + `labReportImages`、`ecgReportImages` |
| 病情评估（各量表页） | bqpg | `vas` / `fiqr` / `pcs` / `mfi20` / `psqi` / `had` / `sf12` / `painDetect` / `cfq` 其中一个 |
| 本次治疗方案（各类添加页） | zlfa | `xiyao` / `zhongchengyao` / `zhongyaoYinpian` / `feiYaowu` 其中一类的整个列表 |
| 不良反应 | blsj | 表单字段（选「无」时只提交 `hasAdverseEvent`） |

例：保存 CSI 时提交 `{ "part": "jbxx", "jbxx": { "csi": { "q1": "经常", …, "score": 22, "result": "是", "finish": true } } }`，后端只更新 `jbxx.csi`，基本信息和其他子模块不变。

列表类（治疗史、疾病史、合并药物、治疗方案）每次新增、修改、选「无」清空后都整组提交，后端直接替换该列表。

### 字段取值约定

与查看接口相同：字段名 = 页面控件 `name`；单选 / 下拉为选项值；多选为数组（key 不带 `[]`）；日期 yyyy-MM-dd；数字输入框为 number；图片为 URL 数组；没填的字段不提交。

### finish、score、result

- `finish: true`：每个表单对象、每个量表、`treatmentHistory` 在保存时都带上，表示该部分已保存。页面以「有数据」判断完成，`finish` 供后端统计。
- `score`、`result`：目前只有 CSI-9 由页面计算（9 题全答时：从不 0 / 很少 1 / 有时 2 / 经常 3 / 总是 4 求和，`score > 18` 时 `result` 为「是」，否则「否」）。其他量表只提交各题答案，评分由后端按答案计算；如需页面计算再补。

## 3. 返回

```json
{ "success": true, "message": "", "data": { "id": 20001, "patientId": 10001 } }
```

| 字段 | 说明 |
|---|---|
| success | `true` 表示保存成功 |
| message | 失败原因，页面直接提示 |
| data.id | 随诊 ID（新增时为新生成的 ID），页面写回录入上下文，后续保存带上 |
| data.patientId | 患者 ID（新患者建档后返回） |

失败时页面停留在当前页并提示 `message`，不跳转、不丢失已填内容。

## 4. 图片上传 — POST /api/fms/file/upload

辅助检查报告、心电图报告、人体成分报告、中药处方图片在选择后立即上传，保存时只提交 URL。

```
POST /api/fms/file/upload
Content-Type: multipart/form-data   字段名 file
```

```json
{ "success": true, "data": { "url": "https://…/xxx.jpg" } }
```

页面限制：JPG / PNG / GIF，单张不超过 5MB。中药处方图片页面会先压缩（最长边 1600px）再上传。

## 5. 与后端示例请求体的字段对照

按此前已定义的规则（与查看接口一致）修正了后端示例中的 key，后端请按左列实现：

| 位置 | 采用 | 示例中的写法 | 说明 |
|---|---|---|---|
| 顶层 | （去掉） | `page` | 与保存无关 |
| 顶层 | `part: "bsbq"` | `part: "part_bsbq"` | 与查看接口 `parts` 的模块代码一致 |
| bsbq | `systemic`、`menstrualItems` | `systemic[]`、`menstrualItems[]` | 多选 key 不带 `[]` |
| fzjc | `labReportImages`、`ecgReportImages`（数组） | `lab_report_url`、`ecg_report_url` | 可上传多张 |
| jbxx | `idCard` | `cardNo` | 页面字段名 |
| jbxx | `phone` | `mobile` | 同上 |
| jbxx | `marriage` | `marry` | 同上 |
| jbxx | `visitDate`（本次就诊时间） | 缺 | 补充 |
| jbxx | `hospitalLevel`：1级 / 2级 / 3级 / 无级别 | `三级甲等` | 取页面选项 |
| jbxx | `workStatus`：在职人员 / 退休人员 / 家庭主妇 / 无业人员 / 其他 | `在职` | 取页面选项 |
| jbxx | 子模块直接放在 jbxx 下 | `jbxx.ext.*` | 与查看接口一致，去掉 ext 一层 |
| jbxx | `treatmentHistory`（含 `xiyao`） | `ext.benbingTreatment`（缺西药） | 4 类：xiyao / zhongyaoTangji / feiYaowuLiaofa / zhongchengyao；西药名称字段为 `medication` |
| jbxx | `diseaseHistory` | `ext.pastDiseases` | `years` 为 number |
| jbxx | `concomitantMedication: [{ name }]` | `ext.concomitantDrugs: ["…"]` | |
| jbxx | `csi` | `ext.csi9` | 含 q1–q9 答案 + score + result |
| jbxx | `fs: { wpi, sss }` | `ext.wpi`、`ext.sss`、`ext.fs` | WPI、SSS 归在 FS 下 |
| jbxx | `bodyComposition` 用页面字段：bodyFatPercentage、bodyFatMass、skeletalMuscleMass、skeletalMuscleIndex、leanBodyMass、visceralFatLevel、ratio1、ratio2、reportImages | height、weight、bmi、waist、hip、waistHipRatio、imageUrl | 页面没有身高体重等项 |
| jbxx | 各量表提交全部题目答案（+ finish，CSI 另有 score、result） | 只有 `finish`、`result`、`score` | 只有分数无法回显和查看 |
| bqpg | 各量表提交全部题目答案 + finish | 只有 `finish`、`result`、`score` | 同上 |
| zlfa | `xiyao`、`zhongchengyao`、`zhongyaoYinpian`、`feiYaowu` | `chengyaoList`、`tjList`、`fywlfTxtList` | 字段见 case-detail.md 第 8 节；示例中的 company、drugDelivery、parts 等页面没有的项不提交 |
| jbxx | `signature` | `signature` | 保留：患者知情同意签字图片 URL，由 App 原生签字组件提供 |
