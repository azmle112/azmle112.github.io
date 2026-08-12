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
    researchMapHint: '从连续视频里的一个问题开始，沿着计算预算走向长期理解。',
    selectedWork: '精选工作',
    selectedWorkHint: '这些工作共同追问一件事：模型该怎样在有限输入里保留足够的结构。',
    allPublications: '查看全部论文',
    ongoingLabel: '正在研究',
    ongoingTitle: '接下来的两个问题',
    ongoingHint: '下面是进行中的方向，只写问题和目标，结果留给实验。',
    updates: '近况',
    writing: '最近在写',
    allNotes: '进入文章归档',
    experience: '经历',
    contactTitle: '一起聊聊这些问题',
    contactBody: '欢迎讨论长视频理解、多模态推理与高效测试时计算。邮件是联系我的最快方式。',
    sourceNote: '履历与论文信息由公开学术页面及本人简历核对。',
    userReported: '本人信息',
    read: '阅读',
    minRead: '阅读',
    latestUpdate: '最近更新',
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
    researchMapHint: 'It starts with one problem in continuous video and follows compute allocation toward lasting understanding.',
    selectedWork: 'Selected work',
    selectedWorkHint: 'These projects ask a shared question: how can a model retain enough structure under a limited input budget?',
    allPublications: 'View all publications',
    ongoingLabel: 'Ongoing',
    ongoingTitle: 'The next two questions',
    ongoingHint: 'These directions are in progress. For now, I state the questions and leave the claims to experiments.',
    updates: 'Updates',
    writing: 'Recent notes',
    allNotes: 'Browse all notes',
    experience: 'Experience',
    contactTitle: 'Let us compare notes',
    contactBody: 'I am happy to discuss long-video understanding, multimodal reasoning, and efficient test-time compute. Email is the quickest way to reach me.',
    sourceNote: 'Biographical and publication details are checked against public academic records and my CV.',
    userReported: 'Personal update',
    read: 'Read',
    minRead: 'read',
    latestUpdate: 'Last updated',
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
