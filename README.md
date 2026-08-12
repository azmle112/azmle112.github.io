# 陈旺个人主页

基于 Astro 的静态学术主页，默认中文，提供完整英文版和可持续维护的 Markdown 博客。构建产物可直接部署到 GitHub Pages。

## 本地运行

```powershell
pnpm install
pnpm dev
```

当前开发服务器默认访问 `http://127.0.0.1:4321/`。

生产构建：

```powershell
pnpm build
pnpm preview
```

## 更新内容

- 个人资料和论文：`src/data/profile.ts`
- 中文博客：`src/content/blog/zh/`
- 英文博客：`src/content/blog/en/`
- 头像与论文图：`public/images/`
- 公开简历：`public/files/cv-zh.pdf`
- 原始资料留档：`archive/source/`
- 公开简历生成器：`archive/scripts/create_public_cv.py`（需要 Python 与 `reportlab`）

新增博客时复制一篇 Markdown，修改 frontmatter 中的 `title`、`description`、`pubDate`、`tags`、`lang` 与 `translationKey`。中文文章发布在 `/blog/<slug>/`，英文文章发布在 `/en/blog/<slug>/`。

## GitHub Pages

1. 将仓库推送到 GitHub，默认分支为 `main`。
2. 在仓库 Settings > Pages 中选择 GitHub Actions。
3. 工作流会从 GitHub 账户名生成 `https://username.github.io`。若使用自定义域名，在 Actions 中设置 `SITE_URL`。
4. 推送后 `.github/workflows/deploy.yml` 会自动构建并发布。

当前部署按 `username.github.io` 用户主页仓库配置。若改用项目仓库路径，还需在 `astro.config.mjs` 配置 `base`，并同步站内链接前缀。
