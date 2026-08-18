---
title: "从视频压缩到 Codec-Native 多模态模型"
description: "从 HEVC 的预测、残差与 bitcost 出发，沿 OneVision-Encoder、codec-video-prep、LLaVA-OneVision-2 和 Mage-VL 的论文与源码，讲清稀疏视频 token 怎样进入多模态模型。"
pubDate: 2026-08-18
readingTime: "20 分钟"
tags: ["Codec-Native", "Video Understanding", "Multimodal"]
lang: "zh"
translationKey: "codec-native-video"
tocDepth: "chapters"
featured: true
draft: false
sources:
  - label: "HEVC 标准概览论文"
    url: "https://doi.org/10.1109/TCSVT.2012.2221191"
  - label: "OneVision-Encoder 论文"
    url: "https://arxiv.org/abs/2602.08683"
  - label: "OneVision-Encoder 官方仓库"
    url: "https://github.com/EvolvingLMMs-Lab/OneVision-Encoder"
  - label: "codec-video-prep 官方仓库"
    url: "https://github.com/YunyaoYan/codec-video-prep"
  - label: "LLaVA-OneVision-2 论文"
    url: "https://arxiv.org/abs/2605.25979"
  - label: "LLaVA-OneVision-2 官方仓库"
    url: "https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-2"
  - label: "Mage-VL 论文"
    url: "https://arxiv.org/abs/2607.24904"
  - label: "Mage 官方仓库"
    url: "https://github.com/microsoft/Mage"
---

长视频模型有一笔很容易被忽略的开销。视觉编码器还没看到第一枚 token，系统已经把大量相似画面解码成 RGB，又把每一帧切成密集 patch。镜头没有移动，背景也没变化，ViT 仍会重复处理桌面、墙面和纹理。

视频编码器处理这类重复已有几十年。它持续判断哪些内容能从参考画面预测，哪些区域还需要额外信息。运动矢量、预测残差和实际编码比特都留下了线索。Codec-native 视频模型接过这些线索，用它们安排视觉 token 预算，把更多计算放到变化明显或难以预测的区域。

我把 OneVision-Encoder、`codec-video-prep`、LLaVA-OneVision-2 与 Mage-VL 的论文和公开仓库对在一起以后，发现这条路线真正难的地方在接口。选择器要说明留下哪些 patch，画布要让 GPU 继续使用规则张量，位置编码还得恢复 patch 原来的时间与空间身份。任何一处顺序、坐标或 padding 约定出错，张量形状仍可能完全正常，语义却已经错位。

本文是 76 页技术报告的博客适配版。它保留主要技术链、源码审计结论和复现建议，省去了逐函数展开与长附录。

<p class="article-download"><a href="/files/codec-native-video-technical-report.pdf" target="_blank" rel="noreferrer">下载完整技术报告 PDF</a><br />完整版本含仓库提交、关键函数入口、张量链、审计发现清单与更多部署细节。</p>

## 视频编码器已经做过一次筛选

一张 `1920 × 1080` 的 8 bit RGB 图像约有 622 万字节。每秒 30 帧时，原始数据接近 187 MB/s。即便换成常见的 YCbCr 4∶2∶0，一分钟也有约 5.6 GB。网络视频能缩到每秒几兆比特，靠的是画面里大量可预测的结构。

混合视频编码器先为当前块寻找预测。帧内预测从同一画面的相邻像素推断，帧间预测从参考画面搬来相似区域。原始像素减去预测像素以后得到残差。残差经过变换、量化和熵编码，与预测模式、运动信息一起写入码流。

编码器内部还要走一遍反量化、反变换和重建。后续画面引用的是解码端也能得到的重建画面。它若偷偷使用无损原图，两端参考内容会越来越不一致。

<figure>
  <a href="/images/blog/codec-native-video/figure-01.png" target="_blank"><img src="/images/blog/codec-native-video/figure-01.png" alt="混合视频编解码器的闭环" loading="lazy" decoding="async" /></a>
  <figcaption>混合编码的主路径与编码器内部重建闭环。点击图片可查看原尺寸。</figcaption>
</figure>

这套过程给下游模型留下几类便宜信号。

| 信号 | 粒度 | 能说明什么 | 需要警惕什么 |
| --- | --- | --- | --- |
| 容器包大小 | 帧或包 | 某个时间段编码成本上升 | 没有直接空间位置 |
| 运动矢量 | 预测块 | 编码器从参考画面搬了哪一块 | 大运动不等于任务相关 |
| 预测残差 | 像素块 | 预测仍解释不了的差异 | 噪声与光照变化也会升高 |
| bitcost | 宏块、CTU 或子网格 | 某段编码语法实际消耗的比特 | 强烈受 codec 与编码参数影响 |

这些信号都来自压缩目标。它们擅长发现难预测和高变化区域，不知道用户稍后会问什么。静止字幕、缓慢移动的小目标和低纹理关键物体可能拿到很低的分数。Codec 信号适合做便宜的第一阶段先验，不能独自承担语义判断。

## GOP 这个词经常把三件事混在一起

编码领域的 GOP 描述预测依赖和随机访问结构。论文里的逻辑 GOP 可能根据 P/B 包能量切段。`codec-video-prep` 的 readiness 组又会根据重要性阈值、时间覆盖和边际收益动态结束。三者碰巧都谈一组帧，边界含义并不相同。

<figure>
  <a href="/images/blog/codec-native-video/figure-02.png" target="_blank"><img src="/images/blog/codec-native-video/figure-02.png" alt="编码 GOP、逻辑 GOP 与 readiness 分组" loading="lazy" decoding="async" /></a>
  <figcaption>码流结构、论文分桶和工程分组各自回答不同问题。</figcaption>
</figure>

这一区分会直接影响复现。容器里的同步样本通常代表随机访问入口，不保证那一帧在视觉上最重要。论文若写“每个 GOP 保留 I 图片”，工程代码却用逻辑组首帧当完整 anchor，实际输入已经改变。报告结果时应写清 anchor 的定义，不能只留下一个 GOP 名称。

## 稀疏 token 需要四份契约

从密集帧走向稀疏 token，至少要把四件事写清。

第一份是选择契约。它规定候选帧怎样采样，codec 分数如何投影到视觉 patch，预算按整段视频、逻辑组还是单帧分配。

第二份是内容契约。模型最终读取的通常仍是解码后的 RGB patch。运动矢量、残差与 bitcost 负责评分，它们没有替代物体外观。

第三份是位置契约。被选 patch 搬进紧凑画布以后，物理位置已经变化。每个 token 仍需保存原始 `(t,h,w)`，让位置编码知道它来自哪一帧、哪一行和哪一列。

第四份是顺序契约。选择器常按 `2 × 2` block 连续打包，下游 processor 可能先按 raster 顺序切 patch，再做视觉 merge。位置表必须跟着模型真正使用的 token 顺序变化。只保存一份坐标数组还不够，数组的排序规则也要进入接口。

零填充尤其危险。Padding 没有真实来源，不能随手伪造一个正常坐标。更稳妥的做法是传显式 mask 或哨兵值，并在视觉注意力与位置编码里共同处理。

## OneVision-Encoder 把 codec 稀疏性变成视觉输入

[OneVision-Encoder](https://arxiv.org/abs/2602.08683) 在 2026 年 2 月发布，论文把这套原则称为 codec-aligned sparsity。它没有让 ViT 直接读取运动矢量，也没有用压缩系数替代像素。进入视觉编码器的内容仍是 RGB patch，MV 和 residual 只负责生成选择掩码。

论文中的 HEVC 路径先保留完整 I 图片，再从 P 图片选择高分 patch。Codec 视频、分块抽帧视频和单张图像都进入同一视觉骨干。共享的 3D RoPE 为每个 token 注入时间、高度和宽度坐标，让不规则布局仍能表达相对时空关系。

<figure>
  <a href="/images/blog/codec-native-video/figure-04.png" target="_blank"><img src="/images/blog/codec-native-video/figure-04.png" alt="OneVision-Encoder 的统一输入思想" loading="lazy" decoding="async" /></a>
  <figcaption>三类输入共用视觉骨干，内容与源位置一起进入统一 token 序列。</figcaption>
</figure>

这套设计里最耐用的部分，是稀疏 RGB 内容、显式源位置和规则计算布局之间的分工。选择器以后可以换成 bitcost、神经 codec 码长或任务条件模型，视觉骨干仍可沿用同一输入契约。

源码审计也发现论文和公开实现之间有多处漂移。在报告审计的提交中，论文方法段按 P 图片给出保留比例，训练链和 LLaVA 原型实际使用整段 global Top-K。论文 Stage 2 写 GOP 32，公开转码工具默认 16。论文给出多标签 logistic 目标，代码使用多路带 margin 的 PartialFC softmax。公开 MV 加 residual 的离线脚本还含变量赋值与帧计数缺陷，无法原样证明发布权重的有效训练索引怎样生成。

这些差异不会抹掉模型接口的贡献，却会改变复现结论。使用预训练权重和从头训练视觉编码器，是两项风险完全不同的工作。

## codec-video-prep 把论文思想做成数据资产

`codec-video-prep` 位于系统最前端。它不训练视觉模型，负责把普通视频转成少量 RGB canvas、来源位置数组和元数据。仓库当前 README 标记为 0.2.5，公开包支持 H.264、HEVC 与 VP9 的 bitcost 提取，并提供 `run_preinfer()` 入口。

<figure>
  <a href="/images/blog/codec-native-video/figure-05.png" target="_blank"><img src="/images/blog/codec-native-video/figure-05.png" alt="codec-video-prep 的公开调用链与数据集链" loading="lazy" decoding="async" /></a>
  <figcaption>仓库内两条流水线共享底层工具，默认评分、分组与输出语义并不相同。</figcaption>
</figure>

公开单视频链大致经过探测与采样、解码、评分分组、Top-K 选择和画布打包。JSONL 数据集链使用另一套默认策略，包含视频级进程池和不同的锚帧逻辑。两条链共享 patched FFmpeg 与几何工具，输出却不能直接互换。

`2 × 2` block 选择来自下游视觉 merge 的约束。若模型会把四个相邻 patch 合成一枚视觉 token，选择器也应在同样的块边界上分配预算。否则某个 merge 组可能只收到一两个有效 patch，剩余位置全是 padding，预算利用率和位置语义都会变差。

<figure>
  <a href="/images/blog/codec-native-video/figure-06.png" target="_blank"><img src="/images/blog/codec-native-video/figure-06.png" alt="多帧 patch 打包成固定画布" loading="lazy" decoding="async" /></a>
  <figcaption>完整 anchor 与高分 block 被打包进规则画布，来源位置表负责恢复时空身份。</figcaption>
</figure>

报告对审计提交还记录了四个工程问题。CLI 暴露的 `pkt_peak` 与插件识别的 `pkt_size_peak` 不一致，相关模式可能退到 fps 采样。README 曾给出与代码 N×3 不一致的位置格式。`meta.json` 的解码后端字段被硬编码。LLaVA 适配器里的 `target_canvas` 名称没有形成固定输出数量约束。

这类问题都很像普通软件 bug，后果却会进入模型评测。采样模式、后端和 canvas 数量一旦被错误记录，复现实验会把不同输入拓扑当成同一种方法。

## LLaVA-OneVision-2 把稀疏视觉接进 MLLM

[LLaVA-OneVision-2](https://arxiv.org/abs/2605.25979) 继续解决下游接入问题。论文把压缩视频视作连续 bit-cost 流，用动态变化划分时间组，再结合运动和残差信号选择空间证据。3D RoPE 让 codec canvas、普通抽帧和图像共享坐标系统。

论文报告 LLaVA-OneVision-2-8B 在 JumpScore 上得到 74.9 mAP，并在相同视觉 token 预算下比普通抽帧高 9.7 个点。这些数字来自论文设置，不能跨 processor 版本或输入预算直接比较。

<figure>
  <a href="/images/blog/codec-native-video/figure-07.png" target="_blank"><img src="/images/blog/codec-native-video/figure-07.png" alt="LLaVA-OneVision-2 的 codec 路线" loading="lazy" decoding="async" /></a>
  <figcaption>论文前端与公开仓库集成层承担不同职责，适配器主要处理资产、顺序和时间标记。</figcaption>
</figure>

公开实现里，codec 预处理大多发生在 processor 侧。Canvas 经过普通 image processor 切成 patch，位置记录随后转换成 `2 × 2` merge 后的顺序。模型同时得到 `pixel_values`、`image_grid_thw`、patch 位置与文本时间戳。

这里有一个很隐蔽的 group 问题。论文按逻辑 GOP 建模，公开 processor 没有显式传 `group_ids`。每四张 canvas 的目录顺序承担了隐式分组语义。文件名排序、缓存合并或数据加载只要改变顺序，局部注意力窗口就可能跨组。更稳的接口应直接传 group tensor 和 offset，别让文件系统替模型保存结构。

论文算法与 release 也不能逐项互换。报告审计的 public main 使用 readiness 与 bitcost 路径，论文描述的 P/B 包能量、自适应逻辑 GOP、MV 加 residual 融合和分层 P 画布配额没有完整落在同一条公开调用链上。读论文得到的是方法设计，运行仓库得到的是当前 release 行为，两者都应分别记录。

## Mage-VL 把这条路线延伸到流式交互

[Mage-VL](https://arxiv.org/abs/2607.24904) 把 codec-native 视觉编码器接进持续视频流。Mage-ViT 使用 16×16 patch，从头训练共享 3D RoPE 的视觉骨干，并支持传统 codec 与 DCVC-RT。论文报告视觉 token 降低超过 75%，最高端到端加速约 3.5 倍，具体收益会随视频、预算与实现环境变化。

<figure>
  <a href="/images/blog/codec-native-video/figure-08.png" target="_blank"><img src="/images/blog/codec-native-video/figure-08.png" alt="Mage-VL 的 codec-native 流式架构" loading="lazy" decoding="async" /></a>
  <figcaption>Mage-ViT 负责稀疏视觉，滚动窗口保留近期上下文，gate 决定是否生成响应。</figcaption>
</figure>

流式系统多了一项新决策。模型既要看懂当前内容，也要判断此刻是否值得开口。Mage 使用轻量 gate 预测 `p_speak`，超过阈值时触发生成，低于阈值时继续观察。论文把它描述成带因果状态的双系统架构。

公开 demo 的边界需要单独说明。报告审计时，示例会先对整段视频完成预处理，再按 chunk 顺序送入 gate。生成路径主要使用当前段，论文里的最近 N 段视觉窗口没有完整出现在公开 demo。Gate 网络具备因果状态基础，真正在线的 decoder、selector、视觉缓存与持久状态 API 仍有工程工作要补。

Traditional codec 路径也体现了论文和 release 的差别。论文强调 HEVC 的 MV 加 residual，公开集成默认复用 `codec-video-prep` 的 bitcost readiness。DCVC 路径只替换评分源，后续分组、Top-K、画布和位置处理仍走共同接口。这种分层很实用，也意味着跨 codec 比较必须重新校准分数尺度。

## 源码审计最重要的十二个提醒

把四个项目连成一条链以后，问题集中在版本、坐标和隐式语义。下面这张表保留完整报告里最值得复现者先看的发现。

| 位置 | 审计发现 | 直接影响 |
| --- | --- | --- |
| codec-video-prep | CLI 与插件的峰值采样枚举不一致 | 采样模式可能静默改变 |
| codec-video-prep | README 位置格式与代码 N×3 不一致 | 下游可能错列或错 shape |
| codec-video-prep | 解码后端元数据被硬编码 | 性能归因可能指向错误后端 |
| codec-video-prep | `target_canvas` 不约束固定输出数 | 名称和实际资产数量不一致 |
| OneVision | MV 加 residual 离线脚本含确定性 bug | 公开脚本不能原样生成有效索引 |
| OneVision | 64 帧 loader 有等号边界风险 | RGB 与位置索引可能时间错配 |
| OneVision | 论文与代码采用不同训练损失 | 训练目标不能按公式直接复现 |
| LLaVA-OV2 | 论文 adaptive GOP 与 release readiness 不同 | 方法设计和当前 main 不能互换 |
| LLaVA-OV2 | group id 没有显式 tensor | Canvas 顺序承担隐式语义 |
| Mage | 论文 HEVC 双信号与 release bitcost 不同 | 可见选择信号发生变化 |
| Mage | 公开完整 anchor 是逻辑组首帧 | 不能把所有 anchor 称作 I canvas |
| Mage | streaming demo 先做全片预处理 | 在线状态和最近窗口尚未完整公开 |

这些发现只对应报告记录的提交。仓库后续更新可能修复其中一部分。复现时应把 commit、包版本、模型 revision 与 processor revision 一起写进实验记录。

## 复现和部署时怎样少走弯路

一套 codec-native 系统需要同时评测任务质量和系统成本。只报告问答准确率，会漏掉视觉 token、解码时间和端到端延迟。只报告 token reduction，也可能掩盖短事件、OCR 与轨迹证据已经被选择器丢掉。

我会先做几项很小的单元测试。

1. 用带彩色编号的 patch 合成短视频，打包后逐块反投影，核对像素与 `[frame,h,w]`。
2. 检查 `len(patch_positions)` 与实际 patch 数相等，视觉 merge 后数量再与 image pad token 对齐。
3. 打乱 canvas 顺序，要求测试明确失败，防止隐式 group 被静默改变。
4. 让 batch 内样本使用不同位置图，确认 wrapper 没有只取第一份坐标。
5. 比较逐段 gate 与一次性因果前向，随后 reset state，检查不同视频不会共享记忆。

当前公开单视频链可以从显式、保守的配置开始。下面的示例使用 `uniform_count` 和 readiness，避开报告审计提交里的峰值采样名称问题。

```bash
codec-video-prep \
  --video input.mp4 \
  --out_dir output_codec \
  --num_sampled_frames 256 \
  --frame_sampling_mode uniform_count \
  --grouping_mode readiness \
  --group_size 32 \
  --images_per_group 4 \
  --min_group_frames 8 \
  --max_group_frames 64 \
  --patch 14 \
  --block_size 2 \
  --decode_backend cv_reader_pixels \
  --canvas_format png
```

缓存键也要超出视频路径。至少纳入视频内容 hash、全部选择配置、预处理仓 commit、patched FFmpeg 标识、processor revision 和输出 schema 版本。资产目录最好额外保存 group boundaries、canvas order、padding policy 与位置张量形状。

生产系统还需要回退。Codec 不受支持、位置校验失败或分数分布过平时，可以退到均匀抽帧。任务涉及静止文字或低运动目标时，增加低分辨率全局帧与 dense anchor。回退结果要进入元数据，评测时才能区分 codec 路径和 frame 路径。

Patched FFmpeg 扩大了解码攻击面。损坏码流可能带来异常内存、超长运行和伪造时间戳。实际部署应使用进程隔离、资源限额、输入时长上限，并维护 codec 白名单与补丁扫描。

## 这条技术路线接下来缺什么

Codec 选择器目前不知道用户的问题。一个自然方向是先生成较大的 codec 候选池，再由文本问题或轻量视觉模型做第二次排序。静止文字和低运动目标因此有机会被补回。均匀哨兵帧仍应保留，用来覆盖 codec 分数的盲区。

预算控制也可以从固定 K 走向可学习策略。视频编码里的率失真目标可以改写成任务损失与 token 成本的联合目标。控制器要带硬预算和回退条件，避免平均分提高以后在少数长视频上无限超支。

流式系统还缺一套真正增量的运行时。Decoder 要维护必要参考状态，selector 持久保存 readiness 分组，视觉塔缓存最近窗口，gate 保存因果记忆。用户临时提问时，系统还要决定只读当前缓存，还是回看磁盘里的原始片段。

最后一项工作最朴素，也最重要。把 group、canvas、位置和 padding 写成带版本的显式 schema。今天很多故障来自目录顺序、数组形状和默认参数承担了过多隐含语义。接口一旦写清，训练、缓存和在线推理才能共享同一份资产。

传统视频压缩器已经计算过哪里容易预测，哪里需要额外比特。OneVision-Encoder 把这份结构变成视觉 token 分配原则，`codec-video-prep` 把它做成可调用的数据链，LLaVA-OneVision-2 将稀疏视觉接进通用 MLLM，Mage-VL 又把它推向流式交互。

这条路线最有价值的地方，是把 codec 当成便宜、可替换的第一阶段先验。任务语义、全局回退与可学习预算继续补足它的盲区。长视频系统最终需要学会的，也许就是在有限计算里知道哪里值得细看，哪些证据必须留下，以及什么时候应该回答。
