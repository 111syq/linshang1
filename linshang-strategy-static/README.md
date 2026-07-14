# 临商银行“十五五”战略规划任务管理平台静态展示版

这是纯静态网页版本，不包含后端程序、数据库、API 路由、服务端函数或真实登录鉴权。

当前版本支持：

- 进入页面先显示登录页
- 战略部门进入全行战略驾驶舱
- 战略部门包含进度审核、部门填报监控、风险预警、待协调事项、待决策事项、系统建设项目、通知与催办、操作记录等管理菜单
- 其他部门进入各自部门工作台
- 部门工作台包含“由我牵头”“我的协同任务”“进度填报”
- 驾驶舱包含统计周期、数据更新时间、异常指标、趋势图、部门对比和部门执行表
- 任务卡支持查看、编辑和导出
- 编辑和进度填报仅保存到当前浏览器本地，支撑附件仅展示文件名，不会上传

## 文件说明

- `index.html`：页面主体
- `assets/styles.css`：页面样式
- `assets/app.js`：前端交互与演示数据
- `netlify.toml`：Netlify 静态站点配置
- `_redirects`：单页静态路由回退

## GitHub 需要上传的文件

上传整个 `linshang-strategy-static` 目录内的以下文件即可：

- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `netlify.toml`
- `_redirects`
- `README.md`

不要上传 Next.js、Node 服务、数据库、API 或其他后端程序。

## Netlify 部署

如果 GitHub 仓库根目录就是本目录：

- Build command: `echo Static site ready`
- Publish directory: `.`

如果本目录放在仓库子目录：

- Base directory: `linshang-strategy-static`
- Build command: `echo Static site ready`
- Publish directory: `.`

## 本地预览

在本目录运行：

```bash
python3 -m http.server 3100
```

然后打开：

```text
http://127.0.0.1:3100
```
