import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const githubOwner = process.env.GITHUB_REPOSITORY_OWNER;
const site = process.env.SITE_URL || (githubOwner ? `https://${githubOwner}.github.io` : 'http://localhost:4321');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
