# 患者随诊列表接口 — follow-up-list.html

## 1. 页面与调用方

| 项 | 说明 |
|---|---|
| 展示页 | `follow-up-list.html`（`js/follow-up-list.js`） |
| 入口 | `patient-list.html` 点击患者卡片 → `follow-up-list.html?id={患者ID}&name={患者姓名}` |
| 出口 | 点击随访卡片 → `follow-up-entry.html?patientId={患者ID}&followUpId={随诊ID}&name={患者姓名}&date={随访日期}`（录入开始页） |
| 公共实现 | `js/fms-api.js` → `FmsApi.fetchFollowUpList(doctorId, patientId, pageNo)`；分页加载 `js/paged-list.js` |

## 2. 接口定义

```
GET /api/fms/patient/followup/list?pageNo=1&pageSize=20&patientId={患者ID}&doctorId={医生ID}&researchType=12
```

| 参数 | 类型 | 必填 | 取值 | 说明 |
|---|---|---|---|---|
| pageNo | integer | 是 | `1, 2, 3…` | 页码，从 1 开始，上拉滚动时递增 |
| pageSize | integer | 是 | `20` | 每页条数，前端常量 `FmsApi.FOLLOW_UP_PAGE_SIZE` |
| patientId | long | 是 | URL 参数 `id` | 患者 ID，来自患者列表的 `data[].id` |
| doctorId | long | 是 | App 内 `WenwenClass.getUserId()`；localhost 开发为 `5065` | 医生 ID |
| researchType | long | 是 | `12` | 研究平台，12 = 纤维肌痛 |

- 请求走同源 `/api` 反向代理，携带 cookie，请求头 `X-Requested-With: XMLHttpRequest`，超时 10 秒。
- URL 缺少患者 ID 时不发请求，提示「缺少患者信息，请从患者列表进入」。取不到 doctorId 时提示「未取得医生身份，请在 App 内打开」。

### 返回

后端返回 List 序列化后的 JSON 数组，结构与患者列表接口一致：

```json
{
  "success": true,
  "message": "",
  "data": [
    { "id": 1001, "followUpDate": "2020-10-15" },
    { "id": 1000, "followUpDate": "2020-09-15" }
  ],
  "totalPages": 1,
  "totalCount": 2
}
```

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| success | boolean | 是 | `true` 表示成功 |
| message | string | 否 | 失败原因 |
| data | array | 是 | 随诊记录数组 |
| data[].id | long | 是 | 随诊 ID，进入录入开始页及各录入模块时使用 |
| data[].followUpDate | string | 是 | 随访日期，格式 `yyyy-MM-dd` |
| totalPages | number | 是 | 总页数，用于判断是否还有下一页 |
| totalCount | number | 是 | 总条数 |

**排序：后端按 `followUpDate` 倒序（最新在前），同一天按 `id` 倒序。** 分页时只有后端排序才能保证跨页顺序正确；前端对已加载的数据再按同样规则排一次，作为兜底。

建议后端补充（前端暂未使用，后续页面可能需要）：

| 字段 | 说明 |
|---|---|
| createTime | 记录创建时间，日期相同时可用于排序 |
| status | 填写状态（如 0 未完成 / 1 已完成），列表可显示「未完成」标记 |

## 3. 前端解析规则

1. 只有 `success === true` 且 `data` 是数组时才解析；其他情况按空列表处理，「新增随访记录」按钮一直保留。
2. HTTP 非 2xx、网络异常或超时视为请求失败：第 1 页失败显示整页错误和「重新加载」；后续页失败在底部显示「加载失败，点击重试」。
3. 页面展示：

| 页面展示 | 来源字段 | 规则 |
|---|---|---|
| 随访日期 | `followUpDate` | 按 `yyyy-MM-dd` 显示；为空显示「日期未填写」 |
| 点击卡片 | `id` | 作为 `followUpId` 带到录入开始页 |

4. 分页（上拉加载更多）：规则同患者列表 —— 滚动到底部前 200px 加载下一页；按 `pageNo < totalPages` 判断是否还有下一页；按 `id` 去重；不足一屏自动续载。底部提示：`上拉加载更多` / `正在加载...` / `没有更多了` / `加载失败，点击重试`。
5. 空列表显示「暂无随访记录，可点击下方按钮新增」。
