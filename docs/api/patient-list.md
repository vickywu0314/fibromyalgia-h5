# 患者列表接口 — patient-list.html

## 1. 页面与调用方

| 项 | 说明 |
|---|---|
| 展示页 | `patient-list.html`（`js/patient-list.js`） |
| 预取页 | `research-platform.html` 点击「纤维肌痛研究数据平台」（`js/research-platform.js`） |
| 公共实现 | `js/fms-api.js` → `FmsApi.fetchPatientList(doctorId)` |

## 2. 接口定义

```
GET /api/fms/patient/list?pageNo=1&pageSize=100&doctorId=5065&researchType=12
```

| 参数 | 类型 | 必填 | 取值 | 说明 |
|---|---|---|---|---|
| pageNo | int | 是 | `1` | 页码，从 1 开始 |
| pageSize | int | 是 | `100` | 每页条数，当前固定 100、只取第一页 |
| doctorId | string | 是 | App 内 `WenwenClass.getUserId()`；localhost 开发为 `5065` | 当前医生 ID |
| researchType | int | 是 | `12` | 研究类型，12 = 纤维肌痛 |

- 请求走同源 `/api` 反向代理，携带 cookie（`credentials: include`），请求头 `X-Requested-With: XMLHttpRequest`。
- 超时 10 秒。
- 取不到 doctorId 时不发请求，页面提示「未取得医生身份，请在 App 内打开」。

### 返回

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "test", "lastFollowUpDate": null, "followUpCount": 0 }
  ],
  "totalPages": 1,
  "totalCount": 1
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| success | boolean | 是否成功 |
| data | array | 患者数组 |
| data[].id | number | 患者 ID，跳转随访记录页时带上 |
| data[].name | string | 患者姓名 |
| data[].lastFollowUpDate | string / number / null | 上次随访（新增记录）日期 |
| data[].followUpCount | number | 该患者累计随访次数 |
| totalPages | number | 总页数 |
| totalCount | number | 总条数 |

## 3. 前端解析规则

1. 只有 `success === true` 且 `data` 是数组时才解析 `data`；其他情况按空列表处理，「新增患者资料」按钮一直保留。
2. HTTP 非 2xx、网络异常或超时视为请求失败，显示错误和「重新加载」按钮，不当作空列表。
3. 字段映射：

| 页面展示 | 来源字段 | 规则 |
|---|---|---|
| 患者姓名 | `name` | 为空时显示「未命名患者」 |
| 上次新增记录时间：YYYY-MM-DD | `lastFollowUpDate` | 统一转成 `年-月-日`；支持 `2020-11-04`、`2020-11-04 10:20:30`、ISO 字符串和毫秒时间戳。为 `null` 或无法解析时显示「暂无新增记录」 |
| 已添加 N 条 | `followUpCount` | 为空或非数字时按 0 |

4. 搜索：接口没有姓名搜索参数，搜索框在已取回的列表里按姓名做本地包含匹配，不重新请求。
5. 点击患者卡片跳转 `follow-up-list.html?id={id}&name={name}`。

## 4. 进入页面的流程（预取 + 跳转）

```
research-platform.html
  └─ 点击「纤维肌痛研究数据平台」
       ├─ 调用 /api/fms/patient/list
       ├─ 成功：把解析后的列表写入 sessionStorage.fms_patient_list_prefetch
       │       { doctorId, savedAt, list }
       └─ 无论成功失败都跳转 patient-list.html
patient-list.html
  ├─ 读取并立刻删除 sessionStorage.fms_patient_list_prefetch
  ├─ 同一 doctorId 且写入不超过 60 秒 → 直接渲染，不再请求
  └─ 否则（直接打开、刷新、返回、预取失败）→ 自己调用接口
```

- 预取数据只用一次，刷新或从后续页面返回列表时都会重新请求，保证数据是最新的。
- 数据放在 sessionStorage，不放在 URL，避免患者信息出现在地址栏和日志里。

## 5. 已知限制 / 待确认

- 只取第一页 100 条；`totalCount > 100` 时超出部分不会显示，需要时再加分页或滚动加载。
- 示例响应中 `success` 为 `false` 但带有数据，需要和后端确认成功时是否返回 `true`；前端目前严格按 `success === true` 解析。
- `lastFollowUpDate` 的具体格式需要后端确认，前端已兼容常见格式。
