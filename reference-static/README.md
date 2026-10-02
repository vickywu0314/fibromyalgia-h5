# APP 内嵌 H5 工程

- 页面不包含顶部导航栏，由 iOS / Android 原生 App 提供导航。
- `css/common.css`：公共样式与移动端适配。
- `js/`：各页面交互逻辑。
- `img/`：图片资源目录（当前页面主要使用内联 SVG，因此为空）。
- `fonts/`：字体资源目录（当前优先使用系统字体，因此为空）。

## 页面
- `research-platform.html` 研究平台
- `patient-list.html` 患者列表
- `patient-add.html` 新增患者
- `patient-detail.html` 患者资料
- `follow-up-list.html` 随访记录

## 移动端适配
保留 `viewport-fit=cover`，支持 iOS safe-area；布局最小支持 320px 宽屏，并对窄屏/平板宽度做响应式处理。
