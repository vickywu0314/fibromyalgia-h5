# 随诊详情接口（查看模式）— follow-up-entry.html 及各模块页

## 1. 页面流程

```
follow-up-list.html 点击某条随访
  └─ follow-up-entry.html?patientId={患者ID}&followUpId={随诊ID}&name={姓名}&date={随访日期}
       └─ 点击 7 个模块之一
            ├─ 请求 /api/fms/patient/case/detail?parts={模块代码}
            ├─ 成功：数据写入 sessionStorage.fms_case_detail_prefetch { caseId, part, savedAt, data }
            └─ 跳转 {模块页}?patientId={患者ID}&caseId={随诊ID}&mode=view
                 ├─ 读取并删除预取数据（同一随诊、同一模块、60 秒内有效）
                 ├─ 没有预取数据（刷新、预取失败）→ 模块页自己请求
                 └─ 按字段名回显到表单，全部控件只读
```

- 查看模式由 URL 参数 `mode=view` 开启；不带该参数时模块页仍是原来的填写页。
- 查看模式下隐藏填写进度条和「保存并返回」按钮；输入框、单选、多选、下拉全部禁用。
- 基本信息页的「患者评估与病史」子模块入口在查看模式下仍可点击。
- 公共实现：`js/case-view.js`（`CaseView.fetchPart / init / fill`），样式 `css/case-view.css`。

## 2. 接口定义

```
GET /api/fms/patient/case/detail?patientId={患者ID}&doctorId={医生ID}&caseId={随诊ID}&parts={模块代码}
```

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| patientId | long | 是 | 患者 ID |
| doctorId | long | 是 | 医生 ID，App 内 `WenwenClass.getUserId()`，localhost 开发为 `5065` |
| caseId | long | 是 | 随诊 ID，即随诊列表的 `data[].id` |
| parts | string | 是 | 模块代码，多个用逗号分隔；页面每次只传一个 |

| 模块代码 | 模块 | 页面 |
|---|---|---|
| jbxx | 基本信息 | `fibromyalgia-basic-info/basic-info.html` |
| bsbq | 病史病情 | `fibromyalgia-condition-history/condition-history.html` |
| zhpd | 证候判断 | `fibromyalgia-syndrome-differentiation/syndrome-differentiation.html` |
| fzjc | 辅助检查 | `fibromyalgia-auxiliary-exam/auxiliary-exam.html` |
| bqpg | 病情评估 | `bingqing-pinggu/index.html` |
| zlfa | 本次治疗方案 | `zhiliao-fangan/index.html` |
| blsj | 不良反应 | `fibromyalgia-adverse-reaction/adverse-reaction.html` |

### 返回

```json
{
  "success": true,
  "message": "",
  "data": {
    "jbxx": { "visitDate": "2024-05-10", "name": "张三", "gender": "女" }
  }
}
```

- `data` 中以模块代码为 key，只返回请求的模块。
- `success` 不为 `true` 时，页面显示 `message`（没有则显示「随诊详情加载失败，请稍后重试」）。
- 该随诊尚未填写某模块时，返回空对象 `{}` 或不返回该 key，页面显示空表单。

### 字段约定（所有模块通用）

- **字段名与页面表单控件的 `name` 一致**（多选控件的 `name[]` 去掉 `[]`）。
- 单选、下拉：返回选项的显示文字（即控件 `value`），如 `"女"`、`"3级"`。
- 多选：返回字符串数组，如 `["肝郁气滞", "焦虑易怒"]`。
- 日期：`yyyy-MM-dd`。
- 数字：number。
- 没有填写的字段返回 `null` 或不返回。

## 3. jbxx 基本信息

| 字段 | 类型 | 页面项 | 取值 |
|---|---|---|---|
| visitDate | string | 本次就诊时间 | yyyy-MM-dd |
| name | string | 姓名 | |
| idCard | string | 身份证号 | 15 或 18 位 |
| phone | string | 手机号 | |
| gender | string | 性别 | 男 / 女 |
| province | string | 常住地（省） | 省级行政区全称，如「四川省」 |
| marriage | string | 婚姻 | 已婚 / 未婚 / 离婚 / 丧偶 |
| education | string | 教育程度 | 未上过学 / 小学 / 初中 / 高中/中专 / 大专 / 本科 / 硕士及以上 |
| workStatus | string | 工作情况 | 在职人员 / 退休人员 / 家庭主妇 / 无业人员 / 其他 |
| smoking | string | 吸烟史 | 无或偶尔有 / 经常有 |
| smokingYears | number | 吸烟年数 | smoking 为「经常有」时 |
| smokingAmount | string | 每日吸烟量 | 10支以下 / 10-20支 / 20支及以上 |
| drinking | string | 饮酒史 | 无或偶尔有 / 经常有 |
| drinkingYears | number | 饮酒年数 | drinking 为「经常有」时 |
| drinkType | string | 每日饮酒种类 | 白酒 / 啤酒 / 红酒 |
| drinkAmount | number | 每天用量（ml） | |
| painOnsetDate | string | 周身疼痛发病时间 | yyyy-MM-dd |
| diagnosed | string | 是否曾确诊纤维肌痛综合征 | 是 / 否 |
| diagnosisDate | string | 确诊时间 | yyyy-MM-dd，diagnosed 为「是」时 |
| hospitalLevel | string | 确诊医疗机构级别 | 1级 / 2级 / 3级 / 无级别 |

「患者评估与病史」10 个子模块和「患者知情同意签署」不在本表内，单独定义。

## 4. bsbq 病史病情

| 字段 | 类型 | 页面项 | 取值 |
|---|---|---|---|
| systemic | string[] | 1. 全身症状（多选） | 证型：肝郁气滞 / 寒湿痹阻 / 痰热扰心 / 肝肾不足；症状：焦虑易怒、胸胁胀闷或刺、寐差多梦、脘闷嗳气、腹痛、不思饮食、疲乏无力、四肢重着无力、每遇寒则冷痛、惊悸不安、口苦心烦、头痛失眠、渴喜冷饮、性情急躁、反复梦魇、恶心纳呆、肌肉无力、腰膝酸软，劳累加重、筋缩，手足不遂、畏寒肢冷、肢体麻木、失眠健忘 |
| stool | string | 大便 | 稀溏 / 便秘 / 粘滞 / 无力 / 正常 |
| urine | string | 小便 | 黄 / 热 / 清长 / 夜尿频 / 无力 / 正常 |
| tongueColor | string | 舌色 | 淡红 / 淡白 / 红 / 绛 / 紫 / 暗 |
| tongueShape | string | 舌形 | 苍老 / 娇嫩 / 胖大 / 瘦薄 / 芒刺 / 裂纹 / 齿痕 / 正常 |
| coatColor | string | 苔色 | 白 / 黄 / 灰 / 黑 / 黄白相间 |
| coatShape | string | 苔质 | 厚 / 薄 / 润 / 滑 / 燥 / 腐 / 腻 / 剥 / 无 |
| menstrualStage | string | 月经分期 | 分绝经期 / 围绝经期 / 育龄期 |
| menstrualItems | string[] | 月经情况项目（多选） | 经期 / 经色 / 经量 / 痛经 |
| periodTiming | string | 经期 | 月经先期 / 月经后期 / 月经先后不定期 / 经期延长 / 正常 |
| periodColor | string | 经色 | 淡红 / 深红 / 紫暗 / 正常 |
| periodAmount | string | 经量 | 月经过多 / 月经过少 / 正常 |
| dysmenorrhea | string | 痛经 | 有 / 无 |

## 5. zhpd 证候判断

| 字段 | 类型 | 页面项 | 取值 |
|---|---|---|---|
| mainSyndrome | string | 主证 | 肝郁气滞证 / 寒湿痹阻证 / 痰热扰心证 / 肝肾不足证 |
| hasSecondary | string | 是否有兼证 | 是 / 否 |
| secondarySyndrome | string | 兼证 | 同主证选项；hasSecondary 为「否」时为 null |
