# 导出病历：需要 App 提供的接口

查看病历页（`case-view.html`）底部的「导出病历」按钮会在 H5 里生成 PDF（A4，多页）。H5 在 App 的 WebView 里没法直接把文件存到手机或调起微信分享，所以需要 App 提供一个方法来接收这个 PDF。

## 接口约定

H5 生成 PDF 后，按下面的顺序找可用的方式，找到一个就停：

| 平台 | H5 调用方式 | 参数 |
|---|---|---|
| Android | `window.WenwenClass.sharePdf(base64, fileName)` | `base64`：PDF 文件内容的 Base64 字符串，不带 `data:` 前缀；`fileName`：文件名，如 `张三_CS2026101301_随诊_2026-10-17.pdf` |
| iOS | `window.webkit.messageHandlers.sharePdf.postMessage({ base64, fileName })` | 同上 |

`WenwenClass` 就是 App 现在已经注入、提供 `getUserId()` 的那个对象，只需要在上面加一个 `sharePdf` 方法。

## App 收到后要做的事

1. 把 Base64 解码，用 `fileName` 作为文件名写成 PDF 文件，例如写到 App 的缓存目录。
2. 弹出系统分享面板：Android 用 `Intent.ACTION_SEND` + FileProvider，iOS 用 `UIActivityViewController`。
   用户在面板里可以选「保存到文件 / 存储到手机」，也可以选「微信」等应用转发。

一份病历 PDF 大约 0.5–1.5 MB，对应的 Base64 字符串约 0.7–2 MB。

## App 还没提供这个接口时

- 手机浏览器，以及支持 Web Share 的 WebView：使用系统分享（`navigator.share`）。
- 其他情况：直接下载 PDF 文件。
