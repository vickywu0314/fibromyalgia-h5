# 导出病历：需要 App 提供的接口

查看病历页（`case-view.html`）底部的「导出病历」按钮会在 H5 里生成 PDF（A4，多页，标题「中枢敏化疼痛系统患者病历」）。病例内容取自后端 `case/detail` 接口（服务器上已保存的数据；还没保存过的新病例用本地草稿），后端不需要新增接口。

生成后会**保存**这个 PDF（只保存，不分享），然后立即打开全屏预览；预览顶部的「保存」按钮可以再保存一次。

H5 在 App 的 WebView 里没法直接把文件写到手机，所以需要 App 提供一个保存方法。

## 接口约定

| 平台 | H5 调用方式 | 参数 |
|---|---|---|
| Android | `window.WenwenClass.savePdf(base64, fileName)` | `base64`：PDF 文件内容的 Base64 字符串，不带 `data:` 前缀；`fileName`：文件名，如 `张三_CS2026101301_随诊_2026-10-17.pdf` |
| iOS | `window.webkit.messageHandlers.savePdf.postMessage({ base64, fileName })` | 同上 |

`WenwenClass` 就是 App 现在已经注入、提供 `getUserId()` 的那个对象，只需要在上面加一个 `savePdf` 方法。

## App 收到后要做的事

把 Base64 解码，用 `fileName` 作为文件名保存成 PDF：
- Android：保存到「下载」目录（Download），可以用 MediaStore；
- iOS：保存到「文件」App 里 App 自己的文件夹，或者用文件导出面板让用户选择保存位置。

保存完成后，最好给用户一个「已保存到 …」的提示。

一份病历 PDF 大约 0.5–1.5 MB，对应的 Base64 字符串约 0.7–2 MB。

## App 还没提供这个接口时

浏览器里直接下载 PDF 文件。在 App 里点「保存」大概率没有反应，但预览可以正常查看。
