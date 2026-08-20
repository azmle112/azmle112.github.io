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
  wechat: 'https://mp.weixin.qq.com/s/kKNY5tE6aczIX5T0UglUwQ',
};

export const profile = {
  name: { zh: '陈旺', en: 'Wang Chen' },
  nameLatin: 'Wang Chen',
  title: {
    zh: '厦门大学 MAC 实验室人工智能方向博士生',
    en: 'Ph.D. student in AI at Xiamen University MAC Lab',
  },
  internship: {
    zh: '2026 年 5 月起在高德地图（阿里巴巴集团）实习',
    en: 'Research intern at AMap, Alibaba Group, since May 2026',
  },
  intro: {
    zh: '我研究长时程视觉信息怎样进入多模态模型，也关心生成能否帮助模型理解世界。眼下的问题很具体。模型该怎样从连续视频中保留事件结构，怎样生成可检查的候选解释，又怎样回到原始证据里修正它们。',
    en: 'I study how long-horizon visual information should enter multimodal models, and how generation can help a model understand the world. My current questions are concrete: how to preserve event structure in continuous video, generate inspectable candidate explanations, and return to the original evidence to revise them.',
  },
  wechatNote: {
    zh: '公众号「AI骇客」也是我偶尔运营的',
    en: 'I also occasionally run the WeChat account AI Hacker',
  },
  visionTitle: {
    zh: '理解不断展开的世界',
    en: 'Understanding a world in motion',
  },
  vision: {
    zh: '我希望构建能在现实时间尺度上持续看见、组织并理解多模态信息的系统。研究从长视频中的事件结构出发，进一步探究生成怎样提出可检验的假设，以及模型怎样在持续到来的视觉流中积累而不遗失证据。',
    en: 'I want to build multimodal systems that can keep seeing, organizing, and understanding information over real-world time scales. The path starts with event structure in long video, then asks how generation can propose testable hypotheses and how a model can accumulate evidence without losing it as a visual stream continues.',
  },
};

export const visionParagraphs = [
  {
    zh: '现实中的视觉经验很少被整齐地切成一张张图片。一次实验、一段旅程或一场比赛会持续很久，真正影响判断的线索却只在少数时刻出现。模型需要知道哪里发生了变化，也要记得这些变化前后怎样相连。我的第一条研究线索由此展开。我尝试把视频里的语义边界、事件锚点和查询相关信息组织起来，让有限输入保留足够完整的故事。',
    en: 'Visual experience in the real world rarely arrives as a tidy stack of independent images. An experiment, a journey, or a match can last for hours, while the evidence that changes a judgment may appear only briefly. A model has to notice when an event changes and remember how those changes connect. This motivates my first research thread: organizing semantic boundaries, event anchors, and query-relevant information so that a finite input still retains a coherent account of what happened.',
  },
  {
    zh: '生成给这条路线补上了另一种可能。模型可以先提出事件描述、缺失状态或未来走向，再回到观测中寻找支持与冲突。这样的生成结果只是一组候选，价值来自它让模糊的内部状态变得可以检查。一个候选若找不到时间位置、视觉实体或前后因果的支持，就应该被修改或舍弃。理解因此有了可操作的中间对象。',
    en: 'Generation adds another possibility. A model can propose an event description, a missing state, or a possible future, then return to its observations to look for support and contradiction. These generations are candidates rather than evidence. Their value lies in turning an ambiguous internal state into something that can be inspected. If a candidate cannot be grounded in time, entities, or causal order, it should be revised or rejected.',
  },
  {
    zh: '我最终想做的系统，应当能一边接收持续到来的视频，一边维护对事件的当前理解。它知道哪些内容已经确认，哪些仍是假设，旧证据在什么时候需要重新查看。模型给出的答案只是这一过程的一个出口。更重要的是，答案背后的事件表示能够随着新信息到来继续更新，并保留足够清楚的证据来路。',
    en: 'The system I ultimately want to build should maintain a working account of events while video keeps arriving. It should know what has been confirmed, what remains hypothetical, and when earlier evidence needs to be revisited. An answer is only one output of this process. More important is an event representation that can keep changing with new information while preserving where its evidence came from.',
  },
];

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
    key: 'propose',
    title: { zh: '生成', en: 'Propose' },
    subtitle: { zh: '把模糊理解变成可检查的候选', en: 'Turn an uncertain reading into inspectable candidates' },
    body: {
      zh: '让模型生成事件描述、缺失状态或可能的未来，把尚未成形的判断写成能够被定位、比较和否证的中间对象。',
      en: 'Generate event descriptions, missing states, or possible futures so an unfinished judgment becomes an intermediate object that can be localized, compared, and falsified.',
    },
    refs: ['Generative understanding', 'Hypothesis grounding'],
  },
  {
    number: '03',
    key: 'verify',
    title: { zh: '核验', en: 'Verify' },
    subtitle: { zh: '让理解随着证据继续更新', en: 'Let understanding keep changing with evidence' },
    body: {
      zh: '把候选重新放回时间线和原始视觉证据中检查。保留得到支持的部分，修正冲突之处，并在长时程场景里持续更新事件记忆。',
      en: 'Place each candidate back on the timeline and against the original visual evidence. Keep what is supported, revise conflicts, and update event memory over long horizons.',
    },
    refs: ['Evidence tracing', 'Streaming video understanding'],
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

export const ongoing = [
  {
    index: 'A',
    title: { zh: '生成怎样帮助理解', en: 'How generation can help understanding' },
    body: {
      zh: '研究生成目标、内部生成特征与候选假设怎样暴露模型尚未理解的部分，再用原始观测定位、核验和修正。',
      en: 'Studying how generative objectives, internal features, and candidate hypotheses can expose what a model has not yet understood, then using observations to ground, test, and revise them.',
    },
  },
  {
    index: 'B',
    title: { zh: '长时程流式视频理解', en: 'Long-horizon streaming video understanding' },
    body: {
      zh: '面向持续到来的视频，探索分层记忆、事件更新与证据回看，使模型在低延迟约束下保持长期理解。',
      en: 'Exploring hierarchical memory, event updates, and evidence revisiting so models can sustain long-term understanding under low-latency constraints.',
    },
  },
];

export const news = [
  {
    date: '2026.09',
    text: { zh: '进入厦门大学人工智能博士阶段，开始新的 PhD 生活。', en: 'Beginning the Ph.D. stage in Artificial Intelligence at Xiamen University.' },
  },
  {
    date: '2026.05',
    text: { zh: '加入高德地图（阿里巴巴集团）实习，关注多模态与视频理解。', en: 'Started an internship at AMap, Alibaba Group, working on multimodal and video understanding.' },
  },
  {
    date: '2026.03',
    text: { zh: 'WFS-SB 被 CVPR 2026 接收，代码已开源。', en: 'WFS-SB was accepted to CVPR 2026 and the code was released.' },
  },
  {
    date: '2026.03',
    text: { zh: 'QuoTA 发表在 AAAI 2026。', en: 'QuoTA appeared at AAAI 2026.' },
  },
];

export const experience = [
  {
    period: { zh: '2026.09 起', en: 'From Sep 2026' },
    title: { zh: '厦门大学 · 人工智能 · 博士阶段', en: 'Xiamen University · AI · Ph.D. stage' },
    detail: { zh: 'MAC 实验室，导师曹刘娟教授、郑侠武副教授', en: 'MAC Lab, advised by Prof. Liujuan Cao and Assoc. Prof. Xiawu Zheng' },
  },
  {
    period: { zh: '2024.09 - 2026.08', en: 'Sep 2024 - Aug 2026' },
    title: { zh: '厦门大学 · 人工智能 · 硕博连读阶段', en: 'Xiamen University · AI · M.S.-Ph.D. track' },
    detail: { zh: '在长视频理解与多模态推理方向开展研究', en: 'Research in long-video understanding and multimodal reasoning' },
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
