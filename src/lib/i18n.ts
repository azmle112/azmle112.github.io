import type { Locale } from '../data/profile';

const messages = {
  zh: {
    home: '首页',
    research: '研究',
    publications: '论文',
    notes: '文章',
    about: '关于',
    nav: '打开导航',
    close: '关闭导航',
    skip: '跳至正文',
    scholar: 'Google Scholar',
    email: '邮件',
    cv: '中文简历',
    orcid: 'ORCID',
    lab: 'MAC 实验室',
    profileLabel: '关于我',
    visionLabel: '研究愿景',
    researchMap: '一条正在形成的研究路线',
    researchMapHint: '从连续视频里的事件结构出发，让生成提出候选，再让证据完成核验。',
    selectedWork: '精选工作',
    selectedWorkHint: '这些工作从不同尺度保留视频里的事件、边界与查询线索，也构成下一步研究的证据基础。',
    allPublications: '查看全部论文',
    ongoingLabel: '正在研究',
    ongoingTitle: '正在追问的两个问题',
    ongoingHint: '下面是进行中的方向，只写问题和目标，结果留给实验。',
    updates: '近况',
    writing: '最近在写',
    allNotes: '进入文章归档',
    experience: '经历',
    contactTitle: '一起聊聊这些问题',
    contactBody: '欢迎讨论长视频理解、多模态推理，以及生成怎样帮助模型理解世界。邮件是联系我的最快方式。',
    read: '阅读',
    minRead: '阅读',
    latestUpdate: '最近更新',
    siteUpdated: '网站更新',
    siteViews: '访问量',
    siteVisitors: '访客',
    pageViews: '本文阅读',
  },
  en: {
    home: 'Home',
    research: 'Research',
    publications: 'Publications',
    notes: 'Notes',
    about: 'About',
    nav: 'Open navigation',
    close: 'Close navigation',
    skip: 'Skip to content',
    scholar: 'Google Scholar',
    email: 'Email',
    cv: 'CV in Chinese',
    orcid: 'ORCID',
    lab: 'MAC Lab',
    profileLabel: 'About',
    visionLabel: 'Research vision',
    researchMap: 'A research path taking shape',
    researchMapHint: 'Start from event structure in continuous video, let generation propose candidates, and let evidence test them.',
    selectedWork: 'Selected work',
    selectedWorkHint: 'These projects preserve events, boundaries, and query cues at different scales, providing the evidence base for what comes next.',
    allPublications: 'View all publications',
    ongoingLabel: 'Ongoing',
    ongoingTitle: 'Two questions I am pursuing',
    ongoingHint: 'These directions are in progress. For now, I state the questions and leave the claims to experiments.',
    updates: 'Updates',
    writing: 'Recent notes',
    allNotes: 'Browse all notes',
    experience: 'Experience',
    contactTitle: 'Let us compare notes',
    contactBody: 'I am happy to discuss long-video understanding, multimodal reasoning, and how generation can help a model understand the world. Email is the quickest way to reach me.',
    read: 'Read',
    minRead: 'read',
    latestUpdate: 'Last updated',
    siteUpdated: 'Site updated',
    siteViews: 'Views',
    siteVisitors: 'Visitors',
    pageViews: 'Article views',
  },
} as const;

export function t(locale: Locale) {
  return messages[locale];
}

export function localize<T extends { zh: string; en: string }>(value: T, locale: Locale) {
  return value[locale];
}

export function localePath(locale: Locale, path = '/') {
  if (locale === 'zh') return path;
  if (path === '/') return '/en/';
  return `/en${path}`;
}

export function alternatePath(locale: Locale, pathname: string) {
  if (locale === 'zh') return pathname === '/' ? '/en/' : `/en${pathname}`;
  const withoutPrefix = pathname.replace(/^\/en/, '');
  return withoutPrefix || '/';
}

export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? '2-digit' : 'short',
    day: '2-digit',
  }).format(date);
}
