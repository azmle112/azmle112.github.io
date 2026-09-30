export type Locale = 'zh' | 'en';

export type Localized = {
  zh: string;
  en: string;
};

export const links = {
  email: 'mailto:cw501907@gmail.com',
  scholar: 'https://scholar.google.com/citations?user=POf8d3UAAAAJ&hl=en',
  orcid: 'https://orcid.org/0009-0005-2574-5230',
  lab: 'https://mac.xmu.edu.cn/',
  liujuanCao: 'https://mac.xmu.edu.cn/ljcao/',
  xiawuZheng: 'https://zhengxiawu.github.io/',
  wechat: 'https://mp.weixin.qq.com/s/kKNY5tE6aczIX5T0UglUwQ',
};

export const profile = {
  name: { zh: '陈旺', en: 'Wang Chen' },
  nameLatin: 'Wang Chen',
  title: {
    zh: '厦门大学 MAC 实验室一年级博士生',
    en: 'First-year PhD student at MAC Lab, Xiamen University',
  },
  intro: {
    zh: '陈旺，厦门大学 MAC 实验室一年级博士生，研究长时程视觉理解与多模态模型。',
    en: 'Wang Chen is a first-year PhD student at MAC Lab, Xiamen University, working on long-horizon visual understanding and multimodal models.',
  },
  visionTitle: {
    zh: '长时程视觉理解与世界建模',
    en: 'Long-horizon visual understanding and world modeling',
  },
  researchIntro: {
    zh: '我的研究聚焦于长时程视觉理解与多模态模型。我关注视觉系统如何在有限的计算与记忆资源下，选择重要观测、维护长期状态，并从持续的视频流中理解对象、事件及其关系。',
    en: 'My research focuses on long-horizon visual understanding and multimodal models. I study how visual systems can select informative observations and maintain state over time, so they can understand objects, events, and their relationships in continuous video streams under limited compute and memory.',
  },
  vision: {
    zh: '在此基础上，我希望进一步探索视觉理解与世界建模之间的联系：从理解已经发生的事件，走向建模环境如何随时间变化，并利用预测辅助感知与推理。长期目标是研究能够持续观察、持续更新、持续推理的视觉智能系统，使模型随着新的观测不断修正和丰富其对世界的认识。',
    en: 'Building on this work, I want to explore the connection between visual understanding and world modeling: how a system can move from interpreting past events to modeling how its environment changes, and use prediction to support perception and reasoning. My long-term goal is visual intelligence that observes, updates, and reasons continuously, revising and enriching its understanding of the world as new evidence arrives.',
  },
};

export const publications = [
  {
    key: 'wfs-sb',
    year: '2026',
    title: 'Wavelet-based Frame Selection by Detecting Semantic Boundary for Long Video Understanding',
    authors: 'Wang Chen, Yuhui Zeng, Yongdong Luo, Tianyu Xie, Luojun Lin, Jiayi Ji, Yan Zhang, Xiawu Zheng',
    venue: 'CVPR 2026',
    featured: true,
    image: '/images/papers/wfs-sb.jpg',
    alt: {
      zh: 'WFS-SB 方法示意图，展示查询相关性信号、小波变换和语义边界',
      en: 'WFS-SB diagram showing query relevance signal, wavelet transform, and semantic boundaries',
    },
    summary: {
      zh: '从有噪声的查询-帧相关性信号中检测语义边界，再按片段重要性分配帧预算。方法无需训练，在 VideoMME、MLVU 与 LongVideoBench 上分别提升 5.5、9.5 与 6.2 个百分点。',
      en: 'Detects semantic boundaries from a noisy query-frame relevance signal, then allocates frame budgets by segment importance. The training-free method improves VideoMME, MLVU, and LongVideoBench by 5.5, 9.5, and 6.2 points.',
    },
    links: [
      { label: 'Paper', url: 'https://openaccess.thecvf.com/content/CVPR2026/html/Chen_Wavelet-based_Frame_Selection_by_Detecting_Semantic_Boundary_for_Long_Video_CVPR_2026_paper.html' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2603.00512' },
      { label: 'Code', url: 'https://github.com/MAC-AutoML/WFS-SB' },
    ],
  },
  {
    key: 'quota',
    year: '2026',
    title: 'QuoTA: Query-oriented Token Assignment via CoT Query Decouple for Long Video Comprehension',
    authors: 'Yongdong Luo*, Wang Chen*, Weizhong Huang, Shukang Yin, Haojia Lin, Jinfa Huang, Chaoyou Fu, Jiayi Ji, Xiawu Zheng, Jiebo Luo',
    venue: 'AAAI 2026 · Equal contribution',
    featured: true,
    image: '/images/papers/quota.jpg',
    alt: {
      zh: 'QuoTA 在不同视觉 token 预算下的性能曲线',
      en: 'QuoTA performance curves under different visual token budgets',
    },
    summary: {
      zh: '在跨模态交互前，根据查询对各帧分配视觉 token。CoT 将复杂问题拆成可判定线索，同等 token 预算下在六个视频基准上平均提升 3.2 个百分点。',
      en: 'Allocates visual tokens to frames before cross-modal interaction. CoT turns a complex query into scorable clues, improving six video benchmarks by 3.2 points on average under the same token budget.',
    },
    links: [
      { label: 'Paper', url: 'https://ojs.aaai.org/index.php/AAAI/article/view/39595' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2503.08689' },
      { label: 'Code', url: 'https://github.com/MAC-AutoML/QuoTA' },
    ],
  },
  {
    key: 'efs',
    year: '2026',
    title: 'Event-Anchored Frame Selection for Effective Long-Video Understanding',
    authors: 'Wang Chen*, Yongdong Luo*, Yuhui Zeng, Luojun Lin, Tianyu Xie, Fei Chao, Rongrong Ji, Xiawu Zheng',
    venue: 'arXiv preprint · Equal contribution',
    featured: true,
    image: '/images/papers/efs.jpg',
    alt: {
      zh: 'EFS 事件划分、锚点定位与全局优化流程图',
      en: 'EFS pipeline for event partitioning, anchor localization, and global refinement',
    },
    summary: {
      zh: '先把视频划成视觉一致的事件，再为每个事件定位查询相关锚点，最后用自适应 MMR 做全局补充，在覆盖、相关性和多样性之间取得平衡。',
      en: 'Partitions video into coherent events, localizes a query-relevant anchor in each event, and applies adaptive MMR for global refinement across coverage, relevance, and diversity.',
    },
    links: [
      { label: 'arXiv', url: 'https://arxiv.org/abs/2603.00983' },
    ],
  },
  {
    key: 'face-beautification',
    year: '2023',
    title: 'Customized Automatic Face Beautification',
    authors: 'Wang Chen*, Peizhen Chen*, Weijie Chen, Luojun Lin',
    venue: 'ICASSP 2023 · Equal contribution',
    featured: false,
    image: '/images/papers/customized-face-beautification.jpg',
    alt: {
      zh: '定制化人脸美化方法流程，展示人脸编码、重建与美学模型引导',
      en: 'Customized face beautification pipeline with face encoding, reconstruction, and aesthetics-guided refinement',
    },
    summary: {
      zh: '提出由人脸美学预测模型引导的 StyleGAN 反演，根据用户给出的目标分数做定制化人脸修饰，同时尽量保留身份信息。',
      en: 'Uses facial-aesthetics-guided StyleGAN inversion to match a user-specified target score while preserving identity information.',
    },
    links: [
      { label: 'IEEE', url: 'https://ieeexplore.ieee.org/document/10096554/' },
      { label: 'DOI', url: 'https://doi.org/10.1109/ICASSP49357.2023.10096554' },
    ],
  },
  {
    key: 'real-time-face-beautification',
    year: '2024',
    title: 'Real-Time Interactive Face Beautification',
    authors: 'Luojun Lin, Wang Chen, Peizhen Chen, Xiawu Zheng, Lianwen Jin',
    venue: 'SSRN preprint',
    featured: false,
    image: '/images/papers/real-time-face-beautification.svg',
    alt: {
      zh: '实时交互式人脸美化示意图，展示目标分数与潜空间美学超平面插值',
      en: 'Real-time interactive face beautification through target-score interpolation across an aesthetic hyperplane',
    },
    summary: {
      zh: '构造美学超平面，并在潜空间中直接插值，使用户可以实时调整目标美学分数，同时尽量保留身份特征。',
      en: 'Constructs an aesthetics hyperplane and interpolates directly in latent space for real-time, target-score-controlled editing with identity preservation.',
    },
    links: [
      { label: 'SSRN', url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4923335' },
    ],
  },
  {
    key: 'orchestration',
    year: '2026',
    title: 'Training-Free Multimodal Large Language Model Orchestration',
    authors: 'Tianyu Xie, Yuexiao Ma, Yuhang Wu, Wang Chen, Jiayi Ji, Tat-Seng Chua, Xiawu Zheng, Rongrong Ji',
    venue: 'ICML 2026',
    featured: false,
    image: '/images/papers/orchestration.jpg',
    alt: {
      zh: '免训练多模态大模型编排流程，展示统一输入、LLM 编排与统一输出',
      en: 'Training-free multimodal orchestration pipeline from unified inputs through LLM orchestration to unified outputs',
    },
    summary: {
      zh: '通过语言模型控制器、文本化跨模态记忆和全双工交互层，在不额外训练的情况下组合现成的模态专家。',
      en: 'Combines off-the-shelf modality experts without additional training through an LLM controller, textualized cross-modal memory, and a full-duplex interaction layer.',
    },
    links: [
      { label: 'arXiv', url: 'https://arxiv.org/abs/2508.10016' },
    ],
  },
  {
    key: 'socialomni',
    year: '2026',
    title: 'SocialOmni: Benchmarking Audio-Visual Social Interactivity in Omni Models',
    authors: 'Tianyu Xie, Jinfa Huang, Yuexiao Ma, Rongfang Luo, Yan Yang, Wang Chen, Yuhui Zeng, Yixuan Zou, Qingchuan Ma, Zhiqiang Lu, Ruize Fang, Xiawu Zheng, Jiebo Luo, Rongrong Ji',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/socialomni.jpg',
    alt: {
      zh: 'SocialOmni 基准概览、任务设计与全模态模型表现',
      en: 'SocialOmni benchmark overview, task design, and omni-model performance',
    },
    summary: {
      zh: '从说话人感知、打断时机与回应方式评测音视频社交交互，并分析感知准确率与最终交互质量之间的差距。',
      en: 'Evaluates audio-visual social interaction through speaker perception, interruption timing, and response behavior, exposing gaps between perception accuracy and interaction quality.',
    },
    links: [
      { label: 'arXiv', url: 'https://arxiv.org/abs/2603.16859' },
    ],
  },
  {
    key: 'wavezip',
    year: '2026',
    title: 'WaveZip: Wavelet-Driven Space-Time Decoupling for Video Token Condensation',
    authors: 'Yuhui Zeng, Wang Chen, Jinfa Huang, Tianyu Xie, Yongdong Luo, Jiayi Ji, Xiawu Zheng, Jiebo Luo',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/wavezip.jpg',
    alt: {
      zh: 'WaveZip 小波时空解耦视频 token 压缩流程',
      en: 'WaveZip pipeline for wavelet-driven space-time video token condensation',
    },
    summary: {
      zh: '用时空解耦的小波分析分配帧级预算并压缩空间 token，关注高压缩率下的性能保留。',
      en: 'Uses spatial-temporal decoupled wavelet analysis to allocate frame-level budgets and compress spatial tokens while preserving performance at high compression ratios.',
    },
    links: [
      { label: 'arXiv', url: 'https://arxiv.org/abs/2607.23265' },
    ],
  },
  {
    key: 'mec',
    year: '2026',
    title: 'One Ranking, Any Budget: Matryoshka Evidence-to-Context Frame Selection for Long-Video Understanding',
    authors: 'Wang Chen, Yu Chen, Xiang Wang, Shuai Li, Jinfa Huang, Xiawu Zheng',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/mec.jpg',
    alt: {
      zh: 'MEC 可复用稀疏索引、证据发现与套娃式任意预算帧排序方法',
      en: 'MEC method for reusable sparse indexing, evidence discovery, and matryoshka any-budget frame ranking',
    },
    summary: {
      zh: '生成一条可被任意预算截断的帧优先序列，使证据从局部线索逐步扩展到时间上下文，并降低重复选帧的延迟。',
      en: 'Produces a single frame priority ranking that can be truncated at any budget, progressively expanding from local evidence to temporal context while avoiding repeated selection.',
    },
    links: [
      { label: 'arXiv', url: 'https://arxiv.org/abs/2608.05707' },
    ],
  },
];

export const news = [
  {
    date: '2026.09',
    text: { zh: '正式开启 PhD student 新生活！', en: 'Starting my first year as a PhD student!' },
  },
  {
    date: '2026.05',
    text: { zh: '加入高德地图（阿里巴巴集团）实习。', en: 'Joined AMap, Alibaba Group, as a research intern.' },
  },
  {
    // Author notification: 30 April 2026, https://icml.cc/Conferences/2026/Dates
    date: '2026.04',
    text: { zh: '🎉 1 篇论文（LLM Orchestration）被 ICML 2026 接收。', en: '🎉 1 paper (LLM Orchestration) has been accepted to ICML 2026.' },
  },
  {
    // Final decisions: 20 February 2026, https://cvpr.thecvf.com/Conferences/2026/Dates
    date: '2026.02',
    text: { zh: '🎉 1 篇论文（WFS-SB）被 CVPR 2026 接收。', en: '🎉 1 paper (WFS-SB) has been accepted to CVPR 2026.' },
  },
  {
    // Main-track final notification: 8 November 2025, https://aaai.org/conference/aaai/aaai-26/
    date: '2025.11',
    text: { zh: '🎉 1 篇论文（QuoTA）被 AAAI 2026 接收。', en: '🎉 1 paper (QuoTA) has been accepted to AAAI 2026.' },
  },
];

export const experience = [
  {
    startDate: '2026-09',
    kind: 'education',
    logo: '/images/institutions/xmu.jpg',
    organization: { zh: '厦门大学', en: 'Xiamen University' },
    role: { zh: '计算机科学与技术 · 在读', en: 'Computer Science and Technology · PhD in progress' },
    period: { zh: '2026.09 起', en: 'From Sep 2026' },
    title: { zh: '厦门大学 · 计算机科学与技术 · 在读', en: 'Xiamen University · PhD in Computer Science and Technology (in progress)' },
    detail: { zh: '', en: '' },
  },
  {
    startDate: '2024-09',
    kind: 'education',
    logo: '/images/institutions/xmu.jpg',
    organization: { zh: '厦门大学', en: 'Xiamen University' },
    role: { zh: '人工智能 · 硕士', en: "Artificial Intelligence · Master's" },
    period: { zh: '2024.09 - 2026.08', en: 'Sep 2024 - Aug 2026' },
    title: { zh: '厦门大学 · 人工智能 · 硕士', en: "Xiamen University · Master's in Artificial Intelligence" },
    detail: { zh: '', en: '' },
  },
  {
    startDate: '2026-05',
    kind: 'internship',
    logo: '/images/institutions/amap.png',
    organization: { zh: '高德地图 · 阿里巴巴集团', en: 'AMap · Alibaba Group' },
    role: { zh: '研究实习', en: 'Research internship' },
    period: { zh: '2026.05 至今', en: 'May 2026 - Present' },
    title: { zh: '高德地图 · 阿里巴巴集团 · 实习', en: 'AMap · Alibaba Group · Internship' },
    detail: { zh: '多模态与视频理解方向', en: 'Multimodal and video understanding' },
  },
  {
    startDate: '2020-09',
    kind: 'education',
    logo: '/images/institutions/fzu.jpg',
    organization: { zh: '福州大学', en: 'Fuzhou University' },
    role: { zh: '人工智能 · 学士', en: 'Artificial Intelligence · B.Eng.' },
    period: { zh: '2020.09 - 2024.06', en: 'Sep 2020 - Jun 2024' },
    title: { zh: '福州大学 · 人工智能 · 学士', en: 'Fuzhou University · AI · B.Eng.' },
    detail: { zh: '本科阶段开始研究生成式视觉与人脸美学', en: 'Began research in generative vision and facial aesthetics' },
  },
];

export const sources = [
  { label: 'Google Scholar', url: links.scholar },
  { label: 'ORCID', url: links.orcid },
  { label: 'XMU MAC Lab', url: links.lab },
];
