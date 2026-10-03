# 患者列表接口 — patient-list.html

## 1. 页面与调用方

| 项 | 说明 |
|---|---|
| 展示页 | `patient-list.html`（`js/patient-list.js`） |
| 预取页 | `research-platform.html` 点击「纤维肌痛研究数据平台」（`js/research-platform.js`） |
| 公共实现 | `js/fms-api.js` → `FmsApi.fetchPatientList(doctorId)` |

## 2. 接口定义

```
GET /api/fms/patient/list?pageNo=1&pageSize=20&doctorId=5065&researchType=12
```

| 参数 | 类型 | 必填 | 取值 | 说明 |
|---|---|---|---|---|
| pageNo | int | 是 | `1, 2, 3…` | 页码，从 1 开始，上拉滚动时递增 |
| pageSize | int | 是 | `20` | 每页条数，前端常量 `FmsApi.PATIENT_PAGE_SIZE` |
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
| success | boolean | `true` 表示成功（Swagger 示例中的 `false` 只是字段类型示例） |
| data | array | 患者数组 |
| data[].id | number | 患者 ID，跳转随访记录页时带上 |
| data[].name | string | 患者姓名 |
| data[].lastFollowUpDate | string / null | 上次随访（新增记录）日期，格式 `yyyy-MM-dd`；没有随访记录时为 `null` |
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
| 上次新增记录时间：YYYY-MM-DD | `lastFollowUpDate` | 按 `yyyy-MM-dd` 显示；为 `null` 时显示「暂无新增记录」 |
| 已添加 N 条 | `followUpCount` | 为空或非数字时按 0 |

4. 分页（上拉加载更多，即滚动到底部加载下一页）：
   - 进入页面加载第 1 页；列表底部提示栏进入可视区（提前 200px）时请求下一页，结果追加到列表末尾。
   - 是否还有下一页：有 `totalPages` 时按 `pageNo < totalPages`；没有时按「本页条数 = pageSize」判断。`success` 不为 true 时视为没有下一页。
   - 底部提示：`上拉加载更多` / `正在加载...` / `没有更多了` / `加载失败，点击重试`（点击只重试当前这一页，已加载的数据保留）。
   - 第 1 页不足一屏时自动继续加载下一页。
   - 按 `id` 去重，避免翻页期间新增患者导致前后页重复。
   - 第 1 页请求失败显示整页错误和「重新加载」按钮。
5. 搜索：接口没有姓名搜索参数，搜索框在已加载的患者里按姓名做本地包含匹配，不重新请求；还有下一页时继续上拉会加载更多数据参与匹配。
6. 点击患者卡片跳转 `follow-up-list.html?id={id}&name={name}`。

## 4. 进入页面的流程（预取 + 跳转）

```
research-platform.html
  └─ 点击「纤维肌痛研究数据平台」
       ├─ 调用 /api/fms/patient/list（第 1 页）
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

## 5. 已知限制

- 接口没有姓名搜索参数，搜索只覆盖已加载的页。
