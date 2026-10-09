# Fibromyalgia H5

当前使用原生 HTML / CSS / JS 静态多页面。根目录是工作副本，后续直接修改这里的页面和资源。

- `reference-static/`：完整原始备份，保持不变。
- `patient-list.html` → `patient-add.html`：当前已接入的列表和新增入口。
- `css/`、`js/`、各业务目录：完整复制原始结构，页面继续使用原相对路径。
- `src/`：保留之前的 Vue 代码，不再作为当前运行入口。
- 其他页面保留原静态演示内容，尚未完成业务接入。

## 开发

```sh
npm install
npm run dev
```

打开开发地址自动进入 `patient-list.html`。旧 `/#/patients` 和 `/#/patients/add` 入口仍可跳转。
Vite 仅用于开发服务和 `/api` 代理。

医生 ID（doctorId）取值顺序：
1. App 内：`WenwenClass.getUserId()`
2. 老前端菜单跳转带入：`index.html?doctorId=xxx`（`?userId=xxx` 也可以），读到后存入 sessionStorage，同一标签页后续页面沿用；换医生时自动清空上一位医生未提交的病例草稿
3. localhost 本地开发：默认 5065

## 部署

```sh
npm run build
```

将 `dist/` 内容部署到静态服务器；它从根目录的工作副本复制 HTML、CSS、JS 和资源，不依赖 Vue 编译。
也可直接发布根目录中的相同页面和资源目录。无需上传 reference-static、src、node_modules、docs 和工程配置。
服务器必须配置同源 `/api` 反向代理到后端。直接用 file:// 打开无法调用接口。

列表 success:false 暂按空列表显示，新增按钮一直保留。查重失败仍提示错误，不冒充查无患者。
