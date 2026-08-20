---
title: "From Qwen-VL to Qwen3.5, How Five Generations Rebuilt the Visual Interface"
description: "A source-checked account of how Qwen-VL, Qwen2-VL, Qwen2.5-VL, Qwen3-VL, and Qwen3.5 changed visual tokens, dynamic resolution, video time, deep visual injection, and hybrid attention."
pubDate: 2026-08-12
updatedDate: 2026-08-19
readingTime: "55 min"
tags: ["Vision-Language Model", "Qwen", "Multimodal"]
lang: "en"
translationKey: "qwen-vl-evolution"
tocDepth: "chapters"
featured: true
draft: false
sources:
  - label: "Qwen-VL paper"
    url: "https://arxiv.org/abs/2308.12966"
  - label: "Qwen-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen-vl/"
  - label: "Qwen-VL official repository"
    url: "https://github.com/QwenLM/Qwen-VL"
  - label: "Qwen-VL-Chat official model card"
    url: "https://huggingface.co/Qwen/Qwen-VL-Chat"
  - label: "Qwen2-VL paper"
    url: "https://arxiv.org/abs/2409.12191"
  - label: "Qwen2-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen2-vl/"
  - label: "Qwen2-VL official repository"
    url: "https://github.com/QwenLM/Qwen2-VL"
  - label: "Qwen2-VL-7B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct"
  - label: "Qwen2.5-VL paper"
    url: "https://arxiv.org/abs/2502.13923"
  - label: "Qwen2.5-VL official blog"
    url: "https://qwenlm.github.io/blog/qwen2.5-vl/"
  - label: "Qwen2.5-VL-32B official blog"
    url: "https://qwenlm.github.io/blog/qwen2.5-vl-32b/"
  - label: "Qwen2.5-VL official repository"
    url: "https://github.com/QwenLM/Qwen2.5-VL"
  - label: "Qwen2.5-VL-7B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct"
  - label: "Qwen3-VL paper"
    url: "https://arxiv.org/abs/2511.21631"
  - label: "Qwen3-VL official repository"
    url: "https://github.com/QwenLM/Qwen3-VL"
  - label: "Qwen3-VL-8B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct"
  - label: "Qwen3-VL-235B-A22B-Instruct official model card"
    url: "https://huggingface.co/Qwen/Qwen3-VL-235B-A22B-Instruct"
  - label: "Qwen3.5 official blog"
    url: "https://qwen.ai/blog?id=qwen3.5"
  - label: "Qwen3.5 official repository"
    url: "https://github.com/QwenLM/Qwen3.5"
  - label: "Qwen3.5-27B official model card"
    url: "https://huggingface.co/Qwen/Qwen3.5-27B"
  - label: "Qwen3.5-397B-A17B official model card"
    url: "https://huggingface.co/Qwen/Qwen3.5-397B-A17B"
---

## Abstract

Putting five Qwen multimodal generations side by side reveals a route that keeps changing, the route by which visual evidence reaches the language model. Leaderboard positions record the resulting systems. Qwen-VL compressed every fixed-size image into 256 visual tokens and established a stable interface. Qwen2-VL kept the image aspect ratio, made token count depend on image area, and introduced multimodal rotary position encoding for text, images, and video. Qwen2.5-VL aligned video positions with real seconds and used window attention to control the cost of high-resolution vision. Qwen3-VL added DeepStack, which injects several visual depths into the early language layers. Qwen3.5 then removed the separate VL family name and trained images, video, text, tool use, and long context as parts of one model family.

The five generations repeatedly address the same engineering constraints. More visual detail lengthens the sequence. Video needs elapsed time in addition to frame order. Sending richer features into language changes throughput and memory. Each generation resolves part of this set and introduces a new budget, position, or evaluation problem.

This article uses papers, official blogs, official repositories, and official model cards. It separates training designs reported in papers, facts directly visible in public configuration files, and interpretations that connect those facts. Benchmark values are official reported results. Prompt templates, input budgets, judges, and dataset versions differ across reports, so the numbers show changing priorities rather than a controlled cross-generation ranking.

## Reading conventions

Three evidence labels guide the discussion.

- **Paper report** means an architecture, training choice, ablation, or score stated by the authors.
- **Public configuration** means a parameter that can be read from an official checkpoint, processor, or repository.
- **Interpretation here** means an analysis used to connect generations, without presenting it as an official claim.

The name of the final generation also needs care. There is no separately released official family called `Qwen3.5-VL`. Qwen3.5 model cards list image and video input as native capabilities, and the checkpoints use names such as `Qwen3.5-27B` and `Qwen3.5-397B-A17B`. This article follows that official naming.

## Five generations on one line

<figure class="concept-figure concept-timeline">
  <div class="concept-figure__track">
    <div class="concept-figure__stop"><span class="concept-figure__year">2023</span><strong>Qwen-VL</strong><small>Fixed 256 visual tokens</small></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__stop"><span class="concept-figure__year">2024</span><strong>Qwen2-VL</strong><small>Dynamic resolution and M-RoPE</small></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__stop"><span class="concept-figure__year">2025</span><strong>Qwen2.5-VL</strong><small>Dynamic FPS and window attention</small></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__stop"><span class="concept-figure__year">2025</span><strong>Qwen3-VL</strong><small>DeepStack and 256K</small></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__stop"><span class="concept-figure__year">2026</span><strong>Qwen3.5</strong><small>Unified model and hybrid attention</small></div>
  </div>
  <figcaption>Figure 1. Five generations repeatedly redesign the interface between visual input, position, and the language backbone.</figcaption>
</figure>

| Generation | First release | Open model sizes | Main visual-interface change |
| --- | --- | --- | --- |
| Qwen-VL | August 2023 | About 9.6B total parameters | Fixed resolution and learned-query compression to 256 tokens |
| Qwen2-VL | August 2024 | 2B, 7B, 72B | Dynamic resolution, two-dimensional visual position, and video time in M-RoPE |
| Qwen2.5-VL | January 2025 | 3B, 7B, 72B, followed by 32B | Dynamic FPS, absolute-time alignment, window attention with a few global layers |
| Qwen3-VL | September 2025 | 2B, 4B, 8B, 32B, 30B-A3B, 235B-A22B | Multilevel DeepStack injection and native 256K context |
| Qwen3.5 | February 2026 | 0.8B through 397B-A17B | Unified multimodal pretraining and hybrid linear and full attention |

The table follows the open main line. Qwen-VL-Plus and Qwen-VL-Max are closed API products. QvQ-72B-Preview is a visual-reasoning experiment. They influenced later work, but they do not add another open architecture generation to the sequence examined here.

## Chapter 1  Qwen-VL establishes a stable visual channel

### 1.1 How the three modules connect

The [Qwen-VL paper](https://arxiv.org/abs/2308.12966) gives a direct architecture. Its visual encoder is OpenCLIP ViT-bigG, reported at about 1.9B parameters. The language backbone comes from Qwen-7B, listed as about 7.7B in the parameter table. A randomly initialized one-layer cross-attention adapter sits between them and contributes about 0.08B parameters. The total is about 9.6B.

An input image becomes a sequence of patch features in the vision encoder. The adapter holds learned queries that read this sequence through cross-attention, then projects the result to the language hidden size. The public `Qwen-VL-Chat` configuration shows an image size of 448, a patch size of 14, vision width 1664, 48 vision layers, and output width 4096. The official vision module uses 256 queries by default.

Dividing 448 by 14 yields 32, so the vision tower first sees a 32 by 32 grid with 1,024 patch positions. The adapter delivers only 256 visual tokens to the language model. The ratio alone does not measure information loss because each output token can aggregate many patches through cross-attention. It still defines a fixed capacity. A simple photograph, a dense document, and a tall screenshot all pass through the same opening.

<figure class="concept-figure concept-funnel">
  <div class="concept-figure__flow">
    <div class="concept-figure__panel"><strong>448 × 448 image</strong><span>Fixed canvas</span></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__panel concept-figure__panel--wide"><strong>32 × 32 patches</strong><span>1,024 visual positions</span></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__panel concept-figure__panel--accent"><strong>256 queries</strong><span>Cross-attention pooling</span></div>
    <div class="concept-figure__arrow" aria-hidden="true">→</div>
    <div class="concept-figure__panel"><strong>Qwen-7B</strong><span>Joint generation with text</span></div>
  </div>
  <figcaption>Figure 2. The fixed Qwen-VL visual funnel. Learned queries pool 1,024 patch positions into 256 visual tokens.</figcaption>
</figure>

### 1.2 Why a fixed interface made sense

The central 2023 task was to make an existing language model consume visual evidence reliably. A fixed sequence of 256 visual tokens offered predictable batching, memory planning, and image-segment length. Multiple images could still be organized with consistent start and end markers. Training did not yet have to solve arbitrary aspect ratios and very long visual position grids.

The cost was concrete. Every image had to fit a fixed canvas. A wide poster, a tall web page, or a dense table lost small details while being resized. A simple image could not use fewer tokens, and a complex page could not request more. The learned queries aggregated globally, but local text might already have become unreadable before aggregation.

Qwen-VL already supported grounding. It generated bounding boxes normalized to `[0, 1000)` inside the text sequence. Descriptions, questions, and spatial localization therefore shared one generative interface. Later GUI action, layout understanding, and spatial reasoning all depend on returning language to a two-dimensional location in a related way.

### 1.3 What the three training stages do

The paper separates visual-language pretraining, multitask pretraining, and supervised fine-tuning. The trainable modules, resolution, and data mixture change across stages.

| Stage | Main input | Resolution | Trainable parameters | Reported scale and purpose |
| --- | --- | --- | --- | --- |
| Visual-language pretraining | Image-text pairs | 224 | Vision tower and adapter, with language model frozen | About 5B raw pairs cleaned to about 1.4B, building visual-language alignment |
| Multitask pretraining | Captioning, VQA, OCR, grounding, and text | 448 | All parameters | 19.7M captions, 3.6M VQA, 24.8M OCR, 8.7M each for referring grounding and grounded captions, plus 7.8M text samples |
| Supervised fine-tuning | Multiturn instruction data | 448 | Language model and adapter, with vision tower frozen | About 350K examples for chat and instruction following |

The cleaned image-text mixture in stage one is reported as 77.3 percent English and 22.7 percent Chinese. Stage two raises the resolution and combines OCR, question answering, and grounding. Stage three freezes the vision tower, reducing the risk that a comparatively small instruction set will rewrite its visual representation.

This curriculum reveals the initial engineering split. Vision first learns what to see while the language model keeps its existing capability. Full joint training follows once alignment is established. A smaller dialogue set then shapes the user interface. Later generations train at a much larger scale, yet the rhythm of alignment, broad task learning, and long-context specialization remains visible.

### 1.4 What the reported results establish

The Qwen-VL paper reports 79.5 on VQAv2, 63.8 on TextVQA, 65.1 on DocVQA, and 65.7 on ChartQA. RefCOCO validation grounding accuracy is 89.36. In the 2023 open-model setting, these results showed that a general language model connected through a vision tower and a small adapter could cover natural-image questions, text reading, charts, and region localization.

They do not establish that 256 tokens were enough for every image. OCR and document results also depend on image resizing, visual data, the language backbone, and output parsing. The defensible conclusion is that Qwen-VL supplied a working baseline against which later interface changes could be measured.

## Chapter 2  Qwen2-VL lets an image keep its shape

### 2.1 What Naive Dynamic Resolution changes

The [Qwen2-VL paper](https://arxiv.org/abs/2409.12191) replaces fixed visual length with dynamic length. The processor rescales an image under size constraints while making both dimensions divisible by the patch and merge grid. Long edge, short edge, and total area are bounded, and the eventual token count follows the resized area.

The official 7B processor configuration gives 3,136 as the minimum pixel count, equal to four regions of `28 × 28`. Its maximum is 12,845,056 pixels, equal to 16,384 such regions. The value 28 combines a 14-pixel patch with a 2 by 2 spatial merge. This is a theoretical processor range. Deployments commonly set a lower `max_pixels` because 16,384 visual tokens, plus text, impose substantial memory and compute costs.

The vision encoder no longer relies on a fixed absolute position table. The paper removes absolute position embeddings and uses two-dimensional rotary position encoding in attention. After the vision tower, an MLP merges each neighboring 2 by 2 patch group, halving both spatial axes. For a resized image of `H × W`, visual content length is approximately given by the following expression.

`N_visual = H / 28 × W / 28`

Image start and end markers add to the sequence. The paper uses a 224 by 224 example. A 14-pixel patch produces 256 patches, the 2 by 2 merge leaves 64 visual content tokens, and the boundary markers bring the total to 66.

<figure class="concept-figure concept-resolution">
  <div class="concept-figure__compare">
    <div class="concept-figure__column">
      <strong>Qwen-VL</strong>
      <div class="concept-figure__canvas concept-figure__canvas--fixed"><span>Every image enters one canvas</span></div>
      <small>Fixed 256-token output</small>
    </div>
    <div class="concept-figure__divider" aria-hidden="true">↔</div>
    <div class="concept-figure__column">
      <strong>Qwen2-VL</strong>
      <div class="concept-figure__canvas-row"><span class="concept-figure__canvas concept-figure__canvas--portrait">Portrait</span><span class="concept-figure__canvas concept-figure__canvas--wide">Wide</span><span class="concept-figure__canvas concept-figure__canvas--small">Small</span></div>
      <small>Token count follows resized area</small>
    </div>
  </div>
  <figcaption>Figure 3. Fixed and dynamic resolution. Dynamic resolution preserves aspect ratio while turning visual length into a configurable budget.</figcaption>
</figure>

### 2.2 Dynamic resolution reallocates information

An image containing a large road sign does not need the same visual budget as a dense contract page. Dynamic resolution lets the caller allocate tokens by task. OCR, tables, and interface screenshots can keep more pixels. Ordinary photographs can be reduced for higher throughput. Extreme panoramas still need tiling or downscaling, but they are no longer forced into a square first.

The freedom has a cost. Doubling visual tokens lengthens the sequence processed by the language backbone. Attention memory, KV cache, and time to first token all change. Large length variation inside a batch can also reduce efficiency through padding or scheduling imbalance. Dynamic resolution turns an architectural constant into a resource knob managed by the deployment.

The table estimates several inputs on the 28-pixel merged grid. A real processor adjusts dimensions to satisfy its limits and divisibility rules, so these values are for scale.

| Resized image | Merged visual content tokens | Suitable use | Main cost |
| --- | --- | --- | --- |
| 224 × 224 | 64 | Single objects, coarse classification, cheap preview | Small text and fine detail disappear easily |
| 448 × 448 | 256 | Ordinary photos and basic questions | Similar output count to the first-generation bottleneck |
| 896 × 896 | 1,024 | Documents, charts, and interfaces | Language prefill grows materially |
| 1,344 × 1,792 | 3,072 | Dense pages and large screenshots | High first-token latency and memory pressure |

### 2.3 How images and videos share the vision tower

Qwen2-VL uses a three-dimensional convolution with temporal depth for visual patches. The spatial patch is 14 by 14 and the temporal patch depth is 2. Video can group adjacent frames into one temporal unit. A still image lacks a second frame, so the paper duplicates it into two identical frames and sends both images and video through the same patch embedding.

The shared entrance avoids maintaining separate encoders. An image behaves like a very short visual segment with no change, while video is a sequence of spatial grids across time. The later spatial merge stays the same.

Duplication does not create temporal evidence. It only satisfies the convolutional interface. Frame sampling still decides what the model sees. If a decisive action falls between samples, later position encoding cannot recover the missing event.

### 2.4 How M-RoPE represents three coordinates

Text needs a one-dimensional order. An image needs height and width. Video adds time. Multimodal rotary position encoding allocates rotary dimensions to temporal, height, and width coordinates.

Text tokens use the same index across all three axes and preserve ordinary one-dimensional order. Image tokens share one temporal index while height and width vary over the grid. Video tokens advance in time while keeping frame-local height and width. Text following a multimodal segment continues after the positions already used.

<figure class="concept-figure concept-mrope">
  <div class="concept-figure__axes">
    <div class="concept-figure__axis"><strong>Text</strong><span>t  0 1 2 3</span><span>h  0 1 2 3</span><span>w  0 1 2 3</span></div>
    <div class="concept-figure__axis"><strong>Image</strong><span>t  5 5 5 5</span><span>h  0 0 1 1</span><span>w  0 1 0 1</span></div>
    <div class="concept-figure__axis"><strong>Video</strong><span>t  7 7 8 8</span><span>h  0 1 0 1</span><span>w  0 0 1 1</span></div>
  </div>
  <figcaption>Figure 4. A conceptual M-RoPE layout. Text reuses one sequence index, images unfold a two-dimensional grid, and video adds time.</figcaption>
</figure>

The design solves how heterogeneous coordinates enter a single autoregressive sequence. It does not yet force a temporal step to represent a fixed number of real seconds. Two videos sampled to the same frame count can have different durations while receiving similar position spans. The next generation addresses this gap.

### 2.5 How to read the training scale and results

The Qwen2-VL paper reports cumulative training on about 1.4 trillion tokens, including visual tokens. Video is sampled at 2 frames per second during training, and each video is capped at 16,384 visual tokens. Loss is computed on text tokens. Image and video tokens condition the prediction rather than serving as next-token targets themselves.

The 72B model reports 96.5 on DocVQA, 85.5 on TextVQA, 877 on OCRBench, and 64.5 on MMMU. Video-MME is 71.2 without subtitles and 77.8 with subtitles. AITZ is 72.1. These results span documents, general visual knowledge, video, and mobile interface operation. Dynamic resolution supports a broader task portfolio rather than remaining a preprocessing convenience.

The later Qwen2.5-VL paper retrospectively lists Qwen2-VL pretraining at 1.2 trillion tokens, while the Qwen2-VL paper itself states about 1.4 trillion. The two primary sources use different counts. The careful treatment is to retain both statements without inventing an explanation involving cleaning, deduplication, or token accounting.

## Chapter 3  Qwen2.5-VL makes time and high-resolution cost explicit

### 3.1 What dynamic FPS corrects

The [Qwen2.5-VL paper](https://arxiv.org/abs/2502.13923) allows video sampling at different rates, including 0.5, 1, or 2 frames per second. Temporal positions no longer advance only by sampled-frame order. They align with frame timestamps and `tokens_per_second`, which is set to 2 in the official 7B configuration.

Consider one 20-second video sampled at 0.5 fps and another sampled at 2 fps. Adjacent sampled frames are two seconds apart in the first case and half a second apart in the second. A simple increment of one makes those intervals look identical. Absolute-time alignment assigns a larger position gap to the sparse sample and a denser scale to the other. The model can learn second-level location while accommodating both low-FPS long video and high-FPS short action.

<figure class="concept-figure concept-time">
  <div class="concept-figure__timeline-row"><strong>Qwen2-VL</strong><span class="concept-figure__tick">Frame 0</span><span class="concept-figure__tick">Frame 1</span><span class="concept-figure__tick">Frame 2</span><small>Position follows sample order</small></div>
  <div class="concept-figure__timeline-row"><strong>Qwen2.5-VL</strong><span class="concept-figure__tick">0.0 s</span><span class="concept-figure__gap">long gap</span><span class="concept-figure__tick">2.0 s</span><span class="concept-figure__gap">long gap</span><span class="concept-figure__tick">4.0 s</span><small>Position follows elapsed time</small></div>
  <div class="concept-figure__timeline-row"><strong>Qwen3-VL</strong><span class="concept-figure__tick">&lt;0.0 seconds&gt;</span><span class="concept-figure__tick">&lt;2.0 seconds&gt;</span><span class="concept-figure__tick">&lt;4.0 seconds&gt;</span><small>Readable timestamps enter the sequence</small></div>
  <figcaption>Figure 5. Three approaches to video time. Qwen2.5-VL aligns positions with real time, and Qwen3-VL exposes timestamps as text.</figcaption>
</figure>

More accurate time positions still do not replace sampling. At 0.5 fps, a quick gesture between two frames remains invisible. Even 2 fps cannot reconstruct fast motion. Dynamic FPS lets a system allocate density by content and budget. The model can only interpret frames it receives.

### 3.2 Why window attention matters

Dynamic resolution can produce thousands of visual tokens. Full self-attention in every vision layer grows quadratically with token count. Qwen2.5-VL uses window attention in most vision layers, allowing patches to interact locally, and retains global attention in a small set of layers.

The official 7B configuration shows a 32-layer vision encoder with hidden width 1280, 16 attention heads, and window size 112. Global attention indices are 7, 15, 23, and 31. With zero-based indexing, global exchange occurs every eighth layer. Local layers process detail, and four global layers communicate across windows.

<figure class="concept-figure concept-window-attention">
  <div class="concept-figure__layer-strip">
    <span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer concept-figure__layer--global">Global 7</span>
    <span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer concept-figure__layer--global">Global 15</span>
    <span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer concept-figure__layer--global">Global 23</span>
    <span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer">Local</span><span class="concept-figure__layer concept-figure__layer--global">Global 31</span>
  </div>
  <figcaption>Figure 6. The Qwen2.5-VL vision-attention rhythm. The diagram compresses the layer count and highlights global exchange every eight layers.</figcaption>
</figure>

Window attention confines most high-resolution encoding to local regions, but the global layers can still create compute peaks. The language backbone continues to process every merged visual token. The design redistributes cost without making resolution free.

### 3.3 Documents, interfaces, and localization in one output space

Qwen2.5-VL strengthens two structured output families. Document parsing must read text, recover reading order, and understand layout and tables. GUI operation must recognize an interface element and generate an executable action with a location. Both need fine visual input and a language model that produces stable formats.

The model continues to use normalized positions. An interface action can be represented by its type, target coordinate, and required arguments. A document response can contain text, layout boxes, or structured markup. Visual understanding and action share the autoregressive output space.

This does not make browser or phone automation intrinsically safe. Reported scores usually come from fixed environments, constrained action spaces, and repeatable tasks. Real interfaces include pop-ups, asynchronous loading, permission prompts, and irreversible actions. An execution system still needs refreshed screenshots, state checks, action allowlists, and human confirmation.

### 3.4 Three pretraining stages reach 4.1 trillion tokens

The paper divides Qwen2.5-VL pretraining into three stages totaling 4.1 trillion tokens. The count includes multimodal input under the paper's accounting.

| Stage | Token count | Maximum sequence length | Main focus |
| --- | --- | --- | --- |
| Stage 1 | 1.5T | 8,192 | Visual-language alignment with images and foundational text capability |
| Stage 2 | 2.0T | 8,192 | Broader data and tasks, including documents, charts, video, and multi-image understanding |
| Stage 3 | 0.6T | 32,768 | Long sequences, multiple images, and longer video |

Only part of the total training uses 32,768-token sequences, which reflects the cost of long-context optimization. Shorter sequences carry much of the foundational learning, while expensive long inputs are concentrated later. Public materials do not reveal enough sampling detail to reconstruct the exact proportion of every task.

### 3.5 Official results and their comparability limits

Qwen2.5-VL-72B reports 70.2 on MMMU, 74.8 on MathVista, 79.8 on CC-OCR, and 93.6 on CountBench. ScreenSpot Pro is 43.6 and AndroidWorld is 35.0. The tasks cover broad visual knowledge, visual mathematics, OCR, counting, and interface operation.

The improvement from Qwen2-VL to Qwen2.5-VL combines architecture, data, training scale, the language backbone, and post-training. Window attention or dynamic FPS cannot individually explain the full difference. Ablations support local design claims, while generation-level scores describe the complete system.

## Chapter 4  Qwen3-VL injects visual information deeper into language

### 4.1 Vision initialization and dimensions

The [Qwen3-VL paper](https://arxiv.org/abs/2511.21631) initializes the vision encoder from SigLIP 2. Larger models use SigLIP2-SO-400M by default, while the 2B and 4B variants use SigLIP2-Large. The official 8B configuration has 27 vision layers, hidden width 1152, 16 attention heads, a spatial patch of 16, temporal patch depth 2, and spatial merge size 2.

The basic visual grid therefore changes from the earlier 14-pixel patch to a 16-pixel patch. One merged visual token covers roughly a 32 by 32 pixel region. The official processor allows a shortest-edge total area of 65,536 pixels, equal to 256 squared, and a longest-edge total area of 16,777,216 pixels, equal to 4,096 squared. This remains a broad theoretical range. Practical limits depend on context and memory.

When the vision initialization, patch size, data, and language backbone all change, a generation-level gain cannot be assigned solely to DeepStack. The precise claim is that DeepStack adds a multilevel injection route. Overall performance comes from the full set of changes.

### 4.2 What DeepStack changes about single-point injection

Earlier models generally place the merged final vision representation into the language sequence and let language layers transform it. Shallow vision layers tend to retain local edges and textures, while deeper layers emphasize higher-level semantics. Delivering only the final representation asks language to rely on one compressed endpoint.

DeepStack selects three intermediate vision layers. Dedicated mergers transform their features and add them to the first three language hidden states. The official 8B configuration uses vision indices 8, 16, and 24. The original visual sequence still enters normally, and intermediate features arrive through addition, so they do not occupy extra context tokens.

<figure class="concept-figure concept-deepstack">
  <div class="concept-figure__stack">
    <div class="concept-figure__tower">
      <span>Vision layer 8</span><span>Vision layer 16</span><span>Vision layer 24</span><span>Final vision layer</span>
    </div>
    <div class="concept-figure__bridges">
      <span>Merger A →</span><span>Merger B →</span><span>Merger C →</span><span>Main merger →</span>
    </div>
    <div class="concept-figure__tower concept-figure__tower--language">
      <span>Language layer 1 receives detail</span><span>Language layer 2 receives mid-level features</span><span>Language layer 3 receives high-level features</span><span>Visual tokens enter the sequence</span>
    </div>
  </div>
  <figcaption>Figure 7. DeepStack sends three visual depths into early language layers without increasing autoregressive context length.</figcaption>
</figure>

The context length stays fixed, while dedicated mergers, additions, and retained vision outputs still consume compute and activation memory. The key advantage is that multiscale evidence bypasses the more expensive route of adding more language-sequence tokens.

### 4.3 Interleaved M-RoPE changes frequency allocation

The official 8B configuration enables `mrope_interleaved` with sections 24, 20, and 20. Earlier M-RoPE can assign temporal, height, and width coordinates to contiguous rotary frequency bands. The interleaved form distributes all three axes across lower and higher frequencies instead of confining one axis to one band.

Low frequencies naturally express broad position changes, while high frequencies are more sensitive to small displacements. Giving each coordinate access to several frequencies can represent both global and local relations. This is an interpretation of the RoPE frequency structure. Any measured benefit still depends on paper ablations and should not be used to claim that spatial mistakes disappear.

### 4.4 Video time becomes readable text

Qwen3-VL inserts textual video timestamps such as `<3.0 seconds>`. The official processor also supports hour-minute-second forms. A generated answer can directly refer to these markers, and event descriptions and temporal localization use a common text anchor.

This has a different emphasis from Qwen2.5-VL absolute-time positions. Rotary position writes time into hidden representation. A text timestamp writes time into the visible sequence. Text is easy to copy, compare, and inspect, though each timestamp consumes tokens and depends on correct sampling metadata.

### 4.5 Four pretraining stages extend context to 256K

The Qwen3-VL paper lists four stages. The first two establish and expand visual-language capability, and the later two extend context.

| Stage | Trainable modules | Training tokens | Maximum sequence | Purpose |
| --- | --- | --- | --- | --- |
| S0 | Visual merger only | 67B | 8,192 | Adapt visual representation to the language backbone |
| S1 | All parameters | About 1T | 8,192 | Joint foundational multimodal training |
| S2 | All parameters | About 1T | 32,768 | Longer documents, image sets, and video |
| S3 | All parameters | 100B | 262,144 | Native 256K context |

Official model cards list 262,144 as the native context length. It can accommodate long video, a complete document, or many images in one conversation, yet images, video, timestamps, prompts, tool results, and output all share the same budget. A 256K context is a common ledger, not a free allowance reserved for video.

### 4.6 How large-scale video evaluation is configured

The Qwen3-VL paper evaluates with as many as 2,048 frames and a 224K visual-token ceiling. VideoMMMU and MMVU use 768 tokens per frame, and other listed video benchmarks use 640. Charades-STA is sampled at 4 fps, while the other evaluations are generally at 2 fps.

These details matter when reading long-video scores. Models may receive very different frame counts and token budgets. The paper also lists external-model budgets, including 512 frames for Gemini, 256 for GPT-5, and 100 for Claude, and explicitly notes the resulting fairness limitation. A score alone can blur model capability with the amount of available evidence.

### 4.7 How to distinguish Thinking and Instruct

Qwen3-VL offers Instruct- and Thinking-oriented checkpoints. Thinking can emit a longer intermediate reasoning trace and may fit visual mathematics, complex spatial relations, and multistep questions. Instruct favors more direct responses and general interaction.

The choice depends first on the task and latency. Simple OCR or locating an interface element seldom needs a long output. Comparing several document pages or solving a geometry problem may benefit from a more developed reasoning process. Both remain constrained by input resolution, frame sampling, and evidence coverage. More generated text cannot restore a detail that never entered the model.

The 235B-A22B results illustrate the task dependence. MMLongBench-Doc is 57.0 for Instruct and 56.2 for Thinking. MuirBench Thinking is 80.1. EmbSpatial is 84.3, RefSpatial is 69.9, and RoboSpatial-Home is 73.9. Thinking does not automatically lead on every task because protocol and output format matter.

## Chapter 5  Qwen3.5 makes vision a default capability

### 5.1 Why the VL suffix disappears

The [Qwen3.5 official blog](https://qwen.ai/blog?id=qwen3.5) describes the family as natively multimodal. Official checkpoint names no longer separate a VL branch. Image and video processors ship with the models, and the chat template can organize text, images, video, and tool calls.

The name reflects the training and product form. Earlier users chose between a Qwen language model and a Qwen-VL model. Qwen3.5 treats both input families as part of one release line. Pixels and text still have different low-level encoders, and public configurations retain a vision encoder and merger. Pretraining, checkpoint packaging, and the user interface now make multimodality part of the main line.

### 5.2 How hybrid attention controls long-context cost

The Qwen3.5 language backbone alternates Gated DeltaNet linear-attention layers with standard Gated Attention layers. The official 397B-A17B card describes three Gated DeltaNet layers followed by one Gated Attention layer, repeated 15 times for 60 layers. The public 27B configuration repeats the same three-to-one pattern for 64 layers.

Linear attention uses recurrent state to summarize history and avoids full quadratic attention in every layer. Standard full-attention layers periodically let tokens access distant positions directly. The cycle places most layers on a path suited to long sequences while preserving regular global-interaction anchors.

<figure class="concept-figure concept-hybrid-attention">
  <div class="concept-figure__cycle">
    <span class="concept-figure__block concept-figure__block--linear">DeltaNet 1<br><small>Recurrent state</small></span>
    <span class="concept-figure__block concept-figure__block--linear">DeltaNet 2<br><small>Recurrent state</small></span>
    <span class="concept-figure__block concept-figure__block--linear">DeltaNet 3<br><small>Recurrent state</small></span>
    <span class="concept-figure__block concept-figure__block--full">Full attention<br><small>Global access</small></span>
    <span class="concept-figure__loop" aria-hidden="true">repeat</span>
  </div>
  <figcaption>Figure 8. The Qwen3.5 three-to-one language-layer rhythm. Linear attention carries most layers, and full attention periodically restores direct global interaction.</figcaption>
</figure>

Real speed depends on kernels, hardware, batch shape, sequence length, and cache implementation. A short input may not expose the advantage of a more complex hybrid operator. Long video and documents are more likely to benefit from controlled sequence scaling. Model cards list 262,144 native positions and support extension to roughly 1.01 million tokens. Extended settings add quality and memory tradeoffs and should not be treated as lossless native operation.

### 5.3 How to read dense and MoE variants

Qwen3.5 spans compact dense models, larger dense models, and mixture-of-experts models. In an MoE name, the first number is total parameters and the value after A is the approximate number activated for each token. The 397B-A17B checkpoint has about 397B total parameters and activates about 17B per token.

| Model range | Structure | Total parameter label | Active parameters per token | Practical deployment setting |
| --- | --- | --- | --- | --- |
| Qwen3.5-0.8B through 9B | Dense | 0.8B through 9B | Close to total size | Edge, one GPU, or low-cost serving |
| Qwen3.5-27B | Dense | 27B | 27B | High-memory workstation or tensor-parallel server |
| Qwen3.5-35B-A3B | MoE | 35B | About 3B | Expert weights still require storage, with lower per-token compute |
| Qwen3.5-122B-A10B | MoE | 122B | About 10B | Multi-GPU service with meaningful memory and communication cost |
| Qwen3.5-397B-A17B | MoE | 397B | About 17B | Datacenter multi-GPU deployment or hosted API |

Low active parameter count does not mean that only active weights occupy memory. Expert weights generally remain resident or must be scheduled efficiently, and routing adds communication and balancing overhead. Quantization reduces weight memory, while the vision encoder, caches, activations, and runtime overhead remain separate costs.

### 5.4 What public configurations show about continuity

The Qwen3.5-27B vision configuration has substantial continuity with Qwen3-VL-8B. Both use 27 vision layers, hidden width 1152, 16 heads, a 16-pixel spatial patch, temporal depth 2, and spatial merge 2. The Qwen3.5-27B configuration sets `deepstack_visual_indexes` to an empty list. For this public checkpoint, one cannot assume that the three Qwen3-VL DeepStack injection points remain active.

The language side changes more. Qwen3.5-27B has 64 layers and hidden width 5120, cycling through three linear-attention layers and one full-attention layer. Full attention uses 24 query heads, 4 KV heads, and head dimension 256. Linear layers separately use 16 key heads and 48 value heads with dimension 128. Vocabulary size is 248,320, native maximum position is 262,144, and interleaved multimodal sections are 11, 11, and 10.

These values describe one public configuration and do not imply that every Qwen3.5 size is identical. MoE checkpoints add expert count, routing top-k, and shared-expert parameters. The 397B-A17B card lists 512 experts, routes each token to 10 experts, and includes one shared expert.

### 5.5 The evidence boundary around training scale

Official material describes Qwen3.5 pretraining as tens of trillions of multimodal tokens, without giving a single exact total and a fully auditable data recipe. This article therefore does not supply a false-precision number. It is possible to confirm that training jointly covers text, images, video, and agent-oriented interaction data at a scale well above the few-trillion-token reports of earlier generations.

Raw scale does not define effective supervision. Pair quality, temporal coverage, document deduplication, OCR noise, action-trajectory success, and language distribution all matter. Without public sampling weights, a total token figure cannot reveal how much training any one task received.

### 5.6 What the official results emphasize

The 397B-A17B card reports 85.0 on MMMU, 79.0 on MMMU-Pro, 88.6 on MathVision, 90.3 on MathVista, 90.8 on OmniDocBench 1.5, and 82.0 on CC-OCR. The 27B card reports 82.3 on MMMU, 86.0 on MathVision, 82.8 on VideoMME without subtitles, 87.0 with subtitles, 70.3 on ScreenSpot Pro, 56.2 on OSWorld-Verified, and 64.2 on AndroidWorld.

The set spans visual knowledge, mathematics, documents, OCR, video, and computer use. Qwen3.5 is positioned beyond traditional image question answering. It must read screens, maintain state during longer tasks, call tools, and continue after receiving a new observation.

Cross-generation comparison still requires version and budget details. ScreenSpot Pro input resolution, coordinate output, prompt, and evaluation script can change. VideoMME scores differ substantially with subtitles. Model-card values confirm the official capability scope, while reproduction still requires pinned processors, templates, decoding settings, and dataset versions.

## Chapter 6  What the five architectures actually changed

### 6.1 From a fixed bottleneck to a managed budget

The first generation compressed every image to 256 visual tokens. From Qwen2-VL onward, visual length becomes a function of input area. The change raises the detail ceiling and transfers responsibility to the caller. The architecture no longer decides that every image gets exactly 256 positions. The service must set pixel budgets for different tasks.

DeepStack offers another route. It adds several levels of visual evidence to existing language hidden states instead of lengthening the token sequence. Qwen3.5 then changes the language backbone, using hybrid attention to reduce the pressure of global computation at every layer. Across five generations, compression, input length, hidden-state information flow, and sequence computation all move.

| Dimension | Qwen-VL | Qwen2-VL | Qwen2.5-VL | Qwen3-VL | Qwen3.5 |
| --- | --- | --- | --- | --- | --- |
| Image sizing | Fixed canvas | Dynamic resolution | Dynamic resolution | Dynamic resolution | Dynamic resolution |
| Visual length | Fixed 256 | Follows area | Follows area | Follows area | Follows area |
| Image and video entrance | Primarily image | Unified Conv3D | Conv3D with dynamic FPS | Video timestamps and unified processing | Unified multimodal model interface |
| Position mechanism | Fixed vision position and one-dimensional language position | 2D RoPE and M-RoPE | Absolute-time alignment | Interleaved M-RoPE | Interleaved M-RoPE |
| Vision computation | Global attention | Dynamic grids | Mostly window attention with a few global layers | SigLIP 2 initialization and DeepStack | Related vision front end, with no DeepStack indices in public 27B config |
| Language backbone | Qwen-7B | Qwen2 | Qwen2.5 | Qwen3 dense or MoE | Hybrid DeltaNet and full attention, dense or MoE |
| Native context | Short-context generation | 32K configuration | 32K training stage | 256K | 256K, with configured extension near 1M |

### 6.2 Time receives three different corrections

Qwen2-VL first gives video tokens a temporal coordinate. Qwen2.5-VL makes that coordinate correspond to real elapsed time. Qwen3-VL adds readable timestamps. The steps address the existence of time, the relationship between a position step and a second, and the ability to cite time directly.

All three depend on reliable media metadata. A bad container timestamp, mishandled variable frame rate, or a sampler that substitutes frame index for time sends incorrect evidence to the model. A video system should preserve mappings among original time base, sample time, and presentation time instead of passing only an array of frames.

### 6.3 Unified multimodality retains modality-specific behavior

Images still pass through a vision tower, while text enters through token embeddings. Visual length depends on pixels, and text length depends on tokenization. Video adds frame selection and timestamps. A unified model provides joint training, shared context, and one output interface. It does not erase the different cost and error sources of each modality.

This distinction helps diagnose systems. An OCR mistake should lead first to checks of resolution, image quality, and orientation. A missed video event should lead to the sampling trace. A failed tool action must be separated into proposed action, executor behavior, and the new observed state. Calling every problem a model-understanding failure hides the most fixable causes.

## Chapter 7  How to calculate a visual-token budget

### 7.1 Image budgets

Qwen2-VL and Qwen2.5-VL use a 14-pixel patch and a 2 by 2 spatial merge. One merged visual content token therefore corresponds roughly to a 28 by 28 pixel region. The public Qwen3-VL-8B configuration uses a 16-pixel patch, so one merged token covers about 32 by 32 pixels. Processor resizing and divisibility rules still adjust boundaries.

On the 28-pixel grid, 1,024 tokens correspond to roughly 802,816 pixels, which is close to an 896 by 896 square. A 4,096-token budget is near 1,792 by 1,792. Width and height can differ as long as area and grid constraints are similar.

### 7.2 Video budgets

Video length depends on sampled frames, resized area per frame, temporal patch grouping, and spatial merging. Raising FPS and raising frame resolution both lengthen the visual sequence, but they preserve different evidence. Fast action benefits from temporal density. Small text and interface state benefit from spatial detail.

<figure class="concept-figure concept-budget">
  <div class="concept-figure__budget-grid">
    <div class="concept-figure__budget-cell"><strong>FPS ↑</strong><span>Fewer short actions are missed</span><small>More frames and temporal tokens</small></div>
    <div class="concept-figure__budget-cell"><strong>Resolution ↑</strong><span>Text and small objects become clearer</span><small>More tokens in every frame</small></div>
    <div class="concept-figure__budget-cell"><strong>Duration ↑</strong><span>More of the process is covered</span><small>More total frames</small></div>
    <div class="concept-figure__budget-cell"><strong>Text context ↑</strong><span>More instructions and history survive</span><small>Shares the same total context</small></div>
  </div>
  <div class="concept-figure__budget-result">All four draw from context, memory, and time-to-first-token budgets</div>
  <figcaption>Figure 9. Four video-input knobs preserve different information while drawing from the same resource ledger.</figcaption>
</figure>

| Task | Preserve first | Compress first | Typical failure |
| --- | --- | --- | --- |
| Single-page OCR | Frame resolution | Empty borders and irrelevant margins | Small characters become unreadable |
| Long-video summary | Temporal coverage | Per-frame resolution and dense FPS | A brief decisive event is skipped |
| Action recognition | FPS and action region | Static background detail | Fast motion falls between samples |
| GUI operation | Clear current frame and refreshed screenshots | Irrelevant old states | The state after a click is never observed |
| Multi-image comparison | Distinguishable detail in each image | Duplicate views | Image order and references drift |

### 7.3 A budget procedure that can be run

Begin with the minimum evidence needed by the task. An invoice-total question mainly needs readable text. A goal-line question mainly needs temporal coverage. Next, place a hard ceiling on visual input and reserve context for the prompt, tool results, and output. Raise resolution or FPS on a small representative set and observe accuracy and latency. Finally, pin processor parameters together with the model version.

A useful budget log includes resized width and height, actual frame count, actual visual tokens, text tokens, time to first token, peak memory, and task correctness. Original image dimensions alone are insufficient because the processor can resize again before the model sees the input.

## Chapter 8  Choosing a model and deployment settings

### 8.1 Choose a generation from the evidence requirement

For an existing Qwen-VL application that only handles ordinary images and short context, much of the upgrade value comes from stronger vision and data. Documents, long screenshots, and unusual aspect ratios make dynamic resolution in Qwen2-VL and later more consequential. Long-video temporal localization, complex documents, and GUI work make Qwen2.5-VL a clearer capability boundary. Long context, spatial reasoning, and deeper visual injection point toward Qwen3-VL. A service that should handle text, vision, tools, and longer tasks through one model fits the Qwen3.5 product form.

| Requirement | Reasonable starting point | Configuration to validate first |
| --- | --- | --- |
| Low-cost image questions | Qwen2.5-VL 3B or Qwen3-VL 2B and 4B | Minimum pixels, quantization, OCR detail loss |
| Documents and charts | Qwen2.5-VL 7B or 32B, or Qwen3-VL 8B | Maximum pixels, page routing, structured output |
| Long video | Qwen3-VL or Qwen3.5 | FPS, tokens per frame, total frames, timestamp correctness |
| GUI agent | Qwen2.5-VL, Qwen3-VL, or Qwen3.5 | Screenshot refresh, coordinate mapping, action safety, recovery |
| Unified text and vision service | Qwen3.5 | Hybrid-attention kernel, context budget, tool protocol |
| High-accuracy datacenter service | Large Qwen3.5 MoE | Expert-weight memory, parallel communication, route balance |

### 8.2 Costs beyond model size

The same 7B model behaves very differently on a 224 by 224 image and on a high-resolution multipage document. End-to-end latency includes vision encoding, language prefill over visual tokens, generated-token cache, batch padding, and video decoding.

An MoE service must also separate arithmetic from resident weights. A3B or A17B describes active parameters, while the server still stores many experts. Expert parallelism depends on interconnect bandwidth. Small batches with dispersed routes can use hardware less efficiently than the active count suggests.

Quantization should be validated separately for reading, vision, and action. OCR can be sensitive to small logit changes, and one wrong coordinate token can move a click to a neighboring control. A small average benchmark change does not guarantee stable error rates on a critical workflow.

### 8.3 Why processor versions must be pinned

Dynamic resizing, frame sampling, timestamp text, and chat templates are largely processor behavior. The weights can stay fixed while a `transformers` or repository upgrade changes default FPS, pixel bounds, timestamp format, or image boundary markers.

A reproducible record should include model revision, processor revision, inference framework, chat template, `min_pixels`, `max_pixels`, video FPS, maximum frames, maximum generation length, and numeric precision. Video also needs its decoding library and time-base handling. These fields distinguish a weight change from an input or runtime change.

### 8.4 Safety boundaries for GUI and tool use

Interface benchmarks usually allow clicks, typing, and scrolling in a simulator or constrained environment. Real systems contain payment, deletion, sending, and permission changes. A visual model should sit behind a constrained executor.

The executor can validate action type and target region, and require confirmation for sensitive actions. It should take a fresh screenshot after every action and verify that the expected state arrived. When a control moves or a dialog covers it, old coordinates must expire. Logs should retain observation, action, execution result, and new state.

Model coordinates also need mapping back to the original screen. The input may have been resized or padded, and output is often normalized. Mapping must use the processor's actual transform and account for device pixel ratio, scroll offset, and window chrome. Many apparent grounding errors originate in this conversion.

## Chapter 9  Evaluating a multimodal system fairly

### 9.1 Fix input evidence before comparing models

A model comparison should first control image pixels, video frames, tokens per frame, and total context. If one model sees 2,048 frames and another sees 100, the outcome includes both model quality and evidence quantity. Each model can also be tested at its preferred budget, but that experiment should remain separate from equal-budget results.

The same applies to documents. A model that receives a full 4K page should not be compared as though it saw the same evidence as one limited to 896 pixels. Under dynamic resolution, preprocessing is part of the model setting.

### 9.2 Error decomposition is more useful than one score

Multimodal failures can be divided into perception, selection, temporal, reasoning, formatting, and execution errors. Perception means text or an object was not recognized. Selection means the decisive frame was never sampled. A temporal error reverses order or misplaces time. A reasoning error occurs even though the relevant evidence is visible. A format error breaks JSON, coordinates, or a tool argument. An execution error belongs to the browser, phone, or external API.

The decomposition points to the repair. Higher image resolution does not fix an invalid tool schema. A longer reasoning trace does not restore a skipped frame. A larger model may conceal some failures, but it can cost far more than correcting the input pipeline.

### 9.3 What should accompany a benchmark score

| Record | Why it matters |
| --- | --- |
| Model and processor revision | Weights and input logic can change independently |
| Input pixels and visual tokens | Dynamic resolution changes available evidence |
| Video FPS, frame count, and timestamps | They determine event coverage and temporal location |
| Prompt template and output constraints | They affect format, tool calling, and judging |
| Subtitle or OCR assistance | It can materially change video and document scores |
| Decoding parameters and output limit | They affect long and structured answers |
| Judge and dataset revision | Automatic evaluation and question updates move results |
| Latency, throughput, and peak memory | They determine whether the system can be deployed |

### 9.4 Practical limits when reproducing official scores

Papers may use internal inference infrastructure, a specific system prompt, or data-processing code that is not fully public. Model cards can update scores or recommended settings. Open weights make architecture and basic behavior inspectable without guaranteeing one-command reproduction of every table.

A useful workflow starts from the closest public official configuration, then builds a local equal-budget baseline. When results differ, image resizing, video backend, chat template, and answer parser deserve inspection before the weights. A report should include the full configuration and mark any internal step that cannot be verified.

## Chapter 10  Problems that remain open

### 10.1 More pixels also carry more noise

High resolution preserves small text and also introduces background texture, compression artifacts, and irrelevant interface regions. The language model must search a longer sequence. If a task only concerns one area, a full high-resolution image may cost more than finding and enlarging a crop.

A later system can combine a low-resolution overview with targeted crops. The first pass finds candidate regions and the second raises pixel budget only there. Evaluation must include the extra visual calls and total tokens.

### 10.2 Selection remains central to long video

Native 256K context and hybrid attention increase capacity, while real video can last for hours. Uniform sampling wastes budget on static periods and may miss a brief event. Subtitles, shot boundaries, audio changes, and cheap motion signals can help select candidates.

When a selector misses the decisive evidence, the main model may not know what it failed to see. A more reliable system supports revisiting, retains a temporal index, and can request denser sampling when uncertain. Reports should distinguish a single model input from a video system that performs external retrieval.

### 10.3 Time understanding remains limited by data and protocol

Readable timestamps expose seconds, but causal relations, duration, and concurrent events remain difficult. A model can repeat a frame timestamp correctly and still place an action boundary incorrectly. Annotation granularity, boundary noise, and question format all shape temporal behavior.

Evaluation should separate event retrieval, start and end localization, order, duration comparison, and cross-shot causality. One aggregate video score hides which relation fails.

### 10.4 Documents need layout and source fidelity

Reading page text is an early step. Cross-page tables, footnote references, two-column order, stamps, and handwriting can change meaning. A generative response can also fill in text that is absent.

High-stakes document systems should retain a page and region for every extracted field so users can inspect the source. Structured extraction needs schema validation, numeric checks, and a policy for missing values. When evidence is illegible, the system should say so rather than cover the gap with fluent prose.

### 10.5 Agents require an external state loop

A screenshot contains one moment. After an action changes the page, the model needs another observation. Network delays, asynchronous rendering, and permission dialogs can make the result differ from the plan. Long tasks add context growth and goal drift.

Reliable agents need state summaries, retained key screenshots, precondition and postcondition checks, timeouts, and recovery. The model proposes a next step, while the execution layer constrains permission and checks reality. A one-episode interface benchmark covers only a fraction of these conditions.

### 10.6 Open weights do not fully open training

Official papers provide architecture, stage scale, and many results, while full data inventories, cleaning rules, sampling weights, and infrastructure remain partly undisclosed. Researchers can inspect configuration and inference without reconstructing the training distribution item by item.

Cross-generation claims should therefore separate designs that can be checked from causes that cannot. A gain can arise jointly from the vision tower, language backbone, data, and post-training. Without an ablation, the strongest justified claim remains at the system level.

## Chapter 11  A practical way to read the next report

Begin a new multimodal report with the processor configuration. It tells you how many pixels and frames enter and how timestamps are formatted. Move to the vision configuration and check patch size, merge, local or global layers, and injection points. Then read the language configuration for context length, attention type, KV heads, and MoE routing. Return to training tables and benchmarks last, checking data accounting and input budgets.

This order avoids two common mistakes. One focuses on total model parameters while ignoring the cost variation caused by visual length. The other focuses on final scores and attributes a preprocessing or frame-budget change to the architecture alone.

| Source | First question | Mistake it prevents |
| --- | --- | --- |
| Processor configuration | How are images resized and videos sampled | Treating input differences as model differences |
| Vision configuration | What are the patch, merge, window, and injection settings | Inferring vision structure from a model name |
| Language configuration | How are context and attention organized | Treating theoretical length as free capacity |
| Training description | Are token counts and stages using the same accounting | Combining incompatible training totals |
| Benchmark protocol | Are frames, subtitles, prompts, and judges comparable | Turning unlike experiments into one ranking |

## Chapter 12  Following three real inputs through five generations

Architecture names can obscure scale. A two-column paper page, a ten-minute video, and one interface click make the processor's work more concrete. The calculations below estimate input volume and do not replace the output of a particular processor revision.

### 12.1 How one two-column paper page enters the model

Suppose an original page is 2,480 by 3,508 pixels, with two text columns, a figure, and a small table. Qwen-VL sends it into a fixed 448 by 448 canvas. The aspect ratio is about 0.71. If ratio is preserved with padding, the usable page width is only a little over 300 pixels. Characters that were a dozen pixels high can shrink to two or three. The 256 pooled tokens cannot recreate strokes lost in resizing.

Qwen2-VL can preserve aspect ratio and choose size under `max_pixels`. If the page becomes roughly 896 by 1,260, the 28-pixel merged grid gives about 32 by 45 visual content tokens, or 1,440. Text has much more sampling detail, while sequence length grows to more than five times that of a 448-square input. Twenty pages at the same setting already contribute about 28,800 visual tokens, before page markers, questions, and answers.

Qwen2.5-VL window attention mainly lowers the cost of encoding those 1,440 positions inside the vision tower. Their merged tokens still enter the language context. For a large document collection, a sensible pipeline usually retrieves candidate pages first and sends a small number of high-resolution pages to the model. A task involving cross-page tables or footnote references also needs neighboring pages and layout coordinates.

DeepStack in Qwen3-VL can pass earlier visual detail into the language backbone. It can help with small characters, thin lines, and table boundaries when sufficient pixels entered. No hidden-state injection can restore characters already reduced to a uniform block. Qwen3.5 hybrid attention is better suited to combining multiple page sequences, retrieval text, and a long question, but page selection and evidence localization remain necessary.

A document service therefore needs two coordinate systems. Original PDF coordinates support citations and source review. Processor-space coordinates support model localization. Padding, cropping, or tiling adds another mapping. Keeping only a normalized model box makes it difficult to place the answer accurately on the original page.

### 12.2 Document tasks must separate reading from inference

A question asking for a table value begins with reading. A question asking why two growth rates differ adds calculation and interpretation. If one digit is misread, a well-formed later argument still reaches the wrong conclusion. Evaluation should separate character recognition, cell assignment, cross-page relation, and numerical reasoning.

The model can return a page number and box with an answer, though the box itself can be wrong. A stronger system crops the claimed source region and performs a local verification pass. High-risk fields such as money, date, and dosage can also be checked with rules or a calculator. The multimodal model handles layout and context, while deterministic tools handle format and arithmetic.

Qwen's generative interface can produce Markdown, JSON, or text with boxes. A production system should parse and validate the output instead of assuming schema compliance. Field type, range, and required values need checks. A format-repair request can follow a parse failure, and automation should stop if repair also fails.

### 12.3 Why ten minutes of video become large quickly

Ten minutes is 600 seconds. Uniform 2 fps sampling yields 1,200 frames. Qwen2-VL and Qwen2.5-VL use temporal patch depth 2, which gives roughly 600 temporal units. At 448 by 448 per frame, each unit has about 16 by 16 positions after spatial merging, or 256 visual tokens. The rough total reaches 153,600 before special and text tokens.

The estimate explains why papers impose visual-token caps and why context length alone does not solve long video. At 224 by 224 per frame, each temporal unit has about 64 tokens and the total falls to 38,400. The full duration remains covered, while small text becomes harder to read. Dropping to 0.5 fps cuts frame count by another factor of four and makes brief actions easier to miss.

The public Qwen3-VL configuration uses a 16-pixel patch and 2 by 2 merge. A 448-square temporal unit has roughly 14 by 14 positions, or 196 tokens. The same 1,200 frames yield about 117,600 tokens. A real processor adjusts per-frame pixels under its total video budget, and paper evaluations set per-frame and total caps. These hand calculations are scale estimates rather than official defaults.

| Ten-minute setting | Approximate frames | Spatial tokens per temporal unit | Approximate visual tokens | Evidence favored |
| --- | --- | --- | --- | --- |
| Qwen2 family, 2 fps, 448-square | 1,200 | 256 | 153,600 | Action coverage and medium-size detail |
| Qwen2 family, 2 fps, 224-square | 1,200 | 64 | 38,400 | Action coverage with weaker text detail |
| Qwen2 family, 0.5 fps, 448-square | 300 | 256 | 38,400 | Sparse moments with higher spatial detail |
| Qwen3 family, 2 fps, 448-square | 1,200 | 196 | 117,600 | Dense temporal coverage and moderate detail |

The two 38,400-token rows show why total length is an incomplete description. One spends the budget on many low-resolution frames, and the other spends it on fewer high-resolution frames. They expose different evidence. Video optimization must ask whether a task depends more on temporal density or spatial detail.

### 12.4 Long video benefits from hierarchical viewing

A practical pipeline can scan the full video at low resolution and low FPS, producing shots, subtitle segments, or event candidates. It then increases FPS around candidate intervals and raises resolution for frames containing screen text. The main model receives the relevant clips and necessary context. If confidence is low, it can request neighboring intervals from the index.

This has become a system rather than one model call. It contains decoding, selection, indexing, and retrieval. A report should count all visual calls and latency, and state whether the selector saw the question. A question-conditioned selector participates in inference.

Subtitle provenance also matters. Burned-in subtitles are pixels. An external subtitle file is an additional text channel. Automatic speech recognition introduces transcription error. Benchmarks such as VideoMME report subtitled and unsubtitled settings separately, and deployment evaluation should do the same.

### 12.5 How one click closes the coordinate loop

Suppose the physical screen is 2,560 by 1,600 and the browser content screenshot is 2,200 by 1,300. The processor reduces it to 1,100 by 650, then pads to a divisible grid. A normalized model coordinate must first become a processor-canvas coordinate, have padding removed, scale back to the content region, and finally receive the window offset.

At 150 percent device scaling, CSS pixels and physical pixels differ. Browser automation often acts in CSS pixels, while a screenshot library may return device pixels. The mapping must know the unit of each interface. An error of a few dozen pixels can move a click from confirm to cancel.

An action may scroll, navigate, or open a dialog. The next step cannot reuse boxes from the previous screenshot. The executor waits for a stable page, captures again, checks the expected state, and supplies the new observation. A sensitive action should show the intended control and summary to the user before execution.

| Coordinate layer | Typical unit | Transform that must be retained |
| --- | --- | --- |
| Physical display | Device pixel | Window position and device scale |
| Browser content | CSS pixel | Chrome, toolbar, and scroll offset |
| Screenshot | Image pixel | Crop region and screenshot scaling |
| Processor canvas | Patch-aligned pixel | Resize, padding, and tile layout |
| Model output | Normalized coordinate or token | Normalization range and output format |

Qwen-VL already used `[0, 1000)` coordinates for grounding. Later models extend the idea to GUI actions. A consistent model representation is convenient, while a real click still passes through every mapping in the table.

### 12.6 Multi-image order is part of the evidence

Multi-image questions often refer to the first and second image. The processor encodes each item and inserts visual segments in message order. If an upstream downloader collects images in completion order, the sequence can change silently. A plausible answer may then describe the wrong object.

A reliable application assigns each image a stable identifier, includes the identifier and purpose in the prompt, and checks array order before and after processing. When an old image is referenced later in a conversation, the application must know whether the template reinserts visual tokens or preserves only a text reference. Cache behavior varies across inference stacks.

Large size differences can also let one image consume most of the visual budget. A common per-image `max_pixels` only bounds each item, not necessarily the complete message. The application needs a total visual-token ceiling and an explicit policy for shrinking, cropping, or rejecting an oversized request.

## Chapter 13  What public configurations reveal

Papers explain design intent, while configuration files show which modules an inference program actually constructs. They complement each other. One checkpoint configuration cannot stand in for a whole generation.

### 13.1 Four representative checkpoints

| Configuration | Qwen-VL-Chat | Qwen2-VL-7B | Qwen2.5-VL-7B | Qwen3-VL-8B |
| --- | --- | --- | --- | --- |
| Vision layers | 48 | 32 | 32 | 27 |
| Vision hidden width | 1,664 | 1,280 | 1,280 | 1,152 |
| Attention heads | 16 | 16 | 16 | 16 |
| Spatial patch | 14 | 14 | 14 | 16 |
| Temporal patch | Not applicable | 2 | 2 | 2 |
| Spatial reduction | Query pooling | 2 | 2 | 2 |
| Language hidden width | 4,096 adapter output | 3,584 | 3,584 | 4,096 |
| Distinct mechanism | 256 learned queries | Dynamic resolution and M-RoPE | Window attention and absolute time | DeepStack and interleaved M-RoPE |

The Qwen-VL value 4,096 is the adapter output width delivered to language. Its role resembles the language hidden widths shown for later generations, though the architecture differs. A single unlabeled column would hide that distinction.

Fewer vision layers also do not imply weaker vision. Initialization, width, data, attention pattern, and fusion all change. Parameter count describes one part of capacity.

### 13.2 Processor configuration is an input contract

The official Qwen2-VL and Qwen2.5-VL processors use 3,136 minimum pixels and 12,845,056 maximum pixels. These correspond exactly to 4 through 16,384 regions on a 28-pixel merged grid. They describe the theoretical processor range, while a service can choose narrower values per call.

The Qwen3-VL processor instead uses 65,536 as a shortest-edge area and 16,777,216 as a longest-edge area. Field names and values both change. Copying earlier `min_pixels` and `max_pixels` arguments into a new processor can have no effect or a different meaning. Migration code should inspect the current processor object and documentation instead of changing only the model ID.

Video also requires checking `fps`, `num_frames`, and backend behavior. One interface may decode toward a target frame rate, while another selects a fixed count uniformly. If both arguments are supplied, precedence is version-specific. Recording the final grid and time metadata returned by the processor is more reliable than recording only requested values.

### 13.3 Position settings cannot be inferred from names

Qwen3-VL-8B enables interleaved M-RoPE with sections 24, 20, and 20. Qwen3.5-27B also enables interleaving and changes the sections to 11, 11, and 10. The total depends on the model's rotary dimension and should not be copied across architectures.

Position extension also depends on the checkpoint and runtime. Official cards can recommend mechanisms such as YaRN. Beyond the native 262,144 positions, long-text retrieval, long-video localization, and short-input quality deserve separate tests. Good results on one 500K task do not establish stable behavior for every task near one million tokens.

Position bugs often produce no immediate exception. The model continues to generate fluent text while distant retrieval, spatial relation, or time localization degrades. A minimum test set should include short text, long text, multiple images, extreme aspect ratios, and videos with several frame rates.

### 13.4 DeepStack settings should not be inherited by default

Qwen3-VL-8B lists `deepstack_visual_indexes` as 8, 16, and 24. Qwen3.5-27B exposes an empty list under the same field. Their vision towers share many dimensions, while their injection settings differ. This is a case where configuration inspection is more informative than a family resemblance.

The empty list means that this 27B checkpoint does not select three intermediate vision layers through that field. It does not establish that every Qwen3.5 size disables DeepStack, or that no related mechanism appeared during training. The statement must remain scoped to the inspected official configuration.

An inference engine that hard-codes three indices can select invalid layers after migration. Official architecture registration and processor code are safer than forcing a new checkpoint through an older class. A third-party optimized backend must explicitly support the new model type. Similar names do not guarantee compatible kernels.

### 13.5 The Qwen3.5-27B hybrid layer schedule

The 27B configuration lists 64 language-layer types. Three `linear_attention` entries are followed by one `full_attention`, repeated 16 times. A runtime that only implements ordinary self-attention cannot load the model faithfully. A conversion may also change speed or numerical behavior.

Full-attention layers use grouped-query attention, with 24 query heads sharing 4 KV heads. This reduces KV cache. Linear layers have separate key heads, value heads, and recurrent-state dimensions. A serving stack must manage both cache forms.

The 397B-A17B model uses the same three-to-one rhythm for 60 layers and also adds MoE routing. Long-context service can be limited by expert-weight communication, recurrent state updates, periodic full-attention layers, or visual prefill. A real request trace is more informative than theoretical complexity alone.

### 13.6 Model cards change, so citations need dates or revisions

Official cards can add inference guidance, correct tables, and update framework requirements. Papers also change between revisions. This article is updated on August 19, 2026, and its configuration statements refer to official checkpoints available on that date.

A rigorous experiment can save a Hugging Face commit revision or repository hash. Recording a revision does not require duplicating every weight file. An API or local cache exposes it. A blog page cannot always be pinned, so an access date and an archived copy of the relevant table are useful.

Official sourcing also requires separating model-license terms from page and figure copyright. Facts and configuration values can be cited. Reusing a paper figure requires checking its license and attribution. The nine diagrams in this article redraw conceptual relationships in HTML and do not copy paper artwork.

## Chapter 14  Four research questions exposed by the five generations

### 14.1 Where should visual compression happen

Qwen-VL compresses vision to 256 tokens in the adapter. Qwen2 and later control length largely through input resizing and 2 by 2 merging. Qwen3-VL lets intermediate visual features bypass context length through DeepStack. Each location loses something different.

Input compression saves the most compute and can erase small text before recognition. End-of-vision compression pays the vision cost but can select from semantic features. Hidden-state injection preserves several scales without new tokens and couples vision more tightly to language. A future system may choose among these points by task or use a cheap overview before requesting a local high-resolution view.

A controlled study can fix total FLOPs and allocate them to input resolution, additional vision depth, extra visual output tokens, or DeepStack mergers. The task set should combine natural images, OCR, counting, and spatial grounding. One average score cannot show which evidence each compression point favors.

### 14.2 Should visual tokens have a different price

Current context usually counts a visual token and a text token as sequence positions. Their roles differ. Visual tokens primarily appear during prefill and are not generated one by one. Text participates in prefill and output. Consecutive video tokens also contain substantial redundancy.

Hybrid attention already changes the cost of handling long history. A further design could give vision and text different caches, sparse access, or hierarchical summaries. The difficulty is that a later reasoning step may need to revisit one small region. Early compression can remove the evidence for an unforeseen question.

Evaluation should include end-to-end cost. Dropping visual tokens in later layers lowers language compute, but an expensive selector in front may erase the saving. Vision encoding, selection, language prefill, decoding, and any revisits belong in the comparison.

### 14.3 Should time live in position, text, or an external index

Qwen2.5-VL writes absolute time into M-RoPE. Qwen3-VL writes timestamps as text. A video system can also keep a searchable temporal index. All three representations can coexist.

Position is compact and lets attention sense interval. Text is easy to generate and inspect. An external index scales past the model context and supports revisiting. They must share a time base. If a text marker says 10 seconds while an FPS error maps its position to 8 seconds, the model receives conflicting evidence.

Experiments should include variable frame rate, edit jumps, and long static periods. Event order, absolute time, and duration need separate measurement. Uniform short clips can make several representations appear equivalent and conceal their weaknesses.

### 14.4 How can a unified model retain specialist vision

Qwen3.5 makes multimodality a default model capability. Joint training shares language knowledge, tools, and long context. An imbalanced mixture can still dilute specialist OCR, fine localization, or long-video behavior.

The public record does not include complete sampling weights, so external research can measure interference behaviorally. With model size and input budget held fixed, compare text, images, video, and tool tasks. Then test whether small continued training improves one domain while damaging another.

The value of a unified model ultimately appears in system simplification and capability transfer. One checkpoint can read a document, inspect an operation video, call a calculator, and return to the page. This reduces routing and context movement. A system can still use specialist perception modules while the unified backbone plans and integrates evidence. Both designs need a clear record of how evidence moves between components.

## Chapter 15  A migration checklist for older systems

### 15.1 Preserve reproducible examples from the old system

Before migration, choose real inputs and save original media, final prompts, processor output dimensions, generations, latency, and memory. Include very wide and tall images, small-text pages, multiple images, short and long video, and coordinate outputs. An average benchmark does not replace these boundary cases.

If the old application has a custom chat template or image placeholder, save the exact template. Begin the new model with its official template and add business instructions one at a time. An old template can omit image boundary tokens, timestamps, or tool definitions required by the new checkpoint.

### 15.2 Retire the old token estimate

The value 256 is a fixed adapter output in Qwen-VL. Qwen2 and Qwen2.5 can be approximated on a 28-pixel merged grid. The representative Qwen3 configuration uses a 32-pixel merged grid. Video also includes temporal patching, frame sampling, and processor caps. A rate limiter that still assumes 256 tokens per image will underestimate cost badly.

The most reliable method is to encode a sample corpus with the current processor, read the visual grid or input length, and fit an empirical estimate. A service should estimate cost before a request reaches the GPU and apply an explicit shrink, segment, or reject policy.

### 15.3 Recalibrate coordinates and structured outputs

Model generations can recommend points, boxes, or action objects with different coordinate conventions and prompts. A migration suite should contain screenshots with known targets and validate the complete mapping back to the original display. Padding, cropping, high DPI, and scrolling all need coverage.

JSON must be checked by a real parser rather than extracted from prose with a regular expression. A schema should constrain field names, action enums, numeric ranges, and required values. If format reliability falls after migration, official template guidance and constrained decoding should be tested before fine-tuning.

### 15.4 Separate quality regression from system regression

Quality regression checks answer, localization, and action correctness. System regression checks throughput, first-token latency, peak memory, batch stability, and long-request timeout. A higher-scoring new model can reduce service capacity by consuming more visual tokens. Migration is complete only when both groups pass.

Video tests should include decode failure, broken timestamps, variable frame rate, and oversized inputs. Image tests should include alpha channels, orientation metadata, grayscale, and extreme pixel counts. Processor behavior on malformed media is part of production reliability and rarely appears in benchmark tables.

### 15.5 Keep a rollback and shadow period

New and old models can process the same request during a shadow period while only the old result reaches the user. The new output supports offline comparison and realistic cost measurement. Any shadow run on private data must preserve the original data scope and retention policy.

After cutover, retain per-request rollback. Model service, processor, and executor versions should be released together so that rollback does not pair old weights with a new processor. If a GUI action or high-risk document field behaves unexpectedly, automation can stop and return to read-only recommendation mode.

### 15.6 Finish with one migration table

| Check | Pass condition |
| --- | --- |
| Model and processor version | Revisions are pinned and official template is verified |
| Image budget | Resized dimensions and visual tokens are explainable on representative samples |
| Video budget | FPS, frame count, timestamps, and total tokens are logged |
| Output protocol | JSON, boxes, and coordinates pass schema and mapping tests |
| Quality regression | Core tasks and boundary examples meet agreed thresholds |
| System regression | Latency, memory, throughput, and timeout meet service goals |
| Safety | Confirmation, logging, and rollback work for sensitive actions |

Migration looks more involved than changing a model ID because the multimodal input path is longer than a text-only path. A change in any segment can move the result. Keeping this table in the release record is more useful than saving one benchmark total.

## Conclusion

When a new multimodal checkpoint arrives, run the same document page and video through its processor first. Print the resized dimensions, visual grid, actual frame count, timestamps, and input length, then inspect the answer. These records expose cost and missing evidence earlier than a total parameter count on a release page.

Next, open the configuration and check patches, spatial merging, visual injection, attention type, and native context. The paper explains why a design exists, and the configuration limits that explanation to the structure used by a particular checkpoint. Together they reveal whether a result changed because of the model, the amount of input evidence, or a new runtime default.

Finally, place processor revision, input budget, latency, and output protocol in the experiment record. The next model can then be compared on the same media and under the same conditions, and deployment owners know what must be recalibrated. Even after five large architectural changes, a useful comparison begins by asking how many tokens one real image became.
