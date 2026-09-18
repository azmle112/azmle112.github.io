---
title: "Qwen3.5 技术原理分析"
description: "从像素与视觉 token，到 Gated DeltaNet 的矩阵记忆、Full Attention、MRoPE 和 MoE。以 9B 为主例，逐层分析 Qwen3.5 的数学原理、张量维度与混合架构。"
pubDate: 2026-09-18
readingTime: "75 分钟"
tags: ["Qwen3.5", "多模态模型", "Gated DeltaNet", "模型架构"]
lang: "zh"
translationKey: "qwen35-technical-analysis"
tocDepth: "chapters"
featured: true
draft: false
---

Qwen3.5 把动态分辨率的视觉编码器与混合语言主干接在一起。图像和视频先变成视觉 token，写入与文本相同的序列；语言层再交替使用 Gated DeltaNet 与 Full Attention，分别通过递推矩阵状态和历史 K/V 处理上下文。

本文以 **Qwen3.5-9B** 为主例，沿着预处理、视觉编码、多模态融合和语言计算逐层展开，并对照 **4B Dense** 与 **35B-A3B MoE**。重点放在实际张量维度、状态更新公式及模块之间的关系，保留理解这些机制所需的教学推导。

文中的配置以官方 checkpoint 为准，源码链接对应同一份可定位的实现。教学公式与简化代码用于解释执行过程；参数量、缓存量属于解析估算，不作为实际吞吐、显存峰值或模型效果的测量结果。后文的结构图根据这些配置与计算关系绘制。

## 1. 总体架构 · 一个视觉前端，两类 token mixer

### 1.1 先建立正确的整体印象

Qwen3.5-9B 仍然把图像/视频转换为视觉 token，替换输入序列中的视觉占位符，再交给自回归语言主干。但语言主干不是 32 层完全相同的 softmax self-attention：它按 **3 层 Gated DeltaNet + 1 层 Full Attention** 的周期排列，共 24 层前者、8 层后者。[S1]、[S2]、[C1]

```text
image / video                        text / chat template
      |                                       |
resize + normalize + patchify          tokenization
      |                                       |
pixel_values + grid_thw         input_ids + modality types
      |                                       |
Vision Transformer                    token embedding
      |
2x2 spatial merger ----------------> placeholder replacement
                                              |
                                multimodal input embeddings
                                              |
                    [ Gated DeltaNet + Dense SwiGLU ] x 3
                    [ Full Attention + Dense SwiGLU ] x 1
                                   repeat 8 times
                                              |
                                      RMSNorm + LM head
                                              |
                                   next-token distribution
```

图中“×3/×1”说的是**层类型排列**。每个层内部有自己的参数与状态；不是一个 DeltaNet 模块共享参数运行三次，也不是 token 经过 router 后动态选择使用哪种注意力。[S1]

**Dense/MoE 与 Linear/Full 是两个独立维度**：前者描述 FFN 是否采用稀疏专家，后者描述 token 之间如何交换信息。因此，“9B Dense”并不意味着每层都是 full attention；“35B-A3B MoE”也不意味着其 token mixer 就是 MoE。[S1]、[S9]

<figure><a href="/images/blog/qwen35-technical-analysis/01-architecture.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/01-architecture.svg" alt="9B 的整体计算路径。三个 DeltaNet 层后接一个 Full Attention 层，每层都保留 FFN 与残差结构。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 1　9B 的整体计算路径。三个 DeltaNet 层后接一个 Full Attention 层，每层都保留 FFN 与残差结构。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 1.2 主例的实际配置

下表来自 9B checkpoint，不是随手调用配置类构造器得到的默认值。[C1]

| 子系统 | Qwen3.5-9B 配置 |
|---|---|
| 文本隐藏维度 / 层数 | 4096 / 32 |
| Dense FFN 中间维度 | 12288 |
| Full Attention | 16 个 Q 头，4 个 KV 头，每头 256 维 |
| Gated DeltaNet | 16 个 Q/K 头，32 个 V 头，K/V 每头均为 128 维 |
| DeltaNet 的局部卷积 | depthwise causal Conv1d，kernel=4 |
| 词表 / 上下文配置 | 248320 / 262144 |
| 文本 RoPE | theta=10000000；partial factor=0.25；sections=[11,11,10] |
| 视觉编码器 | 27 层，宽度 1152，16 头，FFN 宽度 4304 |
| 视觉 patch | 空间 16×16，时间 2，空间 merger=2×2 |
| 可学习视觉位置表 | 2304 个位置，即 48×48 网格 |
| 视觉 merger 输出维度 | 4096，与语言主干一致 |
| embedding 与 LM head | 不共享权重 |

`max_position_embeddings=262144` 是配置值，不等于任何机器都能在这个长度上高效推理，也不保证任意输入长度、任意位置修改或超长推理都具有相同质量。后文会计算其中仅 KV cache 的开销。

### 1.3 不同规模不能只改一个 hidden_size

| 配置 | 4B Dense | 9B Dense | 35B-A3B MoE |
|---|---:|---:|---:|
| 文本宽度 | 2560 | 4096 | 2048 |
| 文本层数 | 32 | 32 | 40 |
| Full Attention 的 Q/KV 头数 | 16 / 4 | 16 / 4 | 16 / 2 |
| Full Attention 每头维度 | 256 | 256 | 256 |
| Dense FFN 中间维度 | 9216 | 12288 | 不适用 |
| 路由专家数 / 每 token 选择数 | 不适用 | 不适用 | 256 / 8 |
| 专家 / 共享专家中间维度 | 不适用 | 不适用 | 512 / 512 |
| 视觉深度 / 宽度 | 24 / 1024 | 27 / 1152 | 27 / 1152 |
| 视觉输出维度 | 2560 | 4096 | 2048 |
| 词 embedding 与 LM head 共享 | 是 | 否 | 否 |

来源：[C1]、[C4]、[C5]。这三个 checkpoint 的 DeltaNet 头配置相同，但不能据此推广到整个系列所有未来版本。

一个很实用的反例：**4B 的文本宽度为 2560，但 Full Attention 内部 Q 的总宽度是 16×256=4096**。所以不应默认 `head_dim = hidden_size / num_heads`；必须读取显式 `head_dim` 和投影层。

## 2. 模块组织与源码对应关系

外层对象关系如下。[S1]

```text
Qwen3_5ForConditionalGeneration
  model: Qwen3_5Model
    visual: Qwen3_5VisionModel
      patch_embed
      pos_embed
      rotary_pos_emb
      blocks[0:27]
      merger
    language_model: Qwen3_5TextModel
      embed_tokens
      layers[0:32]
        input_layernorm
        linear_attn OR self_attn
        post_attention_layernorm
        mlp
      norm
      rotary_emb
  lm_head
```

优先阅读 `modeling_qwen3_5.py`，因为它展开了实际执行逻辑；再用 `modular_qwen3_5.py` 理解继承关系。后者有不少继承/复用，单看 `pass` 无法知道全部行为。生成文件的头部明确提示：上游正式修改应落在 modular 文件，再生成 modeling 文件。[S1]、[S3]

图片和视频预处理并没有全部放在 `qwen3_5/` 目录：9B processor 配置复用了 `Qwen3VLProcessor`，图像端复用 Qwen2-VL 的实现，视频端复用 Qwen3-VL 的实现。**复用代码类不等于复用旧模型的参数与全部架构。**[S4]、[S5]、[S6]、[C2]

## 3. 统一符号 · 先分清三种“序列长度”

记原始采样帧数为 $F$，resize 后空间尺寸为 $H\times W$；空间 patch 边长 $p=16$，时间 patch 长度 $\tau=2$，空间合并边长 $m=2$。

经过必要的尾帧补齐后：

$$
T_g=\left\lceil\frac{F}{\tau}\right\rceil,
\qquad H_g=H/p,\qquad W_g=W/p.
$$

对于静态图片，时间轴复制为两帧后只产生一个 temporal group，所以 $T_g=1$。后文所有给定空间尺寸都假设已经与 $pm=32$ 对齐。[S4]、[S5]

三种长度分别是：

$$
N_{\rm patch}=T_gH_gW_g,
\qquad
N_{\rm vis}=\frac{T_gH_gW_g}{m^2},
\qquad
L=N_{\rm text/special}+N_{\rm vis}.
$$

`N_patch` 是 ViT 输入长度；`N_vis` 是 merger 后真正占用语言序列位置的视觉 token 数；`L` 还包含聊天模板、时间戳、边界标记、问题等文本 token。二者相差 4 倍的视觉长度不能混用，文本长度也不能仅按汉字数估计。

另一个重要区别：`pixel_values` 的第二维 1536 是**原始 patch 的像素特征维度**，不是 ViT hidden size，更不是 LLM hidden size。

## 4. 图片预处理 · 从像素到有序 patch

### 4.1 实际参数来自 checkpoint

Qwen3.5-9B 的图片 processor 配置为：`patch_size=16`、`temporal_patch_size=2`、`merge_size=2`，三个通道的 `image_mean=image_std=0.5`。保存的 processor 类型名包含 `Qwen2VLImageProcessorFast`，但这不意味着实际 patch 为 14。[C2]

如果输入是通常的 uint8 RGB 像素，且启用 rescale 和 normalize，则：

$$
x_{\rm norm}=\frac{x/255-0.5}{0.5}=\frac{x}{127.5}-1.
$$

如果外部已经把图片变成 $[0,1]$ 浮点数据，则应检查是否需要关闭 rescale；重复除以 255 会改变模型看到的数据分布。RGB 转换、采样、resize 和归一化都属于输入协议的一部分，不能只对齐最终 shape。[S4]

### 4.2 smart_resize 做了什么

图片的空间对齐因子：

$$
f=p\times m=32.
$$

`smart_resize` 先把高宽取到这个因子的倍数，再检查面积预算。若面积超限，以原始高宽计算：

$$
\gamma=\sqrt{HW/P_{\max}},\qquad
H'=f\left\lfloor\frac{H/\gamma}{f}\right\rfloor,
\qquad
W'=f\left\lfloor\frac{W/\gamma}{f}\right\rfloor.
$$

若面积过小，则使用相反方向的放大和向上取整；极端宽高比还会触发检查。目的是同时满足网格对齐和面积范围，并尽量保留宽高比，而不是固定把图片压成一个正方形。[S4]

9B 图片配置的 `size.shortest_edge=65536`、`size.longest_edge=16777216` 在这条执行路径中作为**像素面积限制**使用，不能按字段名称理解成边长。对应合并后的图片视觉 token 预算分别是 64 和 16384；实际形状仍受比例、取整和用户覆盖参数影响。[C2]、[S4]

对于已经对齐、未再 resize 的图片：

$$
N_{\rm vis}=\frac{HW}{(pm)^2}=\frac{HW}{1024}.
$$

这描述了动态分辨率与 token 数之间的关系。输入图片的视觉 token 数会随分辨率变化。

### 4.3 为什么图片也有 temporal_patch_size=2

视觉 patch embedding 是 3D 卷积，需要一个两帧时间轴。对静态图片，处理器复制同一份空间像素，供卷积的两个时间位置使用。当前图片实现可通过 `unsqueeze + expand` 在 patch 层面完成这件事，不必真的先物化一个完整双帧视频。[S4]

这没有创造新的运动信息。它只是让图片与视频使用相容的 tubelet 输入规格：

$$
D_{\rm raw}=C\tau p^2=3\times2\times16^2=1536.
$$

### 4.4 patchify 不只是普通行优先 flatten

以 448×448 图片为例：$H_g=W_g=28$。为了使后续 `view(-1, 4D_v)` 可以正确合并相邻 patch，processor 必须把同一 2×2 空间块内的四个 patch 排在一起。[S4]

教学化维度变化为：

```text
[B, 3, 448, 448]
  -> [B, 3, 14, 2, 16, 14, 2, 16]
  -> [B, 14, 14, 2, 2, 3, 16, 16]
  -> insert / repeat temporal dimension of size 2
  -> [B, 784, 1536]
  -> concatenate images in their original order
  -> [sum_of_raw_patches, 1536]
```

用一个 4×4 patch 网格更容易看懂。普通行优先编号为：

```text
 0  1  2  3
 4  5  6  7
 8  9 10 11
12 13 14 15
```

实际供 merger 使用的块优先顺序为：

```text
[0, 1, 4, 5,  2, 3, 6, 7,
 8, 9, 12, 13,  10, 11, 14, 15]
```

因此，**不能独立修改 patch 排序、位置坐标排序或 merger reshape 中的任意一个，而不检查另外两个。**它们共同定义视觉 token 对应哪片图像。

<figure><a href="/images/blog/qwen35-technical-analysis/02-patch-order.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/02-patch-order.svg" alt="2×2 空间块对应的 patch 连续排列，merger 才能正确地把相邻空间特征拼在一起。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 2　2×2 空间块对应的 patch 连续排列，merger 才能正确地把相邻空间特征拼在一起。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 4.5 图片输出

对于一张 448×448 图片：

```text
image_grid_thw = [[1, 28, 28]]
pixel_values.shape = [784, 1536]
number_of_image_placeholders = 784 / 4 = 196
```

不同尺寸图片先按形状分组以提高处理效率，之后恢复原顺序。最终 `pixel_values` 通常是动态长度拼接张量，而不是必须能写成统一 `[B, N, 1536]` 的 padded batch。[S4]

## 5. 视频预处理 · 采样、时间压缩与时间戳

### 5.1 采样帧数和模型看到的 temporal groups 不是一回事

当前视频 processor 可按目标 fps 或指定 `num_frames` 采样；这两个显式参数不能同时设置。按 fps 时，根据原视频帧数和原始 fps 估算采样数，再施加最小/最大帧数等约束，最后使用均匀分布的帧索引。[S5]

需要区分三件事：**原始视频帧序号**确定物理时间；**采样后的帧顺序**确定输入内容；**每两帧组成的 temporal group**确定视觉网格的时间长度。原视频 30fps、目标采样 2fps、temporal patch=2，不意味着模型仍每秒得到 30 个独立视觉块。

奇数个采样帧会在 patchify 阶段重复最后一帧补齐，因此实际 $T_g=\lceil F/2\rceil$。不能在所有输入上简单用向下取整 $F//2$ 估计。

### 5.2 视频面积预算通常包含时间维度

视频版 `smart_resize` 检查的是接近 $FHW$ 的总像素量，调整的是空间高宽，而不是在这个函数里重新采样时间轴。[S5]

9B 的视频预处理配置读取到 `size.longest_edge=25165824`、`shortest_edge=4096`。在偶数帧、未启用额外逐帧 cap 的理想对齐情况下，按预算反推：

$$
N_{\rm vis}=\frac{FHW}{2\times32^2}
\lesssim\frac{25165824}{2048}=12288.
$$

这是对这条配置路径的解释，不是保证所有视频最终刚好为 12288 token。[C3]、[S5]

所分析的实现还提供 `cap_pixels_per_frame`：启用后会额外应用逐帧像素上限及预算分配规则；未显式设置时保留未 cap 行为并警告将来的默认变化。因而不能把旧工具包中的“每帧最多 768 token”直接当成所有调用路径的实际保证。科研复现应记录是否通过 `qwen-vl-utils` 读取、processor 的预算、采样参数和这个开关。[S5]

### 5.3 视频 patchify 的真实顺序

以 8 帧、每帧 448×448 为例：

```text
input video:       [B, 8, 3, 448, 448]
temporal grouping: [B, 4, 2, 3, 14, 2, 16, 14, 2, 16]
permute:           [B, 4, 14, 14, 2, 2, 3, 2, 16, 16]
flatten:           [B, 3136, 1536]
public output:     [sum_of_raw_video_patches, 1536]
video_grid_thw:    [[4, 28, 28]]
```

中间 permute 对应源码的 `(0,1,4,7,5,8,3,2,6,9)`。它同时保证：两帧的同一空间 patch 被打包为 tubelet，2×2 的相邻空间 tubelets 排在一起。[S5]

`video_grid_thw` 在 processor 输出处按**视频**组织，形状为 `[num_videos,3]`；后续为 MRoPE 展开时间块是另一阶段的操作。

### 5.4 每个 temporal group 的时间戳如何生成

假设原视频为 30fps，明确指定已经采样的原始帧序号：

```text
[0, 15, 30, 45, 60, 75, 90, 105]
```

这些采样帧的时间为 0、0.5、1.0、1.5、2.0、2.5、3.0、3.5 秒。processor 以 `temporal_patch_size=2` 分组，取组内首尾时间的平均，因此四个时间戳是：

```text
[0.25, 1.25, 2.25, 3.25] seconds
```

之后按源码的一位小数格式写入文本，每组跟随一段视觉占位符。[S6]

```text
<0.2 seconds><|vision_start|>[196 video tokens]<|vision_end|>
<1.2 seconds><|vision_start|>[196 video tokens]<|vision_end|>
<2.2 seconds><|vision_start|>[196 video tokens]<|vision_end|>
<3.2 seconds><|vision_start|>[196 video tokens]<|vision_end|>
```

上面的 `[196 video tokens]` 是说明性缩写，不是应传入 tokenizer 的字面字符串。

三个常见错误值得避免。第一，组时间戳并不是“第二帧的时间”，也不是总能等于整数秒。第二，时间戳会继续被 tokenizer 切分，不能假定一整个 `<0.2 seconds>` 只占一个 token。第三，对外部预采样视频，应保留真实 `frames_indices` 与原视频 fps；缺失 metadata 时源码可能按 24fps 回退，shape 正确但时间语义会出错。[S6]

## 6. 视觉编码器 · 从 1536 维像素块到 LLM 特征

### 6.1 Patch Embedding 是在已打包 patch 上应用 Conv3d

9B 的 `Qwen3_5VisionPatchEmbed` 使用卷积核和步长 `[2,16,16]`，输入通道为 3，输出通道为 1152。[S1]

```text
[784, 1536]
   -> view [784, 3, 2, 16, 16]
   -> Conv3d
   -> [784, 1152, 1, 1, 1]
   -> view [784, 1152]
```

从这一调用的局部视角看，每个已经切好的 tubelet 作为一项输入，只产生一个嵌入向量。这一步包含两帧的局部时间融合，但不等于整个 ViT 在所有视频时间上进行全局注意力。

### 6.2 可学习绝对位置嵌入 · 48×48 网格的双线性插值

视觉位置表是 `[2304,1152]`，对应 48×48 的基础空间网格。输入网格可能为 28×28、44×80 等，所以不能直接把它当作固定长度位置序列逐项相加。[S1]、[C1]

这里的源码使用 **bilinear interpolation，`align_corners=True`**。对目标网格某一行 $r$，映射到基础表的行坐标：

$$
u=r\frac{48-1}{H_g-1}.
$$

列坐标同理。设两轴的小数部分为 $a,b$，则对应位置向量为四角嵌入的加权和：

$$
E(u,v)=(1-a)(1-b)E_{00}+(1-a)bE_{01}
       +a(1-b)E_{10}+abE_{11}.
$$

实现随后按与 patchify 一致的空间块顺序排列，并在 temporal groups 之间重复空间位置。它是**模型输入网格上的二维位置先验**，没有把原图的物理世界坐标直接编码进来。[S7]

### 6.3 视觉 RoPE · 二维、每头全维旋转

9B 的视觉头维度为 $1152/16=72$。视觉 rotary 模块使用 H/W 两个轴：每轴产生 18 个频率值，两轴合并为 36，再按 `rotate_half` 的布局复制到 72 维。因此：

```text
vision spatial coordinates: [N_patch, 2]
H frequencies:              [N_patch, 18]
W frequencies:              [N_patch, 18]
concatenated frequencies:   [N_patch, 36]
cos / sin after duplication:[N_patch, 72]
```

Q/K 的旋转可以写成：

$$
q'=q\odot\cos\phi+\operatorname{rotate\_half}(q)\odot\sin\phi.
$$

视觉 RoPE 作用于**完整 72 维头**；后文语言模型 Full Attention 是 256 维头中只旋转 64 维，两者不要混淆。[S1]

可学习绝对位置嵌入加在 hidden states 上，RoPE 则作用在每层 attention 的 Q/K 上。这是两条不同的位置注入路径，不是先后重复调用同一个位置向量。

### 6.4 Vision Attention 是普通多头、非因果注意力

每个视觉 block 先 LayerNorm，再进行 attention，加残差，然后 LayerNorm、两层 GELU MLP、加残差。[S1]

$$
X'=X+\operatorname{Attn}(\operatorname{LN}(X)),
\qquad
X''=X'+\operatorname{MLP}(\operatorname{LN}(X')).
$$

对于 448×448 的图片，QKV 的 shape 为：

```text
hidden states: [784, 1152]
fused QKV:     [784, 3456]
reshape:       [784, 3, 16, 72]
Q, K, V each: [784, 16, 72]
backend form:  [1, 16, 784, 72]
```

`qkv = Linear(1152, 3×1152)` 是融合投影，绝不表示 Q/K/V 共用一个向量，也不表示所有头共用相同 Q/K/V。每个头对应不同投影通道。视觉块内部 `is_causal=False`，因此同一注意力段内不同空间 patch 双向交互。[S1]

视觉 MLP 为：

$$
\operatorname{MLP}_{\rm vision}(x)=W_2\operatorname{GELU}(W_1x+b_1)+b_2,
$$

其中 9B 的维度是 $1152\to4304\to1152$，使用配置中的 `gelu_pytorch_tanh`；它不同于语言 FFN 的 SwiGLU。[S1]、[C1]

### 6.5 cu_seqlens 到底隔离了什么

Qwen3.5 视觉路径调用的 helper 默认 `merge_temporal=False`，逻辑等价于：

```python
lengths = repeat_interleave(grid_h * grid_w, grid_t)
cu_seqlens = [0] + cumsum(lengths)
```

对于 8 帧、448×448 视频，四个 temporal groups 各有 784 个原始 patch：

```text
cu_seqlens = [0, 784, 1568, 2352, 3136]
```

因此视觉 attention 的可见性是四个 784×784 的双向块，而不是一个覆盖全部 3136 个 patch 的大块。Flash Attention 通过变长序列边界执行；其他路径把张量按这些长度切开再分别计算。[S1]、[S7]

**结论**：跨两帧的局部融合发生在 tubelet Conv3d；跨 temporal groups 的长时间信息交互主要进入后面的语言主干处理。不能仅因输入是视频，就把视觉编码器描述为“全时空 attention”。

### 6.6 Spatial Merger 真正改变了什么

最终 merger 的输入为 `[N_patch,1152]`。主路径先对每个 patch 做 LayerNorm，再利用块优先顺序拼接每组四个 patch：

```text
[N_patch, 1152]
   -> LayerNorm(1152)
   -> [N_patch / 4, 4608]
   -> Linear(4608, 4608) + GELU
   -> Linear(4608, 4096)
   -> [N_vis, 4096]
```

它不是简单平均池化，也不是把 token 数不变而只增加特征宽度。**拼接减少 token 数，MLP 学习空间合并与语言维度对齐。**[S1]

但 merger 之后的一个 token 也不能被解释为只含对应 32×32 像素的信息：在 merger 之前，ViT attention 已经让这个 patch 的特征融合了同一空间帧组内其他位置的信息。

<figure><a href="/images/blog/qwen35-technical-analysis/03-vision.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/03-vision.svg" alt="单张 448×448 图片经过视觉前端时的长度与特征宽度变化，以及两条位置注入路径。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 3　单张 448×448 图片经过视觉前端时的长度与特征宽度变化，以及两条位置注入路径。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 6.7 返回值变化与 DeepStack

当前 `Qwen3_5VisionModel` 返回的是：

```text
last_hidden_state: [N_patch, 1152]   # unmerged
pooler_output:    [N_patch/4, 4096] # merged
```

类型为 `BaseModelOutputWithPooling`。外层 `get_image_features` 再把 `pooler_output` 按每张图的 merged token 数切成 tuple。[S1]

这里没有 Qwen3-VL 的三组 DeepStack 特征，也没有“视觉中间层 → LLM 第 0/1/2 层”的额外注入。9B 的配置中 `deepstack_visual_indexes=[]`，执行代码也没有这条分支。要在这个骨干上做多层视觉注入，需要新增实现，而不是默认认为它已存在。[S1]、[C1]

## 7. 多模态融合 · 视觉特征如何写入语言序列

### 7.1 从一个占位符到多个视觉 token

聊天模板通常先产生：

```text
<|vision_start|><|image_pad|><|vision_end|>
```

processor 根据网格把中间的 image token 扩展到 $T_gH_gW_g/m^2$ 个，再进行 tokenization。视频则逐 temporal group 插入时间戳及对应的视觉段。[S6]、[C6]

模型先对所有 `input_ids` 查词 embedding，再在 `<|image_pad|>` 或 `<|video_pad|>` 对应位置替换为 merger 特征。教学化写法为：

```python
inputs_embeds = token_embedding(input_ids)   # [B, L, D]
features = vision_encoder(pixels).pooler_output
features = features.to(inputs_embeds.device, inputs_embeds.dtype)
mask = (input_ids == image_token_id).unsqueeze(-1)
inputs_embeds = inputs_embeds.masked_scatter(mask, features)
```

源码同时检查占位符数量与特征元素数量是否匹配。9B 中每个位置必须正好对应 4096 维特征；不能用 3584 维向量截断或 `.to()` 伪装成 4096 维。[S1]

### 7.2 mm_token_type_ids 是位置协议，不是额外模态 embedding

当前 processor 默认返回与 `input_ids` 等长的 `mm_token_type_ids`：文本为 0，图像为 1，视频为 2。Qwen3.5 用它定位连续模态段并计算 MRoPE。[S1]、[S6]

在这里的源码中，它不是再查一个“模态 embedding 表”并加到每个 token 上，也不是 causal mask 本身。输入包含多模态网格而缺少这些类型标记时，位置构造路径会报错。自己编写 collator 或包装 `forward` 时，不应把这个字段当作无用信息丢掉。

### 7.3 融合后的统一序列

经过替换，文本 token 和视觉 token 都变成 `[B,L,D]` 中的向量，继续经过相同的 decoder 层。标准路径没有另一套每层专门从文本查询视觉 memory 的 cross-attention；视觉信息的进一步交互依靠这个统一序列的 token mixers。[S1]

这也意味着：视觉 token 同样会更新 DeltaNet 状态，同样会进入 Full Attention 的 K/V cache。它们不会在“完成图像编码”后自动从语言主干的计算成本中消失。

## 8. 语言 decoder 的共同骨架

### 8.1 每层先做 token mixing，再做 FFN

无论该层使用 Gated DeltaNet 还是 Full Attention，9B 的残差骨架都是：

$$
U=X+\operatorname{Mixer}(\operatorname{RMSNorm}(X)),
$$
$$
Y=U+\operatorname{SwiGLU}(\operatorname{RMSNorm}(U)).
$$

两类 mixer 的输入输出均为 `[B,L,4096]`，因此可以在同一个层栈中交替。线性注意力层在该层的 mixer 位置替换 Full Attention。[S1]

层类型在初始化时由 `config.layer_types[layer_idx]` 决定。0-based 下标 0、1、2 为线性层，3 为全注意力层；如此重复到第 31 层。

### 8.2 Qwen3.5 的 RMSNorm 权重是零中心参数化

文本主干与 Q/K norm 使用零中心参数化，可训练缩放写为 `1 + weight`。

$$
\operatorname{RMSNorm}(x)=
\frac{x}{\sqrt{\operatorname{mean}(x^2)+\epsilon}}
\odot(1+w).
$$

可训练参数 $w$ 初始化为 0，所以实际初始缩放仍为 1。源码在 float32 中计算归一化与缩放，再恢复输入 dtype。[S1]

这与“把输出初始化成 0”完全不同。分析 state dict、移植归一化层或做权重转换时，必须注意有无这个 `1 + weight`。DeltaNet 输出处的 **RMSNormGated 是另一实现**：它使用初始化为 1 的缩放权重，并在归一化之后乘 SiLU gate。

### 8.3 Dense SwiGLU

9B 的 FFN 为：

$$
\operatorname{SwiGLU}(x)
=W_{\rm down}\left[\operatorname{SiLU}(W_{\rm gate}x)
\odot(W_{\rm up}x)\right].
$$

```text
input:     [B, L, 4096]
gate/up:   [B, L, 12288] each
multiply:  [B, L, 12288]
down:      [B, L, 4096]
```

三个投影都不使用 bias。名称中都有 gate，但这里的 FFN gate、DeltaNet 的遗忘/写入/读出 gate，以及 Full Attention 的 output gate，是不同模块，不能混在一起解释。[S1]

## 9. Gated DeltaNet · 固定大小矩阵状态如何读写

### 9.1 从历史 K/V 到矩阵状态

普通自回归 attention 保存历史各 token 的 K/V，新 query 再显式与这些历史位置交互。Gated DeltaNet 则维护每个头的一个矩阵状态，以**遗忘 + 按当前 key 修正关联记忆**的方式持续更新，再从矩阵中读出结果。[S1]、[P1]

决定其行为的关键是 delta-rule 更新。它先减去当前记忆已经预测出的部分，再写入误差。因此，仅删除 softmax 或调整 $QK^T$ 的乘法顺序，都不足以得到这一机制。

以下推导与源码一致，使用状态方向：

$$
S_t\in\mathbb R^{d_k\times d_v}.
$$

key/query 视为 $d_k$ 维列向量，value 为 $d_v$ 维列向量；用 $S_t^Tk_t$ 读取 value。部分论文使用转置的状态定义，公式看起来左右相反，不代表方法不同。

#### 9.1.1 为什么历史可以压进一个固定矩阵

先暂时忽略 softmax、归一化、遗忘和 delta correction，只看一种最基础的线性关联形式。第 $t$ 个 query 对历史的读取可以写成：

$$
o_t=\sum_{j\le t}(q_t^Tk_j)v_j.
$$

其中 $q_t^Tk_j$ 是当前 query 与第 $j$ 个 key 的匹配强度。因为它是标量，可以改写为：

$$
(q_t^Tk_j)v_j=(v_jk_j^T)q_t.
$$

因此整个求和可以重新结合：

$$
o_t=
\left(\sum_{j\le t}v_jk_j^T\right)q_t.
$$

若采用本文的状态方向 $S_t\in\mathbb R^{d_k\times d_v}$，则令：

$$
S_t=\sum_{j\le t}k_jv_j^T,
\qquad
o_t=S_t^Tq_t.
$$

这里的关键只是矩阵乘法可以重新结合：历史 key/value 不再必须以长度为 $L$ 的列表反复读取，而能累计进一个 $d_k\times d_v$ 的矩阵。这里的“linear”主要表示 sequence mixing 对长度 $L$ 可以递推处理；每一步仍需进行与 $d_kd_v$ 有关的矩阵状态运算，并不等于整个模型只是一个线性层。

这也解释了两个常见问题。第一，$v_j$ 没有“直接变成” $v_j^T$：列向量 $k_j$ 和行向量 $v_j^T$ 做外积，用于生成一个 $d_k\times d_v$ 的可写矩阵。第二，不同论文若把状态定义成 $\sum_jv_jk_j^T$，读取就写成 $S_tq_t$；它只是本文公式的转置版本。

#### 9.1.2 为什么这个矩阵可以看成 KV associative memory

单次写入 $S=kv^T$ 后，用同一个单位 key 查询：

$$
S^Tk=(kv^T)^Tk=v(k^Tk)=v.
$$

因此可以把 $k$ 理解为“地址方向”，把 $v$ 理解为该方向希望返回的内容。若写入多对关联：

$$
S=\sum_jk_jv_j^T,
$$

再用 $k_i$ 查询，则：

$$
S^Tk_i
=v_i+\sum_{j\ne i}v_j(k_j^Tk_i),
$$

其中第一项是目标，第二项是其他 key 不正交时产生的串扰。也就是说，固定矩阵不是无损映射表：相似 key 会竞争相近方向，写入量增大时会出现 collision。普通累加式 linear attention 只会继续把 $kv^T$ 加上去；Delta Rule 的动机正是先读取当前 key 已经对应什么，再只写入预测误差，从而减少对同一关联的直接重复累加。[P1]

<figure><a href="/images/blog/qwen35-technical-analysis/04-associative-memory.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/04-associative-memory.svg" alt="从线性关联式理解固定矩阵记忆。读取时的串扰项解释了有限状态的容量限制。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 4　从线性关联式理解固定矩阵记忆。读取时的串扰项解释了有限状态的容量限制。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 9.2 六路投影及 9B 的真实维度

输入归一化后的 hidden states 为 `[B,L,4096]`。源码分出 QKV、z、b、a 四个投影，其中 QKV 又分成三路，所以逻辑上对应六组信号。[S1]

| 信号 | 投影后宽度 | 作用 |
|---|---:|---|
| Q | 16×128=2048 | 从状态中读信息 |
| K | 16×128=2048 | 本次写入/修正的寻址方向 |
| V | 32×128=4096 | 本次希望写入的目标内容 |
| z | 32×128=4096 | 对输出内容逐元素门控 |
| b | 32 | 生成每个 V 头的写入率 beta |
| a | 32 | 生成每个 V 头的状态衰减量 |

实际代码先使用 `in_proj_qkv: 4096→8192`，再分割；z、b、a 由独立 Linear 得到。这些 projection 都没有 bias，但衰减公式里还包含独立的可训练 `dt_bias`。[S1]

### 9.3 为什么 Q/K/V 前面有 causal depthwise Conv1d

投影后的 QKV 合并为 `[B,8192,L]`，通过 kernel=4、groups=8192 的一维因果卷积，再做 SiLU。因此每个投影通道只在自身的相邻时间位置上卷积，不在卷积里把所有通道重新混合。[S1]

对通道 $c$，可以抽象写成：

$$
u_{t,c}=\operatorname{SiLU}\left(
\sum_{j=0}^{3}a_{c,j}\,r_{t-j,c}\right),
$$

其中缺失的左侧上下文按零处理，核索引仅作教学记法。

卷积让当前 Q/K/V 带上最近几个 token 的局部上下文。注意这里的“时间”是**混合后的 token 序列顺序**，可能经过文本、图像 patch、时间戳和视频 patch，并不恒等于真实世界经过了四帧。z、a、b 不经过这条 QKV 卷积。[S1]

### 9.4 Q/K 的 L2 normalization 与头展开

卷积后的 Q/K 最初形状均为 `[B,L,16,128]`，V 为 `[B,L,32,128]`。源码把 Q/K 的头 `repeat_interleave(2)` 成 32 个，使它们与每个 V 头匹配。**每个状态对应一个 V 头，所以状态头数是 32，不是 16。**[S1]

kernel 调用设置 `use_qk_l2norm_in_kernel=True`，其归一化接近：

$$
\bar k=\frac{k}{\sqrt{\sum_i k_i^2+\epsilon}},
\qquad
\bar q=\frac{q}{\sqrt{\sum_i q_i^2+\epsilon}}.
$$

query 另外乘 $1/\sqrt{d_k}$。这不是 Full Attention 里带可训练缩放的 RMSNorm；也不要未经核对就给这里添加 ELU、softmax 或某个其他线性注意力的正值 feature map。[S1]

以下递推用 $k_t$ 表示已 L2 归一化的 key，用 $\tilde q_t=\bar q_t/\sqrt{d_k}$ 表示最终读取 query。

在 9B 中，每个展开后的 head 都维护：

$$
S_t^{(h)}\in\mathbb R^{128\times128}.
$$

32 个 head 连同 batch 的 recurrent state 形状是 `[B,32,128,128]`。这里没有序列长度 $L$ 这一维：处理 100 个 token 和 100000 个 token 时，单个 DeltaNet 层保存的矩阵状态形状不变。增长的历史仍可能存在于混合架构的 Full Attention KV cache 中，不能把这一局部性质误写成整个模型缓存恒定。

### 9.5 三种门控必须分开理解

每个 V 头的写入门：

$$
\beta_t=\sigma(b_t).
$$

状态的 log-decay：

$$
g_t=-\exp(A_{\log})\operatorname{softplus}(a_t+d_{\rm bias}).
$$

真正乘在状态上的保留系数：

$$
\alpha_t=\exp(g_t).
$$

在理想实数计算中 $\beta_t\in(0,1)$、$\alpha_t\in(0,1)$；有限精度下可能出现饱和或下溢。源码对衰减计算显式使用 float32，以减少低精度数值问题。[S1]

它们的分工是：$\alpha$ 控制先保留多少旧状态，$\beta$ 控制沿当前 key 方向修正多少误差，而 z 决定最终哪些读出通道传向下一层。**三个 gate 分别控制遗忘、写入和输出，不是一回事。**

### 9.6 从源码逐步得到递推公式

首先衰减旧状态：

$$
\bar S_t=\alpha_t S_{t-1}.
$$

然后用当前 key 查询衰减后的旧状态：

$$
\hat v_t=\bar S_t^T k_t.
$$

计算当前目标 value 与记忆预测值之间的误差，并施加写入率：

$$
\delta_t=\beta_t(v_t-\hat v_t).
$$

把这个误差沿 key 方向写回：

$$
S_t=\bar S_t+k_t\delta_t^T.
$$

最后用 query 读取更新后的状态：

$$
o_t=S_t^T\tilde q_t.
$$

这五步与公开 `torch_recurrent_gated_delta_rule` 的顺序一致：**先 decay，再预测，再修正，再读取**。将它们合并可得：

$$
S_t=\alpha_t(I-\beta_t k_tk_t^T)S_{t-1}
+\beta_t k_tv_t^T.
$$

其中 $I-\beta_tk_tk_t^T$ 就是区别于简单累加记忆的重要项。[S1]

<figure><a href="/images/blog/qwen35-technical-analysis/05-delta-update.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/05-delta-update.svg" alt="DeltaNet 先衰减，再预测并写入误差，最后读取更新后的状态；三种门控各有分工。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 5　DeltaNet 先衰减，再预测并写入误差，最后读取更新后的状态；三种门控各有分工。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 9.7 为什么叫 delta rule

暂时把衰减后的旧状态视为起点，考虑一个局部关联误差：

$$
\ell(S)=\frac12\|S^Tk_t-v_t\|_2^2.
$$

其梯度为：

$$
\nabla_S\ell=k_t(S^Tk_t-v_t)^T.
$$

对这个误差做一步步长为 $\beta_t$ 的梯度下降，正好得到上面的状态修正。这是理解 delta rule 的一种数学视角。

**它不是推理时对整个预训练模型参数做一次 optimizer.step。**发生更新的是前向过程中的记忆状态 $S$；投影权重和 gate 参数仍是模型参数。二者在计算图中的角色不同。

因此 $S_t$ 也常被理解成一种 **fast-weight memory**：它在每个 token 的前向过程中快速变化，却不是被优化器永久写回 checkpoint 的模型参数。这里的“在线梯度步”是更新状态的等价数学解释，不意味着推理时开启反向传播、保存参数梯度或执行优化器。

当 $k_t$ 严格单位范数且 $\beta_t=1$ 时，更新后的状态在**当前 key 方向**上可以匹配当前 value。但这绝不等于“beta=1 会覆盖整个记忆矩阵”：其他方向仍可能保留信息，且不同 key 之间可能互相干扰。实际 L2 归一化含 epsilon，等式应理解为理想化解释。

### 9.8 一个可手算的 2×2 状态例子

为了清楚展示更新机制，使用理想化的 gate 值；其中 0/1 端点是概念演示，不声称有限 sigmoid 输入恰好产生这些端点。

初始 $S_0=0$，第一次输入 $k_1=(1,0)^T$、$v_1=(2,0)^T$，取 $\alpha_1=\beta_1=1$，得到：

$$
S_1=\begin{bmatrix}2&0\\0&0\end{bmatrix}.
$$

第二次 key 不变，目标 value 改为 $(0,4)^T$，取 $\alpha_2=0.5$、$\beta_2=0.5$：

$$
\bar S_2=\begin{bmatrix}1&0\\0&0\end{bmatrix},
\quad \hat v_2=(1,0)^T,\quad \delta_2=(-0.5,2)^T.
$$

于是：

$$
S_2=\begin{bmatrix}0.5&2\\0&0\end{bmatrix}.
$$

若 query 为 $(1,0)^T$，包含 $1/\sqrt2$ 缩放后的读出是：

$$
o_2=(0.353553\ldots,\ 1.414214\ldots)^T.
$$

这个例子中，旧关联先衰减，再朝新目标修正，而不是无条件把新 value 加到旧 value 上。

### 9.9 状态读出后的归一化与输出门控

每个头的 $o_t$ 还要经过 RMSNormGated：

$$
y_t=\operatorname{RMSNorm}(o_t)\odot\operatorname{SiLU}(z_t).
$$

32 个 value 头拼起来是 4096 维，随后 `out_proj` 再映射回文本隐藏维度。对 9B 恰好是 $4096\to4096$，但 4B 是 $4096\to2560$，不是可以通用删除的恒等层。[S1]、[C4]

### 9.10 教学版递推代码

下面独立重写了状态核心，约定 Q/K 已完成归一化、Q 已包含缩放，外部 shape 为 `[B,H,L,d]`。它省略了投影、卷积、gate 生成、输出归一化及高性能 kernel，适合理解，不应直接当作高效训练实现。

```python
import torch


def delta_scan(q, k, v, alpha, beta, state=None):
    """q/k: [B,H,L,K], v: [B,H,L,V], state: [B,H,K,V]."""
    if q.shape != k.shape or q.shape[:3] != v.shape[:3]:
        raise ValueError("Incompatible query/key/value shapes")
    batch, heads, length, key_dim = k.shape
    if length == 0:
        raise ValueError("The sequence must be non-empty")
    if alpha.shape != k.shape[:3] or beta.shape != k.shape[:3]:
        raise ValueError("alpha/beta must have shape [B,H,L]")

    if state is None:
        state = k.new_zeros(batch, heads, key_dim, v.shape[-1])
    else:
        state = state.clone()
    outputs = []

    for t in range(length):
        state = alpha[:, :, t, None, None] * state
        prediction = torch.einsum("bhk,bhkv->bhv", k[:, :, t], state)
        correction = beta[:, :, t, None] * (v[:, :, t] - prediction)
        state = state + k[:, :, t, :, None] * correction.unsqueeze(-2)
        output = torch.einsum("bhk,bhkv->bhv", q[:, :, t], state)
        outputs.append(output)

    return torch.stack(outputs, dim=2), state
```

### 9.11 Prefill 为什么不必逐 token 跑 Python 循环

源码同时提供逐 token 的 recurrent 形式与 chunk 形式。普通已有状态的单 token decode 走 recurrent 路径；多 token prefill 或多 token continuation 走 chunk 路径。参考 fallback 的默认 `chunk_size=64`，融合 kernel 的具体实现由后端决定。[S1]

chunk 的本质是**同一递推方程的重新组织**，不是先偷看未来再做一个近似 attention。可以把一个 chunk 的因果依赖写成单位下三角线性系统，利用矩阵运算并行处理 chunk 内部，再在 chunks 之间传递矩阵状态。

给定 chunk 起始状态 $S_0$，令：

$$
d_i=\prod_{r=1}^{i}\alpha_r,\qquad
R_{ij}=\begin{cases}d_i/d_j,&j\le i,\\0,&j>i.\end{cases}
$$

把 chunk 的 keys、queries、values 按行堆叠成 $K,Q,V$，令 $B=\operatorname{diag}(\beta)$、$D=\operatorname{diag}(d)$，定义单位下三角矩阵：

$$
A=I+\operatorname{tril}\big((BKK^T)\odot R,-1\big).
$$

则可以先求解：

$$
U=A^{-1}BV,\qquad W=A^{-1}BDK,
$$

再得到 chunk 内所有修正量：

$$
\Delta=U-WS_0.
$$

最终输出与边界状态为：

$$
O=DQS_0+\big((QK^T)\odot R\big)\Delta,
$$

$$
S_{\rm out}=d_C S_0+
K^T\operatorname{diag}(d_C/d_j)\Delta.
$$

上面的逆矩阵记号用于数学表达；源码使用 **triangular solve** 等运算，不是显式构造一个通用逆矩阵。源码也以 log-decay 的累积差实现相对衰减，避免直接用两个很小的累计乘积做除法。这些等式解释了为何实现里会出现 chunk 内的 `Q @ K.T`、累积 decay 和下三角求解，却依然不需要一个全序列 $L\times L$ 的 attention 矩阵。[S1]

<figure><a href="/images/blog/qwen35-technical-analysis/06-chunk.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/06-chunk.svg" alt="分块计算把块内依赖组织成下三角系统，并通过边界状态连接相邻块。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 6　分块计算把块内依赖组织成下三角系统，并通过边界状态连接相邻块。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 9.12 固定状态的收益与代价

每个头的状态大小不随历史 token 数增加，所以 DeltaNet 层能够以固定大小状态进行递推。但固定矩阵并不是无损保存全部历史；记忆质量取决于 key 的可区分性、干扰、gate、训练分布和后续查询需求。

**研究解释**：周期性插入 Full Attention，为模型保留对历史 token 表示进行显式内容寻址的路径，而线性层降低大量层上的长上下文开销。这是由结构得到的合理解释，不应把它替代成未经本文验证的“混合比例消融证明”。

## 10. Full Attention · GQA、QK-Norm 与输出门控

### 10.1 Q 投影为什么比想象中宽一倍

9B 的 Full Attention 层定义：

```text
q_proj: 4096 -> 16 * 256 * 2 = 8192
k_proj: 4096 ->  4 * 256     = 1024
v_proj: 4096 ->  4 * 256     = 1024
o_proj: 16 * 256 = 4096 -> 4096
```

多出来的一倍用于为每个头额外生成一个 output gate，Q 头数仍为 16。源码先 reshape 为 `[B,L,16,512]`，再沿最后一维拆成 Q 和 gate 各 256 维。直接把展平的 8192 维在中间切成两大半，未必保持同样的通道布局。[S1]

### 10.2 计算过程

Q/K 先按每头 256 维进行 RMSNorm，Q/K 的前 64 维再应用多模态 rotary encoding，V 不旋转。随后以 4 个 KV 头支持 16 个 Q 头，每组四个 query 头使用同一组 K/V，这就是 GQA。[S1]、[C1]

$$
P=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{256}}+M\right),
\qquad O=PV.
$$

$M$ 包含因果约束以及必要的 padding/序列边界约束。输出展平回 `[B,L,4096]`，再执行：

$$
Y=W_o\big(O\odot\sigma(G)\big).
$$

这里的 gate 是 attention 输出上的**逐元素门控**，发生在 `o_proj` 之前；它不是在 softmax 里乘一个 gate，也不是共享给整段序列的一个标量。[S1]

<figure><a href="/images/blog/qwen35-technical-analysis/07-full-attention.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/07-full-attention.svg" alt="Full Attention 保留显式内容寻址，使用 GQA、QK-Norm、部分旋转与逐通道输出门控。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 7　Full Attention 保留显式内容寻址，使用 GQA、QK-Norm、部分旋转与逐通道输出门控。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 10.3 两类 mixer 的直接对照

| 维度 | Gated DeltaNet | Full Attention |
|---|---|---|
| 历史信息载体 | 递推矩阵状态 + 局部卷积状态 | 每个历史 token 的 K/V |
| 更新方式 | 遗忘、按 key 预测、写入误差 | 追加 K/V，query 对历史内容寻址 |
| 是否计算 softmax | 状态核心不使用 | 使用 |
| 是否直接应用语言 RoPE | 这里的执行路径不应用 | 前 64/256 维应用 |
| Q/K 归一化 | L2 normalization | 可训练 RMSNorm |
| 输出 gate | RMSNorm 后乘 SiLU(z) | attention 输出乘 sigmoid(G) |
| 普通 decode 历史状态增长 | 固定大小 | 随序列长度增加 |

来源：[S1]。表格说的是被核对的实现路径，不是对所有名称相近模型的通用定义。

## 11. MRoPE · 三维坐标不是三种 attention mask

### 11.1 文本与视觉位置如何共处

MRoPE 为一个 token 提供 $(t,h,w)$ 三个坐标。纯文本通常三轴相同，等价于把一维序列位置复制三份；视觉 token 则按时间块和二维空间网格分配坐标。[S1]

它描述 rotary 相位如何生成，**不直接定义“哪些 token 可以互相看见”**。因果关系仍由实际序列顺序、mask 和递推规则决定。两个视觉 token 的 T 坐标相同，也不意味着它们自动在语言层里双向可见。

### 11.2 Partial RoPE · 256 维头只旋转 64 维

本例的 `head_dim=256`、`partial_rotary_factor=0.25`，所以：

$$
d_{\rm rotary}=256\times0.25=64.
$$

Q/K 被拆成：

```text
q_rot / k_rot:   first 64 dimensions
q_pass / k_pass: remaining 192 dimensions
```

只对第一部分做 `rotate_half + cos/sin`，然后与不旋转的 192 维拼回完整头。这 192 维并非被丢弃，它们仍参加 attention 的点积。[S1]、[C1]

对应 32 个基础频率：

$$
\omega_j=\theta^{-2j/64},\qquad j=0,\ldots,31.
$$

### 11.3 Interleaved 布局究竟怎样交错

`mrope_section=[11,11,10]` 表示这 32 个频率位置由 T/H/W 分配为 11/11/10。源码以 T 为初始结果，按间隔 3 把 H、W 对应频率覆盖进去。[S1]

```text
frequency index: 0 1 2 3 4 5 ... 27 28 29 30 31
axis:            T H W T H W ...  T  H  W  T  H
```

准确地说：T 使用 0、3、…、30；H 使用 1、4、…、31；W 使用 2、5、…、29。不存在在长度 32 的数组里继续写到 33、36 的情况。

对频率 $j$，选定轴 $a(j)$ 后，相位为：

$$
\phi_j=\operatorname{pos}_{a(j)}\,\omega_j.
$$

把 32 个相位按旋转实现的布局复制成 64 维，得到 cos/sin。交错的是**不同频率通道采用哪个坐标轴**，不是把三个不同 attention 输出交错拼接。

### 11.4 一个完整、可检查的图片位置例子

为了把算术写清楚，暂时忽略真实聊天边界，假设序列只有：两个文本 token、一个合并后 2×3 网格的图片（6 token）、一个文本 token。原始图片网格因此为 `[1,4,6]`，merge=2。

```text
sequence index: 0 1 | 2 3 4 5 6 7 | 8
token type:     T T | I I I I I I | T
MRoPE T axis:   0 1 | 2 2 2 2 2 2 | 5
MRoPE H axis:   0 1 | 2 2 2 3 3 3 | 5
MRoPE W axis:   0 1 | 2 3 4 2 3 4 | 5
```

图片从位置基准 2 开始，空间坐标最大到 4；所以下一个文本的位置是 5，而不是物理序列下标 8。图像段消耗了 6 个 token，但位置基准只按 $\max(2,3)=3$ 推进。这就是 `get_rope_index` 中 `current_pos += max(grid_h, grid_w) // merge_size` 的含义。[S1]

这段序列长 9，最大 rotary 位置为 5，因此：

$$
\text{rope\_delta}=(5+1)-9=-3.
$$

下一个生成 token 在实际序列中的下标是 9，但对应 rotary 位置应为 $9-3=6$。`rope_deltas` 用于维护这种差异，而不是“缺少了三个 token”。含 padding 的 batch 还需要按有效文本位置构造，不能机械套用未去 padding 的总长度。

<figure><a href="/images/blog/qwen35-technical-analysis/08-mrope.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/08-mrope.svg" alt="一个合并后 2×3 图片网格的位置编号。三轴坐标表达布局，因果性仍由实际序列计算保证。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 8　一个合并后 2×3 图片网格的位置编号。三轴坐标表达布局，因果性仍由实际序列计算保证。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 11.5 视频时间戳与 T 坐标的关系

Qwen3.5 把视频写成“时间戳文本 + 一段视觉 token”的重复结构。为了与之对应，`get_rope_index` 把 `[T_g,H_g,W_g]` 展开为 $T_g$ 份 `[1,H_g,W_g]`。[S1]、[S6]

于是每个视觉段内部相对时间坐标为 0，但会加上该段在整个序列中的位置基准。**不是所有视频 token 的全局 T 坐标都为 0。**相邻段之间还夹着时间戳和边界文本，它们也推进位置基准。

因此真实秒数、视频 temporal group 编号和 rotary T 坐标属于不同对象。不能把“视频第 3.5 秒”直接等同于“RoPE 的 T=3.5”，也不能以为修改时间戳文本会自动把所有 rotary 坐标改成对应秒数。

### 11.6 为什么源码中既有 3 轴，也有 4 轴 position_ids

`get_rope_index` 返回 `[3,B,L]` 的 T/H/W。某些生成准备路径另外保留一份普通 text/sequence positions，拼成 `[4,B,L]`：

```text
axis 0: ordinary text/sequence positions for masking bookkeeping
axis 1: multimodal T
axis 2: multimodal H
axis 3: multimodal W
```

TextModel 会把第一份用于 mask 相关处理，将后三份交给 rotary 模块。多出来的轴不是新的空间维度，也不代表一个 token 有四套独立 attention。[S1]

### 11.7 DeltaNet 不使用 RoPE，为什么仍然有顺序感

当前 DeltaNet forward 不直接应用 `position_embeddings`。但 causal Conv1d 与状态递推已经依赖输入顺序；调换 token 顺序通常会改变每一步状态。经过 Full Attention 层后，携带位置影响的 hidden states 也会继续进入后续线性层。[S1]

因此，即使不直接使用 RoPE，这个模块依然对顺序敏感。递推状态始终沿实际输入顺序发生变化。

## 12. Attention mask、因果性与训练时的可见性

### 12.1 三个层面不要混为一谈

视觉 ViT 的 attention 是**同一个 temporal group 内的非因果空间注意力**。语言 Full Attention 是**混合序列上的因果注意力**。语言 DeltaNet 则由**因果卷积与状态递推**保证顺序依赖，不需要显式构造一张普通 softmax 三角矩阵。[S1]、[S7]

TextModel 因而分别维护 `full_attention` 和 `linear_attention` 两类 mask。全注意力使用 `create_causal_mask`；线性层使用另一个 helper：

```python
create_recurrent_attention_mask(...)
```

一个二维 `attention_mask` 输入不能被简单理解为最终所有层都使用完全相同的二维计算。[S1]

尤其需要注意：**teacher forcing 中一次并行传入完整序列，不等于当前 token 可以看到未来答案**。训练能把整段输入交给一个 forward，是因为相应的因果约束仍然存在；分块计算同样必须保持这种语义。

### 12.2 Packed sequences 还需要状态边界

把多个训练样本拼成一条长序列，不仅要阻止 Full Attention 跨样本访问，还要确保 DeltaNet 的卷积和递推状态不跨样本串流。源码能把 `cu_seq_lens_q` 等信息传向 kernel，但具体融合后端、fallback 和训练框架是否实现了所需的 reset 语义，应以实测和后端实现为准。[S1]

因此不能仅凭“接口接受 attention_mask”就认定任意 packing 方法正确。一个有效的检查是：分别运行两个独立样本，与按声明边界 packed 后对应输出比较；同时覆盖普通 attention、卷积状态和 recurrent state。

## 13. Hybrid Cache · 预填充与逐 token 解码

### 13.1 同一个 cache 容器里保存两种东西

TextModel 可以根据配置创建 `DynamicCache`，但每层缓存内容取决于该层类型。Full Attention 追加 K/V；DeltaNet 则通过 `update_conv_state` 和 `update_recurrent_state` 管理状态。[S1]、[S8]

对 9B 的普通生成路径：

| 层类型 | 持久状态形状（每层） |
|---|---|
| Full Attention | K 和 V 各 `[B,4,L,256]` |
| Gated DeltaNet | recurrent state `[B,32,128,128]` |
| Gated DeltaNet | convolution state `[B,8192,4]` |

卷积 kernel=4 意味着数学上当前输出依赖最近四个位置，其中三个属于过去；但这里的 `LinearAttentionLayer` 的实际缓存张量分配最后一维为 **4**，不是根据“过去三个”自行改成 3。状态维护的实现细节应按源码读取。[S8]

### 13.2 Prefill

prefill 输入整段 prompt。视觉编码器生成所有需要的视觉特征，文本和视觉融合后进入混合主干。Full Attention 对 prompt 进行因果计算并保存 K/V；DeltaNet 通过 chunk 形式处理这段输入，保存末端矩阵状态和卷积状态。[S1]

这样得到的缓存不是“最终层一个向量”：每个相应 decoder 层都有自己的历史状态，层与层之间不能混用。

### 13.3 Decode

已有 cache 且新增一个 token 时，各线性层更新局部卷积，执行一次 recurrent delta rule；各全注意力层生成当前 token 的 Q/K/V，追加 K/V，再用 Q 读取当前允许访问的缓存。[S1]

继续生成时只应传入尚未处理的新 token，并正确维护 attention mask 和位置偏移。把整个旧 prompt 再次送入同一个非空 cache，会把历史重复计入状态；这不是“多算一点但结果相同”。

高层 `generate` 负责大量这些 bookkeeping。自行管理解码过程时，必须明确管理：新 token 范围、已消费的视觉输入、各层 cache、序列有效长度和 MRoPE 偏移，不能只保存一个叫 `past_key_values` 的变量就认为全部协议已解决。

### 13.4 可计算的内存例子 · 9B，batch=1

以下只计算**普通生成状态**，不包括模型参数、激活、workspace、通信、图捕获预分配，也不包括为回滚而记录的额外历史。

每个 DeltaNet 层的矩阵状态有：

$$
32\times128\times128=524288\ \text{elements}.
$$

若以 float32 存储，是 2 MiB/层；24 层合计 **48 MiB**。卷积状态若为 BF16，是：

$$
24\times8192\times4\times2\ \text{bytes}=1.5\ \text{MiB}.
$$

Full Attention 的 K/V 总量则为：

$$
8\times2\times4\times L\times256\times2
=32768L\ \text{bytes}.
$$

因此每增加一个 token，仅这 8 层的 BF16 K/V 就增加 **32 KiB**。在 $L=32768$ 时为 **1 GiB**；在 $L=262144$ 时为 **8 GiB**。

这清楚说明：**线性层状态固定，不代表 Qwen3.5 整体是恒定内存。**与同头配置的 32 层全注意力模型相比，保存 K/V 的层数减少到四分之一；这不是整个模型显存、实际延迟或训练 FLOPs 都减少到四分之一的证明。

<figure><a href="/images/blog/qwen35-technical-analysis/09-cache.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/09-cache.svg" alt="递推状态大小固定，但 8 个 Full Attention 层的 KV cache 仍随历史增长。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 9　递推状态大小固定，但 8 个 Full Attention 层的 KV cache 仍随历史增长。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 13.5 状态分叉、回滚与 speculative decoding

源码中的 `record_past` 等路径会改变部分状态保存策略，为回滚保留更多信息；上述固定状态估算专门排除了这种模式。[S8]

从某个历史位置分叉解码时，不仅要复制 Full Attention 的 K/V，还要复制每个线性层的 recurrent state 和 conv state，并保留对应位置元数据。不能通过仅截断 K/V，就让已经经历后续输入的 DeltaNet 状态回到过去。可行做法需要状态快照、重放，或推理引擎明确实现的状态管理。

## 14. MoE · 35B-A3B 的稀疏 FFN 如何执行

### 14.1 与 Dense 主干的关系

35B-A3B 保留相同类型的混合 token mixers，但共有 40 层，按 3:1 周期得到 30 层 DeltaNet 与 10 层 Full Attention。主要结构差异之一是每层的 FFN 使用 MoE，文本宽度也改变为 2048。[S9]、[C5]

其路由专家数为 256，每个 token 选择 8 个；每个专家的 SwiGLU 中间维度为 512，还有一个中间维度为 512 的共享专家。共享专家是一条独立的公共路径，不参与这 256 个专家的路由选择。

### 14.2 Router · softmax、top-k、再归一化

把输入展平为 $X\in\mathbb R^{BL\times D}$，router 先计算：

$$
r=XW_r^T,\qquad p=\operatorname{softmax}(r).
$$

softmax 在所有 256 个专家上、用 float32 计算。然后选择 top-8 专家集合 $\mathcal K(x)$，对选中的概率重新归一化：

$$
\tilde p_e=\frac{p_e}{\sum_{j\in\mathcal K(x)}p_j}.
$$

最终每个 token 的路由专家输出为：

$$
y_{\rm routed}=\sum_{e\in\mathcal K(x)}\tilde p_e E_e(x).
$$

这里 top-k 选择的是 **FFN 专家**，不是注意力头、视频帧或输入 token。[S9]

### 14.3 共享专家

共享专家对每个 token 都计算，并有一个独立 sigmoid gate：

$$
y_{\rm shared}=\sigma(w_s^Tx)E_s(x),
$$

最后相加：

$$
y=y_{\rm routed}+y_{\rm shared}.
$$

共享路径的 gate 是每个 token 的一个标量，对共享专家整个输出向量广播；这与 Full Attention 的逐通道输出 gate 不同。[S9]

### 14.4 从源码看 dispatch / combine

专家权重采用堆叠张量存储：

```text
experts.gate_up_proj: [256, 2*512, 2048]
experts.down_proj:    [256, 2048, 512]
```

概念流程是按选中专家 gather 对应 token，计算专家内部 SwiGLU，乘路由权重，再通过 `index_add_` 等方式累加回原 token 位置。因此 MoE 最终输入输出仍为 `[B,L,2048]`，不会把序列永久拆成 256 条。[S9]

并不是任何输入都只会用到同一组 8 个专家：不同 token 可能选择不同集合。某个 batch 汇总后，很多甚至全部专家都可能被访问。名称中的激活参数规模不能直接解释为模型只需要存储相应规模的权重；内存、专家并行和通信还取决于实际部署方式。

<figure><a href="/images/blog/qwen35-technical-analysis/10-moe.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/qwen35-technical-analysis/10-moe.svg" alt="35B-A3B 将 top-8 路由专家的加权结果与独立共享专家的门控输出相加。" loading="lazy" decoding="async" width="1100" /></a><figcaption>图 10　35B-A3B 将 top-8 路由专家的加权结果与独立共享专家的门控输出相加。 根据正文配置与公式绘制，点击可查看大图。</figcaption></figure>

### 14.5 不应从推理代码臆测训练配方

配置中出现 `router_aux_loss_coef`，可以说明公开接口包含路由辅助损失相关参数，但不能仅凭这个字段还原预训练时全部负载均衡策略、数据配比、优化器设置、训练阶段或每阶段有效损失。推理结构与完整训练配方是不同层次的证据。

## 15. 从 hidden states 到回答 · logits、loss、thinking 与 MTP

### 15.1 最后的 LM head

最后一个 decoder 层之后经过文本 RMSNorm，得到 `[B,L,4096]`，LM head 把其映射到词表：

$$
Z=HW_{\rm vocab}^T,\qquad Z\in\mathbb R^{B\times L\times248320}.
$$

对于当前最后一个位置，softmax 后得到下一 token 的条件分布。9B 的词 embedding 与 LM head 不共享权重；4B 则共享，所以参数估计时不能把二者统一按两张独立矩阵计算。[S1]、[C1]、[C4]

### 15.2 logits_to_keep 影响输出头开销，不会跳过 prompt 主干

普通生成通常只需要最后位置的 logits。本实现提供 `logits_to_keep`：整数 0 表示保留全部位置；1 表示只对最后一个 hidden state 计算词表投影。[S1]

因此一个长 prompt 不必总物化 `[B,L,248320]` 的全部 logits。但这不表示前面的 prompt 没有经过语言主干：构建 attention/cache 和递推状态仍需要处理它。

### 15.3 监督训练中的下一 token 对齐

外层 `forward` 接受 labels，并把 logits 与 labels 交给 loss function。通常自回归监督的数学目标是：

$$
\mathcal L=-\frac1{|\Omega|}
\sum_{t\in\Omega}\log p_\theta(x_{t+1}\mid x_{\le t}),
$$

其中 $\Omega$ 只包含需要监督的位置。这里的“下一 token 对齐”非常重要：位置 $t$ 的 logits 用来评价位置 $t+1$ 的 target，而不是评价当前位置已经输入的 token。

**哪些 token 应设为 `-100` 是训练数据与 collator 的职责**。对于常见回答监督，用户问题、图像占位符和不希望监督的模板部分应按任务协议屏蔽；不能假设模型 forward 会自动识别并只监督 assistant 回答。[S1]

若要理解回答的 token log-prob，记回答为 $y_1,\ldots,y_T$，则：

$$
\log p_\theta(y\mid x)=\sum_{t=1}^{T}
\log p_\theta(y_t\mid x,y_{<t}).
$$

这是序列概率的对数；除以长度得到的是长度归一化评分，不能再把它不加说明地当作原始序列 log-prob。视觉输入影响这些条件分布，是通过前面完整的视觉编码、多模态融合与混合 decoder 实现的，而不是直接对像素做词表 softmax。

### 15.4 反向传播如何穿过这种混合结构

Dense 模型中，监督 loss 可以通过 LM head、各 decoder、merger 和视觉编码器反向传播，具体哪些参数更新取决于冻结设置。DeltaNet 的状态更新由可微运算组成，训练时可以对相应路径求导；高效实现会改变计算组织，但不是把状态更新从学习过程中排除出去。

对于跨 chunk 的训练，是否保留状态梯度、是否 detach、是否采用截断反向传播，是训练循环的选择。普通生成 cache 采用原地更新等推理优化，不能未经核对就直接当作完整跨片段 BPTT 的实现。常规整段监督训练通常应关闭推理缓存，并与梯度检查点等训练设置协调；需要跨片段训练时，再明确实现所需的状态与梯度协议。[S1]、[S8]

### 15.5 Thinking 模式不是另一套 decoder

9B 的聊天模板支持 `enable_thinking`。开启时，生成前缀会引导进入 `<think>` 区域；关闭时模板给出空的 think 段后进入回答区域。两种模式使用同一个公开模型主干，而不是切换一套“思考专用 attention”。[C6]

生成的 thought token 和其他自回归 token 一样，继续改变后续层状态与 K/V。**研究解释**：它们可以承载显式的中间计算或状态描述，但不能把“输出了 think 标签”直接当作已经证明完成某种特定内部推理算法。

模板中的工具调用也首先是结构化文本协议；实际执行工具、处理结果和下一轮输入，需要外部运行系统，不是这段 VLM forward 自己在操作外部环境。[C6]

### 15.6 配置出现 MTP，不代表普通 generate 自动多 token 解码

9B 配置包含 `mtp_num_hidden_layers=1` 等字段，但本文审阅的标准生成类 forward 是主干接普通 LM head 的路径；预训练模型类还列出忽略额外 `mtp.*` 加载键的规则。[S1]、[C1]

因此，不能仅根据配置字段声称“普通 Transformers 生成会自动启用 MTP 加速”，也不能据此复原完整 MTP 训练目标。需要区分 checkpoint 元数据、普通前向实际执行分支，以及特定推理引擎支持的 speculative/MTP 功能。

## 16. 端到端张量维度推导

### 16.1 单张 448×448 图片

假设图片已经满足 processor 尺寸要求，把真实 tokenization 后的非视觉 token 数记为 $L_{\rm other}$，包含问题、模板和视觉边界等所有非 image-pad token。

| 阶段 | 形状或数量 |
|---|---|
| 原始 RGB 图片 | `[3,448,448]` |
| grid | `[1,28,28]` |
| 预处理像素块 | `[784,1536]` |
| Patch embedding | `[784,1152]` |
| 27 个视觉 block 的最终输出 | `[784,1152]` |
| 四 patch 拼接 | `[196,4608]` |
| merger 输出 | `[196,4096]` |
| image 占位符 | 196 个 |
| 融合语言输入 | `[1,L_other+196,4096]` |
| 每个 decoder 输出 | `[1,L_other+196,4096]` |
| 全部 logits | `[1,L_other+196,248320]` |
| 仅最后位置 logits | `[1,1,248320]` |

例如**假设**非视觉部分经过真实 tokenizer 后恰好是 64 个 token，则语言长度为 260。这是形状演示假设，不是对某句中文提示词长度的实测结果。

这个输入会先经过第 0、1、2 个 DeltaNet 层，再进入第 3 个 Full Attention 层；整个周期重复八次。图片不是仅在某个“视觉专用 decoder 层”处理一次后就不再参与其他层。

### 16.2 一张图片 + 8 帧视频 + 文本

假设图片与每个视频帧都是 448×448，视频由前述 8 个采样帧组成：

```text
image pixels:          [784, 1536]
image_grid_thw:        [[1, 28, 28]]
image merged features: [196, 4096]

video pixels:          [3136, 1536]
video_grid_thw:        [[4, 28, 28]]
video merged features: [784, 4096]

total visual tokens:   196 + 784 = 980
language sequence:     980 + all other token positions
```

外层 forward 分别处理 image 与 video 输入，再按输入序列的实际占位符顺序分别 scatter 回去；不能把“理论上它们共享一个视觉编码器”误写成外层一定先将两者拼成一个同批 vision forward。[S1]

对于视频，ViT 的 `cu_seqlens` 为 `[0,784,1568,2352,3136]`。对于图片，是 `[0,784]`。语言层再处理它们的统一混合序列。

若**假设**其他 token 总数为 64，则 $L=1044$。第一个 DeltaNet 层的关键形状如下：

```text
hidden states:      [1, 1044, 4096]
projected QKV:      [1, 1044, 8192]
causal conv input:  [1, 8192, 1044]
Q/K before repeat: [1, 1044, 16, 128]
Q/K after repeat:  [1, 1044, 32, 128]
V and z:           [1, 1044, 32, 128]
a / b:             [1, 1044, 32]
final state:       [1, 32, 128, 128]
output:            [1, 1044, 4096]
```

第一个 Full Attention 层则使用：

```text
Q:             [1, 16, 1044, 256]
K/V:           [1, 4, 1044, 256]
RoPE cos/sin:  [1, 1044, 64]
attention out: [1, 1044, 4096]
```

在 eager 实现里，按 GQA 展开后可能形成 `[1,16,1044,1044]` 的 attention 权重；Flash/SDPA 的高效路径不必物化相同完整矩阵，但其 attention 数学语义没有因此变成 DeltaNet。

## 17. 计算复杂度与参数量 · 哪些结论可以算，哪些不能猜

### 17.1 视觉前端的复杂度

设每个 temporal group 有 $n=H_gW_g$ 个原始 patch，组数为 $T_g$。视觉 attention 的二次项接近：

$$
O(T_g n^2D_v),
$$

而不是不加区分地写成 $O((T_gn)^2D_v)$。投影和 MLP 仍有与 token 数线性相关的大量计算。空间分辨率增大可能显著提高 ViT 成本；降低视频时间采样率则主要减少组数。[S1]、[S7]

**Merger 在 27 个 ViT blocks 之后**，所以不能用已经除以 4 的视觉 token 数估计前面所有视觉 attention 的成本。

### 17.2 混合语言主干不是全局线性时间模型

忽略投影和 FFN 的常数，Full Attention 的 prefill 包含 $O(L^2)$ 项；DeltaNet 状态核心随长度接近 $O(LH_vd_kd_v)$，分块实现以固定 chunk 大小组织局部二次计算。[S1]

9B 只把其中 24 层替换为 DeltaNet，仍有 8 层 Full Attention。因此更准确的说法是**显著减少全注意力层数及相应 KV 成本**，而不是“整个 Qwen3.5 在长度上严格线性”。

实际速度还取决于 FFN、投影、视觉前端、kernel、并行方式和硬件。在短序列、fallback Python/PyTorch 路径或缺乏融合 kernel 时，复杂度优势不保证立即变成墙钟时间优势。本文没有测量这些速度。

### 17.3 9B 视觉前端参数量的解析核算

以下根据 9B 配置与本文审阅的模块定义逐项计算，计入相应 bias 和 norm 参数，不加载实际权重，也不计 MTP 或未参与标准前向的附加模块。

| 模块 | 参数量 |
|---|---:|
| Patch embedding | 1,770,624 |
| 可学习视觉位置表 | 2,654,208 |
| 每个视觉 block 的 attention | 5,313,024 |
| 每个视觉 block 的 MLP | 9,921,872 |
| 每个视觉 block 的两个 LayerNorm | 4,608 |
| 最终 merger | 40,119,040 |
| 27 层加前后端合计 | **456,010,480** |

例如 patch embedding 为 $3\times2\times16^2\times1152+1152$；视觉 MLP 的两个矩阵和 bias 为 $2\times1152\times4304+4304+1152$。这些具体公式比不区分版本地写“视觉编码器约 300M”更可复核。

以相同口径，9B 文本主干与独立 LM head 解析计数为 8,953,803,264；加上视觉前端为 9,409,813,744。**这属于按所读配置构建的标准模块参数核算，不是对 checkpoint 文件内容、MTP 权重或实际常驻显存的清点结果。**

## 参考资料

**S1**　[Dense 完整前向实现](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/modeling_qwen3_5.py)。

**S2**　[Qwen3.5 配置类](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/configuration_qwen3_5.py)。

**S3**　[Dense modular 源文件](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/modular_qwen3_5.py)。

**S4**　[图片处理实现](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen2_vl/image_processing_qwen2_vl.py)。

**S5**　[视频处理实现](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_vl/video_processing_qwen3_vl.py)。

**S6**　[统一 processor、时间戳与占位符](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_vl/processing_qwen3_vl.py)。

**S7**　[视觉网格、插值与注意力段 helper](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/vision_utils.py)。

**S8**　[缓存类型及线性状态管理](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/cache_utils.py)。

**S9**　[MoE 完整前向实现](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5_moe/modeling_qwen3_5_moe.py)。

**S10**　[MoE modular 继承关系](https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5_moe/modular_qwen3_5_moe.py)。

**C1**　[Qwen3.5-9B 实际模型配置](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/config.json)。

**C2**　[9B 图片 processor 配置](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/preprocessor_config.json)。

**C3**　[9B 视频 processor 配置](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/video_preprocessor_config.json)。

**C4**　[Qwen3.5-4B 实际模型配置](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/config.json)。

**C5**　[Qwen3.5-35B-A3B 实际模型配置](https://huggingface.co/Qwen/Qwen3.5-35B-A3B/blob/main/config.json)。

**C6**　[9B 聊天模板](https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/chat_template.jinja)。

**P1**　[Gated Delta Networks 原论文](https://arxiv.org/abs/2412.06464)。


[S1]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/modeling_qwen3_5.py
[S2]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/configuration_qwen3_5.py
[S3]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5/modular_qwen3_5.py
[S4]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen2_vl/image_processing_qwen2_vl.py
[S5]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_vl/video_processing_qwen3_vl.py
[S6]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_vl/processing_qwen3_vl.py
[S7]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/vision_utils.py
[S8]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/cache_utils.py
[S9]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5_moe/modeling_qwen3_5_moe.py
[S10]: https://github.com/huggingface/transformers/blob/bd15bc95a89e728bbc1224084eb3b5829428c353/src/transformers/models/qwen3_5_moe/modular_qwen3_5_moe.py
[C1]: https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/config.json
[C2]: https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/preprocessor_config.json
[C3]: https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/video_preprocessor_config.json
[C4]: https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/config.json
[C5]: https://huggingface.co/Qwen/Qwen3.5-35B-A3B/blob/main/config.json
[C6]: https://huggingface.co/Qwen/Qwen3.5-9B/blob/main/chat_template.jinja
[P1]: https://arxiv.org/abs/2412.06464
