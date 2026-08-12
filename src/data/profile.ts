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
  cv: '/files/cv-zh.pdf',
};

export const profile = {
  name: { zh: '陈旺', en: 'Wang Chen' },
  nameLatin: 'Wang Chen',
  title: {
    zh: '厦门大学 MAC 实验室人工智能方向硕博连读生',
    en: 'M.S.-Ph.D. student in AI at Xiamen University MAC Lab',
  },
  internship: {
    zh: '2026 年 5 月起在高德地图（阿里巴巴集团）实习',
    en: 'Research intern at AMap, Alibaba Group, since May 2026',
  },
  intro: {
      zh: '我研究长时程视觉信息怎样进入多模态模型。眼下关心的问题很具体。有限的帧、token 和推理预算该花在哪里，模型又该怎样保留事件结构，在视频持续到来时继续形成可靠的理解。',
    en: 'I study how long-horizon visual information should enter multimodal models. My current questions are concrete: where to spend limited frames, tokens, and inference compute, and how a model can preserve event structure while a visual stream continues to unfold.',
  },
  visionTitle: {
    zh: '理解不断展开的世界',
    en: 'Understanding a world in motion',
  },
  vision: {
    zh: '我希望构建能在有限计算下持续看见、组织并推理多模态信息的系统。研究从长视频中的关键时刻出发，逐步走向可验证的 test-time scaling 与长时程流式思考。',
    en: 'I want to build multimodal systems that continuously perceive, organize, and reason under finite computation. The path starts with key moments in long videos and moves toward verifiable test-time scaling and long-horizon streaming thought.',
  },
};

export const researchSteps = [
  {
    number: '01',
    key: 'observe',
    title: { zh: '看见', en: 'Observe' },
    subtitle: { zh: '从连续视觉流中找到结构', en: 'Find structure in continuous visual streams' },
    body: {
      zh: '把视频当作事件沿时间展开，而非彼此孤立的帧。语义边界、事件锚点和长期记忆共同决定模型究竟看见了什么。',
      en: 'Treat video as events unfolding in time rather than isolated frames. Semantic boundaries, event anchors, and long-term memory determine what the model actually sees.',
    },
    refs: ['EFS', 'WFS-SB'],
  },
  {
    number: '02',
    key: 'allocate',
    title: { zh: '分配', en: 'Allocate' },
    subtitle: { zh: '把预算留给真正有用的信息', en: 'Spend compute where information matters' },
    body: {
      zh: '帧、视觉 token 与测试时计算都有限。我的工作尝试让分配过程感知查询、事件与当前的不确定性。',
      en: 'Frames, visual tokens, and test-time compute are all finite. My work makes allocation sensitive to the query, event structure, and current uncertainty.',
    },
    refs: ['QuoTA', 'Test-time scaling'],
  },
  {
    number: '03',
    key: 'understand',
    title: { zh: '理解', en: 'Understand' },
    subtitle: { zh: '让推理经得起时间与证据检查', en: 'Make reasoning survive time and evidence checks' },
    body: {
      zh: '最终目标是让模型在长时程场景中持续更新判断，保留证据来路，并在生成与验证之间形成闭环。',
      en: 'The goal is to let models update beliefs over long horizons, retain evidence provenance, and close the loop between generation and verification.',
    },
    refs: ['Streaming video thinking', 'Test-time scaling'],
  },
];

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
    image: '/images/papers/face-beautification.jpg',
    alt: {
      zh: 'Customized Automatic Face Beautification 论文条目',
      en: 'Customized Automatic Face Beautification paper entry',
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
    image: '/images/papers/face-beautification.jpg',
    alt: {
      zh: '实时交互式人脸美化预印本条目',
      en: 'Real-Time Interactive Face Beautification preprint entry',
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
    image: '/images/papers/efs.jpg',
    alt: {
      zh: '免训练多模态大模型编排论文条目',
      en: 'Training-Free Multimodal Large Language Model Orchestration paper entry',
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
    title: 'SocialOmni: Benchmarking Audio-Visual Social Interaction in Omni Models',
    authors: 'Tianyu Xie, Jinfa Huang, Yuexiao Ma, Rongfang Luo, Yan Yang, Wang Chen, Yuhui Zeng, Yixuan Zou, Qingchuan Ma, Zhiqiang Lu, Ruize Fang, Xiawu Zheng, Jiebo Luo, Rongrong Ji',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/efs.jpg',
    alt: {
      zh: 'SocialOmni 音视频社交交互基准条目',
      en: 'SocialOmni audio-visual social interaction benchmark entry',
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
    title: 'WaveZip: Wavelet-Guided Spatiotemporal Token Compression for Video Large Language Models',
    authors: 'Yuhui Zeng, Wang Chen, Jinfa Huang, Tianyu Xie, Yongdong Luo, Jiayi Ji, Xiawu Zheng, Jiebo Luo',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/wfs-sb.jpg',
    alt: {
      zh: 'WaveZip 小波引导的视频 token 压缩预印本条目',
      en: 'WaveZip wavelet-guided video token compression preprint entry',
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
    title: 'One Ranking, Any Budget: Multi-scale Evidence Compilation for Efficient Long-Video Understanding',
    authors: 'Wang Chen, Yu Chen, Xiang Wang, Shuai Li, Jinfa Huang, Xiawu Zheng',
    venue: 'arXiv preprint',
    featured: false,
    image: '/images/papers/quota.jpg',
    alt: {
      zh: 'MEC 任意预算帧排序预印本条目',
      en: 'MEC any-budget frame ranking preprint entry',
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

export const ongoing = [
  {
    index: 'A',
    title: { zh: '生成促进理解的 test-time scaling', en: 'Generation-guided test-time scaling for understanding' },
    body: {
      zh: '研究额外推理计算怎样产生可检查的假设、证据与修正过程，让测试时扩展带来更可靠的多模态理解。',
      en: 'Studying how additional inference compute can produce inspectable hypotheses, evidence, and corrections for more reliable multimodal understanding.',
    },
  },
  {
    index: 'B',
    title: { zh: 'Long-horizon streaming video thinking', en: 'Long-horizon streaming video thinking' },
    body: {
      zh: '面向持续到来的视频，探索分层记忆、事件更新与证据回看，使模型在低延迟约束下保持长期理解。',
      en: 'Exploring hierarchical memory, event updates, and evidence revisiting so models can sustain long-term understanding under low-latency constraints.',
    },
  },
];

export const news = [
  {
    date: '2026.05',
    text: { zh: '加入高德地图（阿里巴巴集团）实习，关注多模态与视频理解。', en: 'Started an internship at AMap, Alibaba Group, working on multimodal and video understanding.' },
    userReported: true,
  },
  {
    date: '2026.03',
    text: { zh: 'WFS-SB 被 CVPR 2026 接收，代码已开源。', en: 'WFS-SB was accepted to CVPR 2026 and the code was released.' },
  },
  {
    date: '2026.03',
    text: { zh: 'QuoTA 发表在 AAAI 2026。', en: 'QuoTA appeared at AAAI 2026.' },
  },
  {
    date: '2026.03',
    text: { zh: '发布 Event-Anchored Frame Selection 预印本。', en: 'Released the Event-Anchored Frame Selection preprint.' },
  },
];

export const experience = [
  {
    period: { zh: '2024.09 至今', en: 'Sep 2024 - Present' },
    title: { zh: '厦门大学 · 人工智能 · 硕博连读', en: 'Xiamen University · AI · M.S.-Ph.D. program' },
    detail: { zh: 'MAC 实验室，导师曹刘娟教授、郑侠武副教授', en: 'MAC Lab, advised by Prof. Liujuan Cao and Assoc. Prof. Xiawu Zheng' },
  },
  {
    period: { zh: '2026.05 至今', en: 'May 2026 - Present' },
    title: { zh: '高德地图 · 阿里巴巴集团 · 实习', en: 'AMap · Alibaba Group · Internship' },
    detail: { zh: '多模态与视频理解方向', en: 'Multimodal and video understanding' },
  },
  {
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
