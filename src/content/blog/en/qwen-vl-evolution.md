---
title: "From Qwen-VL to Qwen3.5, the Path Toward Native Multimodality"
description: "A technical history of five Qwen vision-language generations, covering visual encoding, resolution, temporal modeling, training data, agent abilities, deployment choices, and open limitations."
pubDate: 2026-08-12
readingTime: "24 min"
tags: ["Vision-Language Model", "Qwen", "Multimodal Agent"]
lang: "en"
translationKey: "qwen-vl-evolution"
featured: true
draft: false
sources:
  - label: "Qwen-VL paper"
    url: "https://arxiv.org/abs/2308.12966"
  - label: "Qwen-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen-vl/"
  - label: "Qwen-VL official repository"
    url: "https://github.com/QwenLM/Qwen-VL"
  - label: "Qwen2-VL paper"
    url: "https://arxiv.org/abs/2409.12191"
  - label: "Qwen2-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen2-vl/"
  - label: "Qwen2-VL-7B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct"
  - label: "Qwen2.5-VL paper"
    url: "https://arxiv.org/abs/2502.13923"
  - label: "Qwen2.5-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen2.5-vl/"
  - label: "Qwen2.5-VL-32B official blog"
    url: "https://qwenlm.github.io/blog/qwen2.5-vl-32b/"
  - label: "Qwen2.5-VL-7B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct"
  - label: "Qwen3-VL paper"
    url: "https://arxiv.org/abs/2511.21631"
  - label: "Qwen3-VL official repository"
    url: "https://github.com/QwenLM/Qwen3-VL"
  - label: "Qwen3-VL-235B-A22B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct"
  - label: "Qwen3.5 official blog"
    url: "https://qwen.ai/blog?id=qwen3.5"
  - label: "Qwen3.5-397B-A17B official model card"
    url: "https://huggingface.co/Qwen/Qwen3.5-397B-A17B"
---

Qwen-VL arrived in 2023 with image understanding, bilingual OCR, visual question answering, and bounding-box output. Three years later, Qwen3.5 treats images and video as standard inputs to the main model while also handling long context, tools, and interface actions. The names changed gradually. The systems underneath changed much faster.

The most useful way to follow this family is to watch the visual interface loosen over time. The first model compressed every image into a fixed number of tokens. Qwen2-VL preserved native aspect ratios. Qwen2.5-VL aligned video positions with real time. Qwen3-VL injected visual features from several encoder depths into the language backbone. Qwen3.5 then folded multimodality into one unified model family and dropped the VL suffix from official naming.

All benchmark values below come from official papers, blogs, or model cards. Prompt templates, image budgets, judges, and test versions vary across releases. These numbers show the emphasis of each generation and do not form a controlled leaderboard.

## The official Qwen3.5 name

There is no separately released official family named `Qwen3.5-VL`. The official family is Qwen3.5, with model IDs such as `Qwen3.5-397B-A17B`, `Qwen3.5-27B`, and `Qwen3.5-4B`. It learns from text, images, and video during unified pretraining. Qwen describes it as a native vision-language model.

The informal Qwen3.5-VL label appears in community discussion when people want to emphasize vision. Model discovery, weights, code, and deployment documentation all use Qwen3.5. Qwen3.6 was already public by 2026-08-12. This article ends at Qwen3.5 to keep the requested scope intact.

## The timeline

| Generation | First release | Public scales | Main contribution |
| --- | --- | --- | --- |
| Qwen-VL | 2023-08 | About 9.6B total | Bilingual visual dialogue, OCR, and grounding |
| Qwen2-VL | 2024-08 | 2B, 7B, 72B | Dynamic resolution, unified image-video input, visual agents |
| Qwen2.5-VL | 2025-01 | 3B, 7B, 72B, later 32B | Dynamic frame rates, real-time localization, document and GUI work |
| Qwen3-VL | 2025-09 | 2B, 4B, 8B, 32B, 30B-A3B, 235B-A22B | DeepStack, Thinking variants, 256K context, spatial reasoning |
| Qwen3.5 | 2026-02 | 0.8B through 397B-A17B | Unified multimodal models, hybrid linear attention, native agents |

Two related branches sit beside this line. Qwen-VL-Plus and Qwen-VL-Max were proprietary API products released from late 2023 into early 2024. They had no matching open weights. QvQ-72B-Preview was an experimental visual-reasoning branch released in December 2024. Qwen3-VL later brought explicit Thinking models into the main family.

## Qwen-VL connects a vision tower to Qwen

The [Qwen-VL paper](https://arxiv.org/abs/2308.12966) describes a direct three-part system. An OpenCLIP ViT-bigG encoder contributes about 1.9B parameters. A Qwen-7B language model contributes about 7.7B according to the paper table. A randomly initialized, single-layer cross-attention adapter adds about 0.08B. The full model has roughly 9.6B parameters.

The adapter uses learned queries to compress encoder output into a fixed set of 256 visual tokens. The language model receives a stable input shape for every image. Dense documents and simple photographs must pass through the same token budget, so that convenience also creates an information bottleneck.

### Fixed resolution and spatial output

Visual pretraining begins at 224 pixels. Multitask training raises the input to `448 × 448`. Every image eventually enters a fixed canvas, which makes extreme aspect ratios, long screenshots, and tiny document text difficult.

Qwen-VL already supports visual grounding. Bounding boxes appear in the generated text, with coordinates normalized to `[0, 1000)`. Image dialogue, object references, and localization can therefore share one autoregressive output stream. The same interface supports multiple images and bilingual OCR.

### Three training stages

The official paper records three stages.

1. The alignment stage cleans about 1.4B examples from roughly 5B raw image-text pairs. It freezes the language model and trains the visual encoder plus adapter at 224 resolution.
2. Multitask pretraining raises the resolution to 448 and updates all parameters. Captioning, VQA, grounding, OCR, and pure-text tasks share this stage.
3. Instruction tuning uses about 350K dialogue examples. It freezes the visual encoder and updates the language model plus adapter to produce Qwen-VL-Chat.

The second stage includes 19.7M caption samples, 3.6M VQA examples, 24.8M OCR examples, and 8.7M examples each for referring grounding and grounded captioning. Another 7.8M pure-text examples help preserve language behavior.

### What the first release established

Official results include 79.5 on VQAv2, 63.8 on TextVQA, 65.1 on DocVQA, 65.7 on ChartQA, and 89.36 on RefCOCO val. The scores mainly established that an open bilingual model could combine general VQA, reading, and localization in one interface.

The constraints are equally informative. Resolution and visual-token count stay fixed. Native long-video processing is absent. The system behaves primarily as a visual dialogue model, with limited support for a continuing observation-action loop.

Qwen released Qwen-VL and Qwen-VL-Chat weights, followed by Int4, LoRA, and Q-LoRA support. These early weights use the custom Qwen License with commercial conditions. Apache 2.0 became standard for later generations.

## Qwen2-VL preserves image shape

Qwen2-VL was announced in August 2024. The 2B and 7B weights appeared first under Apache 2.0. The 72B model initially used API access and received open weights soon afterward. Public names use 2B, 7B, and 72B. The paper lists a shared vision encoder of about 675M parameters and language backbones around 1.5B, 7.6B, and 72B, which explains occasional references to an approximately 8B middle model in technical tables.

Naive Dynamic Resolution defines this release. Images keep their native aspect ratio and receive a variable number of visual tokens. A long webpage can preserve its vertical structure. A dense document can spend more tokens on small text. Compute and memory now vary with input pixels, so deployments need an explicit pixel budget.

### Two-dimensional position and token merging

The vision encoder replaces fixed absolute position embeddings with 2D-RoPE. An MLP merges each adjacent `2 × 2` group of patches before the language model, controlling token growth under dynamic resolution.

M-RoPE extends the language-side positional representation. Separate rotary dimensions encode temporal, height, and width coordinates. One language backbone can then represent word order, two-dimensional image layout, and video time.

### One interface for images and video

The video path uses a 3D convolution with temporal depth 2, combining neighboring frames. Static images are duplicated into two frames so both media types follow the same visual path. The official setup generally samples video at 2 fps and caps visual tokens at 16,384.

The model can handle videos longer than 20 minutes under this sampled representation. It does not preserve every original frame. Brief actions, transient text, and high-frequency state changes can fall between sampled frames.

### Training moves toward action

Qwen2-VL retains three broad stages covering vision training, full multimodal training, and instruction alignment. Its paper reports about 600B and 800B tokens across the main pretraining stages, roughly 1.4T multimodal tokens in total, with a data cutoff in June 2023.

The mixture adds document OCR, interleaved pages, video question answering, grounding, multi-turn dialogue, phone interactions, and robot tasks. Output can now drive an action. The model reads a screen, predicts a target location, receives the next screenshot, and continues.

Official 72B results include 96.5 on DocVQA, 85.5 on TextVQA, 877 on OCRBench, and 64.5 on MMMU. Video-MME reaches 71.2 without subtitles and 77.8 with subtitles. AITZ exact action match reaches 72.1. Documents, video, and visual action clearly receive more weight in this generation.

The 2B size opens edge experiments, 7B provides a practical deployment tier, and 72B serves quality-first environments. All released Qwen2-VL weights use Apache 2.0.

## Qwen2.5-VL treats time and interfaces as first-class data

Qwen2.5-VL launched in January 2025 with 3B, 7B, and 72B Base and Instruct weights. A 32B-Instruct model with human preference alignment followed in March. All four scales use Apache 2.0.

The visual encoder is trained from scratch. The paper specifies hidden size 1280, 32 layers, and patch size 14. Most blocks use window attention with window size 112. Blocks 7, 15, 23, and 31 use global attention. Window blocks save compute while periodic global blocks exchange information across the image. Four neighboring visual patches are merged before reaching the language model.

### Dynamic frame rate and clock time

Qwen2.5-VL introduces dynamic FPS and aligns temporal M-RoPE positions with actual time. Videos with different frame rates can share seconds as a common scale, which makes event localization in natural-language answers easier.

Official materials describe videos longer than one hour and second-level temporal grounding. These claims still depend on sampling and token compression. Sparse frames work for major events. Millisecond actions and rapidly changing subtitles require denser sampling or a separate segmentation pass.

### The 4.1T-token training program

The [Qwen2.5-VL paper](https://arxiv.org/abs/2502.13923) reports about 4.1T total tokens.

1. About 1.5T tokens train the visual encoder with sequence length 8192.
2. About 2T tokens train all multimodal parameters at the same sequence length.
3. About 0.6T tokens extend full-parameter training to sequence length 32768.

The data spans captioning, knowledge, OCR, interleaved text and images, VQA, video, grounding, documents, agent trajectories, and pure text. Post-training also uses filtering and rejection sampling for instruction quality.

The official papers contain one accounting discrepancy. The Qwen2-VL report gives about 1.4T tokens for its own training. The Qwen2.5-VL report later describes Qwen2-VL as 1.2T. The papers may count different subsets. This article preserves each source's number without inventing a combined value.

### Structured perception becomes an action interface

Qwen2.5-VL outputs points or boxes and can convert scanned pages, tables, charts, and layout into stable JSON. GUI systems therefore need less fragile text parsing. A controller can consume the coordinates, execute a click, return a new screenshot, and continue the loop.

Official 72B scores include 70.2 on MMMU, 74.8 on MathVista, 79.8 on CC-OCR, and 93.6 on CountBench. ScreenSpot Pro reaches 43.6 and AndroidWorld reaches 35.0. Perception and action now appear together in the evaluation set.

GUI scores do not guarantee unattended reliability. Scaling, themes, popups, and latency can move targets. Production controllers need action limits, step-by-step screenshots, state checks, and confirmation gates for payments, deletion, or sending messages.

## Qwen3-VL injects visual features deeper into reasoning

Qwen3-VL arrived in stages from September 2025. The first release contained 235B-A22B Instruct and Thinking. Qwen later added 30B-A3B, 2B, 4B, 8B, and 32B. Four dense sizes and two MoE sizes cover local experiments through multi-node serving. Major scales offer direct Instruct behavior and explicit Thinking behavior.

Native context reaches 256K, and the official repository documents extension to 1M. Visual pixels and video frames still consume a token budget. A larger configured limit carries real KV-cache, prefill, and attention costs.

### SigLIP2, DeepStack, and interleaved position

The vision encoder moves to the SigLIP2 family while retaining dynamic resolution, 2D-RoPE, and `2 × 2` merging. DeepStack extracts features from three vision-encoder depths and injects them into the first three language-model layers. Fine texture and higher-level semantics no longer have to pass solely through the encoder's final representation.

Interleaved MRoPE also changes positional frequency allocation. Earlier M-RoPE assigned temporal, height, and width axes to contiguous frequency ranges. The interleaved version distributes all three axes across low and high frequencies more evenly.

Video time becomes explicit text. Tokens such as `<3.0 seconds>` accompany sampled frames. The model can cite time directly, and temporal localization connects cleanly to generated answers.

### Four pretraining stages and Thinking post-training

| Stage | Updated parameters | Data | Sequence length |
| --- | --- | --- | --- |
| S0 | Vision-language merger only | About 67B tokens | 8192 |
| S1 | All parameters | About 1T tokens | 8192 |
| S2 | All parameters | About 1T tokens | 32768 |
| S3 | All parameters | About 100B tokens | 262144 |

The mixture adds recaptioned images, long interleaved books, OCR and documents, grounding, counting, 3D and spatial relationships, code, STEM, video, and agent trajectories. Post-training uses long-chain SFT, teacher distillation, and reinforcement learning. The paper records about 1.2M SFT examples. Roughly one third are pure text and two thirds involve images or video. Training proceeds through 32K and 256K length phases.

Thinking helps with mathematical, spatial, and multi-step visual tasks while increasing latency and output length. Straight OCR, classification, or interface-element lookup often fits the Instruct path. A task router can reserve Thinking for cases that need it.

Official 235B-A22B results include 57.0 and 56.2 on MMLongBench-Doc for Instruct and Thinking. MuirBench Thinking reaches 80.1. EmbSpatial, RefSpatial, and RoboSpatial-Home reach 84.3, 69.9, and 73.9.

These abilities support web, desktop, and mobile agents. The model proposes actions from visual state. An external harness executes, checks, and rolls them back. A single coordinate error changes every later screenshot, so one-step benchmarks cover only part of the real failure surface.

## Qwen3.5 makes multimodality part of the main model

Qwen3.5 began with 397B-A17B in February 2026. Qwen then released 122B-A10B, 35B-A3B, 27B, 9B, 4B, 2B, and 0.8B. Every listed model uses Apache 2.0.

The official blog describes native vision-language pretraining with text, images, and video in one mixture. Qwen reports trillions of multimodal tokens and does not publish one exact auditable total. Any more specific training count would require speculation.

### A hybrid linear-attention backbone

The language backbone combines Gated DeltaNet and Gated Attention. Three linear-attention layers are followed by one full-attention layer, producing a repeated three-to-one ratio. Linear layers reduce long-sequence cost. Periodic full attention restores global interaction. Sparse variants combine this layout with MoE and use multi-token prediction.

The flagship 397B-A17B has 60 layers, hidden size 4096, about 397B total parameters, and roughly 17B active parameters per token. It has 512 experts, routes to 10, and includes one shared expert. The 60 layers form 15 repeated four-layer groups containing three Gated DeltaNet layers and one Gated Attention layer.

The dense 27B model has 64 layers and hidden size 5120, arranged as 16 copies of the same four-layer pattern. Qwen3.5 uses a vocabulary of 248,320 entries, summarized by Qwen as about 250K, and supports 201 languages and dialects.

The visual path continues the dynamic encoder design of Qwen3-VL. Official model cards provide image-text examples, and video belongs to the stated native multimodal capability. Visual sampling, pixel limits, and memory still constrain long documents and video even when the language backbone scales efficiently.

### Context and reported results

Open weights have a native context length of 262,144. Official configuration extends this to 1,010,000 tokens, and hosted Qwen3.5-Plus defaults to 1M. Long-context serving requires separate measurement of KV cache, prefill latency, and concurrency. The maximum supported length rarely gives the cheapest operating point.

Official 397B-A17B results include 85.0 on MMMU, 79.0 on MMMU-Pro, 88.6 on MathVision, 90.3 on MathVista, 90.8 on OmniDocBench 1.5, and 82.0 on CC-OCR.

The dense 27B reaches 82.3 on MMMU and 86.0 on MathVision. Video-MME reaches 82.8 without subtitles and 87.0 with subtitles. ScreenSpot Pro, OSWorld-Verified, and AndroidWorld reach 70.3, 56.2, and 64.2. This model provides a practical single-machine route to strong visual reasoning, video, and interface actions.

## The generational changes in one view

| Dimension | Qwen-VL | Qwen2-VL | Qwen2.5-VL | Qwen3-VL | Qwen3.5 |
| --- | --- | --- | --- | --- | --- |
| Image resolution | Fixed 448 | Native dynamic resolution | Dynamic resolution with efficient windowed ViT | SigLIP2 and DeepStack | Dynamic vision within the unified model |
| Visual tokens | Fixed 256 | Scale with image size | Scale with pixel budget and task | Multi-depth features enter the language backbone | Work with hybrid long-sequence attention |
| Position | Fixed 2D position | 2D-RoPE and M-RoPE | Time aligns to real seconds | Interleaved MRoPE and text timestamps | Native image-video position handling continues |
| Video | No native long-video design | 2 fps sampling and a shared image-video path | Dynamic FPS and videos beyond one hour | Long video, temporal grounding, and Thinking | Unified multimodal agent input |
| Action | Boxes and VQA | Phone and robot tasks | Points, boxes, JSON, and GUI | Web, desktop, and mobile agents | Native multimodal tool use and action |
| Context | Early dialogue lengths | Bounded by visual-token caps | Long training at 32K | Native 256K with 1M extension | Native 262K with extension near 1M |

The durable trend is content-dependent visual allocation. Real-time video position, structured output, and multi-depth injection follow. Agent behavior becomes more reliable only after the model preserves the visual details needed for the next action. A larger language backbone cannot recover small text lost during resizing or events missed between sampled frames.

## Deployment choices

### Historical work and lightweight baselines

Qwen-VL remains useful for reproducing the first generation and studying fixed visual-token interfaces. Its license, dependencies, and capabilities make it a poor default for new products.

Qwen2-VL gives researchers a clean dynamic-resolution and M-RoPE baseline. The 2B model supports edge experiments, while 7B covers common OCR, VQA, and short-video tasks. Document structure, long-video timing, and GUI behavior remain behind Qwen2.5-VL.

### Documents, video, and GUI

Qwen2.5-VL remains a practical specialist family. The 3B and 7B models fit local OCR, receipts, and page understanding. The 32B model offers a useful cost-quality point, while 72B serves quality-first infrastructure. It is a strong fit for second-level video localization, stable JSON, point output, and GUI operation.

Qwen3-VL suits long documents, spatial reasoning, explicit Thinking, and multi-step visual agents. Dense 8B and 32B models are operationally straightforward. The 30B-A3B uses low active parameters with larger total capacity. The 235B-A22B requires multi-GPU serving. Low active parameters do not remove full-weight storage, communication, and memory-management costs for MoE.

### Unified text and multimodal agents

Qwen3.5 simplifies systems that want one model for text, images, video, and tools. The 0.8B, 2B, and 4B sizes fit capability probes and constrained devices. The 9B and 27B models target higher-quality local inference. Sparse 35B-A3B and 122B-A10B models cover larger deployments, while 397B-A17B needs mature distributed serving.

Measure inputs before choosing parameter count. Document systems should record pixels per page and page count. Video systems need an explicit FPS, frame cap, and duration distribution. GUI systems should account for context growth across consecutive screenshots. Model-card context length is a ceiling. Everyday throughput follows the normal input distribution.

### Quantization, licenses, and runtime versions

Qwen-VL uses a custom license. Mainline families from Qwen2-VL onward generally use Apache 2.0, though every model card should be checked before deployment. Qwen publishes AWQ, GPTQ, or other low-bit variants for selected releases. Quantization can affect tiny-text OCR, coordinates, and fine-grained vision in ways that pure-text perplexity does not capture.

Dynamic-resolution runtimes usually expose minimum and maximum pixel settings. Lower caps save visual tokens and damage dense documents first. A small regression set built from real pages and videos should guide pixel budget, frame rate, quantization, and model size together.

## Open limitations

### Public benchmarks leave domain gaps

Official tables identify research priorities and cannot cover every input distribution. Noisy scans, handwriting, internal software, and specialist video may sit far outside public data. Cross-generation comparisons also inherit changing test sets, prompts, and judges.

### Long video still needs a sampling policy

One-hour processing comes from sampling, compression, and long context working together. Sparse sampling fits event summaries and can miss short actions. Dense sampling preserves detail and quickly consumes visual tokens. Reliable systems often segment scenes or events first, then raise the frame rate around uncertain sections.

### Long context does not create durable memory by itself

A model can receive more pages and frames while still forgetting early constraints, mixing repeated people, or carrying an incorrect summary forward. Streaming video and long tasks need external state, evidence pointers, and retrieval. Context length provides capacity. Memory updates and verification remain system responsibilities.

### GUI action needs an execution boundary

Layout changes, display scaling, popups, and latency can shift targets. One bad click changes all later states. The controller should compare each new screenshot with the expected state, request confirmation for high-risk actions, and preserve rollback information.

### Thinking has a real operating cost

Long reasoning can help mathematical, spatial, and multi-step tasks. Simple OCR and classification may gain little. More output raises latency and can elaborate an incorrect observation. Task-based routing and external checks usually provide a better operating point than forcing long thought on every request.

## Closing view

The Qwen-VL line gradually opens the visual interface. Fixed images become dynamically sized inputs. Frame indices gain real clock time. Final visual features expand into multi-depth injection. Coordinates and interface actions then let vision participate in a complete task loop.

Qwen3.5 brings this work into the main model family, so official naming no longer needs the VL suffix. Production systems still have to manage pixels, frame rates, context, execution permissions, and regression tests. Perception sets the starting point. Reliable completion over a long trajectory still depends on the system around the model.
