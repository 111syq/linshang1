# 临商银行“十五五”战略规划任务管理平台 Demo

本项目为纯前端 Demo。PC 端数据保存在浏览器 localStorage，微信小程序数据保存在微信本地存储，小程序风格网页预览数据保存在浏览器本地存储。各客户端的数据彼此独立，不支持实时同步，不适用于真实银行生产业务。

## 项目简介

- PC Web 演示版：战略执行驾驶舱、任务管理、举措填报、完成标准跟踪、模拟审核、指标监控、系统建设清单、报表导入导出。
- 微信小程序 Demo：原生小程序目录，十二角色登录、首页分流、任务详情页签、举措逐项填报、指标和我的页面。
- 小程序风格网页预览：手机宽度布局、底部 Tab、移动端卡片、底部弹层、触屏填报表单，用网站方式快速预览小程序体验。
- 数据来源：`docs/source/临商银行十五五战略规划.xlsx` 与 `docs/source/临商银行十五五战略规划任务卡片.docx`。

## Demo 模式说明

系统不建设后端，不连接数据库，不调用真实接口，不接入微信登录、企业微信、对象存储、短信、邮件或消息推送。附件仅登记文件名，不上传到服务器。

显著提示文案为：“当前系统为演示版本，数据仅保存在本机，不支持多端同步。”

## 启动命令

```bash
npm run import:data
npm run dev
```

本地预览：

- PC Web：`http://localhost:4173/`
- 小程序风格网页：`http://localhost:4173/mini.html`

## 构建与测试

```bash
npm run build
npm run test
```

构建产物位于 `dist/`，可直接静态发布。

## 数据导入

```bash
npm run import:data
```

导入脚本会生成：

- `public/data/tasks.json`
- `public/data/indicators.json`
- `public/data/systems.json`
- `public/data/departments.json`
- `public/data/demo-users.json`
- `public/data/import-report.json`
- `miniprogram/data/*.js`，供原生微信小程序 Demo 读取。

## 演示账号

统一密码：`Linshang@2026`

- `strategy` / 战略部门
- `corporate` / 公司业务部门
- `retail` / 零售金融部门
- `inclusive` / 普惠金融部门
- `market` / 金融市场部门
- `risk` / 风险合规部门
- `digital` / 数字科技部门
- `finance` / 计划财务部门
- `hr` / 人力资源部门
- `governance` / 公司治理与综合管理部门
- `audit` / 监督审计部门
- `branch` / 分支机构

## 恢复演示数据

PC 端在顶部或“报表导出”中点击“恢复演示数据”。小程序和小程序风格网页在“我的”页面点击“恢复演示数据”。恢复会清除当前设备本地修改，重新加载项目内置静态数据。

## Netlify 发布步骤

1. 执行 `npm run build`。
2. Netlify Build command 使用 `npm run build`。
3. Publish directory 使用 `dist`。
4. `netlify.toml` 已配置 SPA 重定向，刷新页面不会 404。

## 微信小程序导入步骤

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本仓库下的 `miniprogram/`。
4. AppID 使用测试号或 `touristappid` 占位配置。
5. 不需要配置服务器域名，不使用云开发，不发起网络请求。

## 小程序风格网页说明

`mini.html` 用于在浏览器快速预览小程序式布局；真实微信小程序 Demo 位于 `miniprogram/`。

## 已知限制

- 本项目仅用于演示，不适用于真实银行生产业务。
- PC、微信小程序和小程序风格网页的数据互不同步。
- 清除浏览器缓存、更换设备或更换浏览器后，本地修改可能丢失。
- Excel 导出以 CSV 兼容方式提供，可用 Excel 打开。
- 附件只记录文件名和演示信息，不上传、不保存真实文件内容。
