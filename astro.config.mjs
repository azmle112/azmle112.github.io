import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';

const githubOwner = process.env.GITHUB_REPOSITORY_OWNER;
const site = process.env.SITE_URL || (githubOwner ? `https://${githubOwner}.github.io` : 'https://azmle112.github.io');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { throwOnError: true, strict: 'error' }]],
    }),
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
