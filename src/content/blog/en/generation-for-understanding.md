---
title: "How Generation Helps Understanding, From Missing Pixels to Predicting the World"
description: "Generation is more than a way to produce content. This essay follows pixel completion, structured readout, synthetic supervision, diffusion features, and future representation prediction to ask when generative objectives yield transferable and testable world representations."
pubDate: 2026-08-19
updatedDate: 2026-08-19
readingTime: "68 min"
tags:
  - Generative Models
  - Representation Learning
  - Multimodal Learning
  - World Models
  - Video Understanding
lang: en
translationKey: generation-for-understanding
tocDepth: chapters
featured: true
draft: false
sources:
  - label: "Generative Pretraining from Pixels"
    url: "https://proceedings.mlr.press/v119/chen20s.html"
  - label: "Masked Autoencoders Are Scalable Vision Learners"
    url: "https://arxiv.org/abs/2111.06377"
  - label: "VideoMAE"
    url: "https://arxiv.org/abs/2203.12602"
  - label: "Pix2Seq"
    url: "https://arxiv.org/abs/2109.10852"
  - label: "SpatialVLM"
    url: "https://arxiv.org/abs/2401.12168"
  - label: "Emergent Correspondence from Image Diffusion"
    url: "https://arxiv.org/abs/2306.03881"
  - label: "Your Diffusion Model is Secretly a Zero-Shot Classifier"
    url: "https://arxiv.org/abs/2303.16203"
  - label: "Emu3"
    url: "https://arxiv.org/abs/2409.18869"
  - label: "Janus"
    url: "https://arxiv.org/abs/2410.13848"
  - label: "V-JEPA 2"
    url: "https://arxiv.org/abs/2506.09985"
---

## Abstract

The visible product of a generative model is usually an image, a video, or a sentence. That product draws attention, yet it may be the least interesting part for someone studying intelligence. A model that fills a hidden region, writes an object detector result as tokens, decides which text condition best explains an image, or predicts what follows an action has to compress regularities in its data. Object boundaries, material, occlusion, spatial relations, event order, and action consequences can all leave traces in the hidden representation. Generation then becomes a learning constraint and a probe for asking what the model has captured.

This essay follows one technical line through that broad idea. iGPT showed that autoregressive pixel prediction could produce transferable visual features. MAE and VideoMAE deliberately removed most of the observation and asked the model to recover images or videos from sparse evidence. Pix2Seq turned detection into sequence generation, connecting structured understanding to a general readout interface. SpatialVLM showed how a generative pipeline could organize several vision teachers into spatial supervision at large scale. DIFT and Diffusion Classifier found correspondence features and conditional compatibility scores inside a diffusion model. Emu3 and Janus moved the debate into unified multimodal systems. Emu3 used one next-token objective across modalities, while Janus shared the main sequence model and separated two visual encoding paths. V-JEPA 2 shifted the target from pixels toward future latent representations and tested predictions against observations produced after real actions.

The central questions are deliberately modest. Under which conditions does a generative objective support understanding, how can that understanding be read out, and how can a generated hypothesis about the future face an empirical check. No single architecture settles them. A stronger conclusion emerges across the papers. Generation becomes a productive laboratory for understanding when it is joined to an information bottleneck, a measurable readout, independent evaluation, and feedback from the world.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.7rem;align-items:stretch">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--surface)"><strong>Missing observation</strong><p style="margin:.45rem 0 0">Hide pixels, frames, or latent blocks</p></div>
    <div style="display:grid;place-items:center;font-size:1.35rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;background:color-mix(in srgb,var(--accent) 9%,var(--surface))"><strong>Generative constraint</strong><p style="margin:.45rem 0 0">Predict content, structure, or a future</p></div>
    <div style="display:grid;place-items:center;font-size:1.35rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;background:var(--surface)"><strong>Testable understanding</strong><p style="margin:.45rem 0 0">Transfer, correspondence, decisions, and error</p></div>
  </div>
  <figcaption>Figure 1. The minimal chain used in this essay. Generation supplies the constraint, while independent tasks and real outcomes supply the evidence.</figcaption>
</figure>

## Chapter 1　Putting generation back into the chain of understanding

### 1.1 What generation means here

Generation has a wider meaning here than content creation. Given an observation (o), context (c), and an optional action (a), a model learns a conditional distribution or a prediction function for an unknown part (y). That unknown may be the next pixel, a masked image patch, an object-box token, a denoised sample, or the latent representation of a future state.

<div class="equation" role="math" aria-label="y hat equals G of observation, context, and action, while y is sampled from the corresponding conditional distribution"><span>ŷ = G(o, c, a)</span><span>y ∼ p(y ∣ o, c, a)</span></div>

The shared property is that training depends on information withheld from the model. Copying the input cannot solve the task. The model has to exploit stable relations in the data to reduce uncertainty. Recovering the hidden leg of a dog uses regularities in animal shape. Predicting a contact point after seeing a hand, a cup, and a table uses relations among geometry, time, and action. Such regularities may become reusable hidden state. They may also survive only long enough to serve a decoder. Transfer and intervention are needed to separate those cases.

Generation quality alone is therefore weak evidence of understanding. A sharp image can come from excellent texture statistics. A smooth video can avoid the difficult instant of contact. At least three further checks are useful. One asks whether a small readout can recover relevant information, as in a linear probe for category. Another asks whether frozen or lightly adapted representations transfer to correspondence, detection, spatial questions, or anticipation. The strongest check asks whether a prediction survives an intervention, as when a robot executes an action and the next camera observation meets or contradicts the predicted state.

### 1.2 Five ways generation can help

The papers in this essay reveal five distinct routes. They overlap, though each has its own failure mode.

| Route | What is generated | Regularity sought in the representation | Main evidence | Common overclaim |
| --- | --- | --- | --- | --- |
| Representation objective | Pixels, patches, tubes, or latent blocks | Semantics, shape, time, and context | Linear probes, transfer, retrieval | Good reconstruction guarantees good semantics |
| Unified readout | Coordinates, classes, and relation tokens | A shared output grammar across tasks | Multitask transfer and simpler heads | The sequence format creates understanding by itself |
| Synthetic supervision | Captions, questions, and measured relations | Rare concepts and long-tail combinations | Human audits and real-set generalization | Scale washes out teacher bias |
| Internal representation | Denoising features and conditional error | Correspondence and condition compatibility | Zero-shot tasks and domain transfer | A generator is automatically a universal discriminator |
| Future hypothesis | A next observation or future latent state | Dynamics, consequences, and reachability | Prediction error and closed-loop control | A plausible future is an executable future |

This table also supplies the standard used throughout the article. Whenever generation is said to improve understanding, four questions follow. What is predicted, what information has been removed, where is understanding read out, and how can real data expose an error. Missing one of these links makes a result easier to confuse with an attractive demonstration.

### 1.3 A useful representation takes one more step

A generator maps a training example to hidden state (h), and a decoder turns (h) into an output. If (h) stores only the local statistics needed by that decoder, transfer may be poor. If it preserves identity, position, pose, and temporal state in a stable organization, a small readout can reuse it.

Usefulness therefore has two parts. Relevant information must be present. Its organization must also be accessible under a limited label and compute budget. A powerful probe can discover correlations in almost any high-dimensional activation and may receive credit that belongs to its own training. Linear probes, frozen features, and low-data adaptation remain imperfect, though they reduce that ambiguity.

Layers matter as well. Early layers retain texture and local position. Late layers specialize toward the chosen output distribution. Middle layers may offer a better compromise for transfer. iGPT made that pattern unusually visible. Generative learning can create semantic information while its final prediction layers give some of that transferability back in exchange for better pixel modeling.

## Chapter 2　How pixel prediction grows visual features

### 2.1 The deliberately awkward experiment in iGPT

[Generative Pretraining from Pixels](https://proceedings.mlr.press/v119/chen20s.html) presented an intentionally plain experiment in 2020. Images were reduced to 32×32, 48×48, or 64×64. A nine-bit color palette reduced the vocabulary. Pixels were then placed in raster order and processed by a GPT-2-style Transformer. The architecture had no convolutional locality and relied on no elaborate vision-specific augmentation. The main objective predicted the next pixel. A related objective predicted pixels after a permutation.

The setup was expensive. A 48×48 image already creates 2,304 positions, and attention cost grows rapidly with sequence length. Color quantization and low resolution discard detail. Raster order forces a two-dimensional neighborhood into a one-dimensional path. Those limitations are part of the value of the experiment. With few visual priors written into the network, the result asks a clean question. Can pixel prediction alone make a Transformer learn a representation useful for recognition.

The answer was positive and qualified. In linear evaluation, iGPT-L reached 96.3 on CIFAR-10, 82.8 on CIFAR-100, and 95.5 on STL-10. The much larger iGPT-XL reached 72.0 on ImageNet. These results showed that label-free generative training could produce competitive features. They did not make the method an efficient default. iGPT-XL had 6.8 billion parameters, and systems with stronger visual structure could obtain better compute efficiency.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr auto 1.15fr auto 1fr;gap:.75rem;align-items:center">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;text-align:center"><strong>Two-dimensional image</strong><p style="margin:.4rem 0 0">Quantized color at low resolution</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px;text-align:center;background:color-mix(in srgb,var(--accent) 8%,transparent)"><strong>Raster sequence</strong><p style="margin:.4rem 0 0">Predict one pixel after another</p><div style="margin-top:.6rem;letter-spacing:.16rem">▦ → ▦ → ▦</div></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;text-align:center"><strong>Middle-layer features</strong><p style="margin:.4rem 0 0">Freeze and attach a linear classifier</p></div>
  </div>
  <figcaption>Figure 2. The revealing iGPT experiment probes hidden features and asks whether a small classifier can use them.</figcaption>
</figure>

### 2.2 Why the middle of the network matters

The iGPT layer-wise probes produced a lasting observation. Linear classification often peaked around the middle of the network and declined slightly near the final prediction layers. Early blocks build local evidence from color and position. Middle blocks need broader context to predict distant pixels, which makes semantic summaries useful. Final blocks become increasingly tailored to the exact conditional pixel distribution, where local color uncertainty receives more attention than a clean class boundary.

This pattern does not prove that the middle layer contains human-like concepts. A careful interpretation is that long-range pixel prediction requires statistics that overlap with human category labels. A linear probe establishes accessible correlation. It does not establish stable object identity, spatial reasoning, or causal knowledge.

The paper also found that generative performance and feature quality tended to improve together with scale. The association matters because a better model of the data distribution often needs a better internal summary. It has limits. Likelihood rewards low-level variation that a human label may ignore. Classification throws away information a generator needs. Their rankings have no reason to match for every architecture and dataset.

| iGPT observation | Supported conclusion | Conclusion still left open |
| --- | --- | --- |
| Label-free pixel prediction yields strong linear probes | A generative objective can induce accessible semantic information | The model has human-equivalent object concepts |
| Middle layers outperform the final layers | Information serves different purposes across depth | The middle layer is best for every downstream task |
| Generation and probes improve together with scale | Distribution modeling and feature quality are empirically related | Better likelihood guarantees better understanding everywhere |
| A generic Transformer can learn vision features | Feature learning can proceed without a vision-specific architecture | A generic architecture is more compute efficient |

### 2.3 The question iGPT left behind

iGPT opened the link between generation and understanding without providing an economical recipe. Later work changed the prediction unit and the bottleneck. Predicting every pixel in sequence was costly, so masked models predicted only missing regions. Low-level detail consumed capacity, so joint-embedding systems moved prediction into a latent space. A structured output such as boxes and labels could already be expressed as discrete symbols, so Pix2Seq generated that structure directly.

These changes share a design principle. An effective generative objective need not reproduce every input bit. It should close cheap shortcuts while retaining enough constraints to expose the regularities a downstream task needs. MAE and VideoMAE made this principle concrete and scalable.

## Chapter 3　After most of the input disappears

### 3.1 The asymmetric design of MAE

[Masked Autoencoders Are Scalable Vision Learners](https://arxiv.org/abs/2111.06377) divides an image into fixed-size patches, masks 75 percent of them at random, and sends only visible patches through the encoder. A lightweight decoder receives the encoded patches and mask tokens, then reconstructs normalized pixels in the missing patches. The encoder never processes mask tokens during pretraining. This asymmetry gives at least a threefold training speedup and keeps empty positions away from the main compute path.

A 75 percent mask ratio looks severe, but natural images contain heavy redundancy. With a low ratio, local interpolation can solve much of the task. When three quarters disappear, restoring fur beside an ear may require the larger layout of an animal head. Restoring the region around a wheel can use the shape of the vehicle body. Heavy masking moves the task away from local repair and toward longer-range context.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:.75rem;align-items:center">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Image patches</strong><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.18rem;margin-top:.65rem"> <i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:#64748b"></i><i style="aspect-ratio:1;background:#e2e8f0"></i><i style="aspect-ratio:1;background:#64748b"></i><i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:#475569"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:#64748b"></i><i style="aspect-ratio:1;background:#e2e8f0"></i><i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:#475569"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:#64748b"></i></div></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px"><strong>Encode one quarter</strong><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.18rem;margin-top:.65rem"><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:#cbd5e1"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i><i style="aspect-ratio:1;background:#94a3b8"></i><i style="aspect-ratio:1;background:var(--surface-2,#dbeafe)"></i></div></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Lightweight reconstruction</strong><p style="margin:.55rem 0 0">Discard the decoder and transfer the encoder</p></div>
  </div>
  <figcaption>Figure 3. MAE spends its main compute on the visible subset. Heavy masking creates a bottleneck, while the small decoder serves pretraining.</figcaption>
</figure>

Using ImageNet-1K alone, the paper reported 87.8 percent classification accuracy with ViT-H. Transfer was also strong on detection and segmentation. Pixel reconstruction is a low-level output, yet the encoder learned visual structure useful beyond reconstruction.

The division of labor matters. The decoder expands semantic uncertainty into particular pixels. The encoder extracts enough context from sparse evidence. Forcing the encoder to bear the full reconstruction burden may entangle its features more tightly with texture. The asymmetric design acknowledges that the output space used for pretraining and the representation space used at deployment can differ.

### 3.2 Why VideoMAE can hide even more

Video adds a time axis and more redundancy. Background, object appearance, and camera view usually change slowly across adjacent frames. Independent random masks per frame would let a model copy the same location from a nearby frame. [VideoMAE](https://arxiv.org/abs/2203.12602) uses tube masking instead. A spatial patch hidden in one frame remains hidden along a temporal tube.

Only 5 to 10 percent of the spatiotemporal tokens remain visible, corresponding to a 90 to 95 percent mask ratio. Sparse observation forces the encoder to use distant spatial evidence and temporal change. With no extra data, the paper reported 87.4 on Kinetics-400, 75.4 on Something-Something V2, 91.3 on UCF101, and 62.6 on HMDB51. It also found benefits on datasets with roughly three to four thousand videos, showing useful data efficiency.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Frame one</strong><div style="height:5rem;margin-top:.6rem;border-radius:9px;background:linear-gradient(90deg,#64748b 0 23%,#0f172a 23% 48%,#94a3b8 48% 71%,#0f172a 71%)"></div></div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px"><strong>Frame two</strong><div style="height:5rem;margin-top:.6rem;border-radius:9px;background:linear-gradient(90deg,#64748b 0 23%,#0f172a 23% 48%,#94a3b8 48% 71%,#0f172a 71%)"></div></div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Frame three</strong><div style="height:5rem;margin-top:.6rem;border-radius:9px;background:linear-gradient(90deg,#64748b 0 23%,#0f172a 23% 48%,#94a3b8 48% 71%,#0f172a 71%)"></div></div>
  </div>
  <div style="margin-top:.8rem;padding:.8rem 1rem;border-radius:12px;background:color-mix(in srgb,var(--accent) 8%,transparent);text-align:center">Hide the same spatial locations through time　→　block direct copying from adjacent frames</div>
  <figcaption>Figure 4. Tube masking closes the easiest temporal shortcut and makes reconstruction depend more on motion, shape, and scene context.</figcaption>
</figure>

### 3.3 Three boundaries of reconstruction

The first boundary is ambiguity. A hidden region can have several plausible contents. Pixel mean squared error favors an average answer and does not require the encoder to represent every possible world. It may capture the most common appearance in the dataset.

The second is shortcut design. Pixel-wise random masking leaks nearby texture. Independent frame masking leaks temporal copies. Large blocks, high ratios, and tubes deliberately control difficulty. Two methods can share the name masked reconstruction while inducing very different representations.

The third is domain. VideoMAE experiments still found data quality and domain shift important. Regularities learned from internet action videos do not automatically transfer to surgery, driving, or manipulation. Reconstruction uses unlabeled data efficiently. It does not erase collection bias.

| Design choice | iGPT | MAE | VideoMAE | Consequence for understanding |
| --- | --- | --- | --- | --- |
| Prediction unit | One quantized pixel | Patch pixels | Spatiotemporal tube pixels | Larger units usually reduce pressure from tiny local details |
| Visible context | Previous sequence positions | Random visible quarter | Roughly 5 to 10 percent of tubes | The bottleneck decides which shortcuts remain |
| Main compute | Full autoregressive prefix | Visible patches only | A small visible tube set | Sparse encoding improves scalability |
| Transferred component | Hidden features from selected layers | Encoder after discarding decoder | Video encoder after discarding decoder | Generation and understanding components can divide labor |
| Main risk | Long sequence and low-level statistics | Texture bias and fixed mask distribution | Temporal shortcuts and domain shift | Independent transfer evaluation remains necessary |

## Chapter 4　Writing an understanding result

### 4.1 A detection head can be a language

Vision systems traditionally assign a different output head to each task. Classification uses a class vector. Detection uses box regression and classification branches. Segmentation needs a dense decoder. [Pix2Seq](https://arxiv.org/abs/2109.10852) rewrote one of these interfaces. Bounding-box coordinates became discrete tokens followed by a class token. Multiple objects appeared in a randomly ordered sequence, which an autoregressive model generated from the image.

A car can be encoded as four quantized coordinates and one category. Separators and an end token organize multiple objects. Training remains conditional language modeling, with the encoded image as context and the decoder predicting the next token. Much of the machinery built specifically for object detection, including proposal matching and non-maximum suppression, is reduced.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr auto 1.3fr auto 1fr;gap:.75rem;align-items:center">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;text-align:center"><strong>Input image</strong><p style="margin:.45rem 0 0">Person, bicycle, and road</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,transparent)"><strong>Discrete token sequence</strong><p style="margin:.45rem 0 0;font-family:ui-monospace,monospace">y₁ x₁ y₂ x₂ person　y₁ x₁ y₂ x₂ bicycle</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px;text-align:center"><strong>Structured scene</strong><p style="margin:.45rem 0 0">Boxes, classes, and order</p></div>
  </div>
  <figcaption>Figure 5. Pix2Seq carries detection through a general sequence interface. Ground-truth boxes and classes still decide whether the readout is correct.</figcaption>
</figure>

### 4.2 What a unified readout actually unifies

Pix2Seq demonstrates that many structured outputs fit a shared discrete interface. The result stands without treating coordinates as intrinsically linguistic. A decoder may then reuse its sequence modeling across detection, captioning, question answering, and other tasks. Adding a task can start with a token grammar and reuse the output network.

The common interface also makes errors comparable. Missing an object removes a subsequence. Poor localization changes coordinate tokens. Class confusion appears at a category position. Sequence likelihood can train the model, though evaluation must decode the sequence into geometry and apply detection metrics. Generative readout connects tasks to one bus without removing the measurement attached to each task.

There are costs. A set of objects has no unique order. Coordinate quantization imposes a resolution limit. Early sequence errors can influence later tokens. A poorly designed grammar spends capacity on format repair. Unification is strongest at the interface and optimization level. The input evidence required by different tasks can still demand different visual pathways.

### 4.3 What the output format teaches us to ask

Pix2Seq encourages a useful habit. Ask whether the generated object corresponds to a scored task. Boxes have intersection over union, classes have accuracy, relation graphs have structural consistency, and depth has metric error. Once an output is bound to a computable object, visual appeal stops being the only judge.

This binding supports synthetic supervision as well. Objects, depth, segments, and captions can be stored as structured records. A pipeline can combine those records into questions with numerical or relational answers. SpatialVLM follows exactly this path, turning the output of several vision systems into a much larger teaching set.

## Chapter 5　Using generation to expand what can be learned

### 5.1 The SpatialVLM data factory

Large-scale spatial question answering is expensive to annotate by hand. An annotator must identify objects and also estimate distance, size, orientation, and relative position. [SpatialVLM](https://arxiv.org/abs/2401.12168) built a synthetic pipeline instead. Open-vocabulary detection supplied candidate objects. Segmentation produced regions. Monocular depth estimated geometry. Captioning added text for objects. The system combined these outputs into a scene record and generated questions and answers through templates and language generation.

The paper used about ten million real images and generated about two billion question-answer pairs. Half were qualitative and half quantitative. Qualitative questions covered relations such as left, right, front, behind, inside, and near. Quantitative questions asked for distance and size. Generation did not create visual facts from nothing. It reorganized predictions from several teachers into supervision that a vision-language model could consume.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.7rem">
    <div style="padding:.9rem;border:1px solid var(--border);border-radius:14px"><strong>Object teacher</strong><p style="margin:.4rem 0 0">Open-vocabulary boxes and names</p></div>
    <div style="padding:.9rem;border:1px solid var(--border);border-radius:14px"><strong>Geometry teachers</strong><p style="margin:.4rem 0 0">Segments, depth, and scale</p></div>
    <div style="padding:.9rem;border:1px solid var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,transparent)"><strong>Scene assembly</strong><p style="margin:.4rem 0 0">Coordinate alignment and rules</p></div>
    <div style="padding:.9rem;border:1px solid var(--border);border-radius:14px"><strong>Question supervision</strong><p style="margin:.4rem 0 0">Relations and numerical answers</p></div>
  </div>
  <div style="margin-top:.8rem;display:grid;grid-template-columns:1fr 1fr;gap:.7rem">
    <div style="padding:.8rem;border-radius:12px;background:color-mix(in srgb,#22c55e 10%,transparent)">Human audit　check objects, relations, and units</div>
    <div style="padding:.8rem;border-radius:12px;background:color-mix(in srgb,#f59e0b 12%,transparent)">Real-data evaluation　check whether teacher errors are amplified</div>
  </div>
  <figcaption>Figure 6. Synthetic supervision is only as credible as its teacher ensemble, geometry, and audit loop. Language generation is one stage of the pipeline.</figcaption>
</figure>

### 5.2 Teacher error travels down the pipeline

Monocular depth has ambiguous absolute scale. A detector can miss small objects, and a segmentation boundary can drift. If a pipeline uses those outputs to calculate distance and then writes a confident answer, a student receives teacher error as fact. More data can repeat the same bias more consistently.

The SpatialVLM work introduced real robot depth data to improve quantitative labels. That choice captures an important lesson. Synthetic supervision increases coverage while real measurement anchors scale. Qualitative labels also need uncertainty. When two object centers differ by only a few pixels, forcing a hard left or right answer creates a fragile boundary. Keeping confidence, removing marginal cases, and testing sensitivity to teacher versions are safer practices.

| Synthetic stage | Signal produced | Systematic error | Practical audit |
| --- | --- | --- | --- |
| Open-vocabulary detection | Object names and boxes | Long-tail misses and class confusion | Stratified sampling by class and size |
| Instance segmentation | Object region | Boundary drift under occlusion | Compare mask boundaries with boxes and depth |
| Monocular depth | Relative or approximate metric depth | Scale drift and reflective surfaces | Calibrate a subset with sensor depth |
| Relation calculation | Direction, distance, and size | Threshold sensitivity and accumulated error | Retain intermediate values and confidence |
| Question generation | Natural-language supervision | Template leakage and ambiguity | Deduplicate, paraphrase, and review |
| Student training | Scalable spatial capability | Inherited teacher blind spots | Evaluate on an independent real set |

### 5.3 When synthetic supervision earns trust

Synthetic labels work best where manual coverage is difficult and programmatic verification remains possible. Spatial relations have geometry. Coordinates and depth leave intermediate evidence. A question can be traced back to a scene record. Supervision about private intention, social meaning, or an unobserved cause has a weaker trail. Scaling it can hide the missing evidence.

A reliable dataset keeps four layers. The bottom layer holds original images and sensors. A teacher layer stores checkpoints, predictions, and confidence. A computation layer stores relation rules and intermediate values. Natural-language questions sit at the top. When the student fails, researchers can trace the error toward perception, geometry, language, or student learning.

SpatialVLM also broadens the meaning of generation for understanding. The final model does not need to synthesize an image. Generating questions, structured labels, and difficult examples can be equally valuable. The decisive issue is whether supervision refers to observable facts and whether its errors remain traceable.

## Chapter 6　What can be read from inside a generator

### 6.1 Finding correspondence inside a denoiser

A diffusion model receives a noisy image, a noise level, and an optional condition. It learns to predict noise or an equivalent target. To reconstruct an image gradually, the intermediate layers of its U-Net combine edges, parts, and global semantics at several spatial resolutions. These features were trained for generation, though they can serve understanding tasks directly.

[Emergent Correspondence from Image Diffusion](https://arxiv.org/abs/2306.03881) introduced DIFT with a simple procedure. Add a chosen level of noise to a real image, pass it through a pretrained diffusion network, and extract spatial features from a selected layer. Feature similarity between two images then supplies semantic, geometric, or temporal correspondences. No task-specific fine-tuning and no correspondence labels are needed.

On SPair-71k, the paper reported that DIFT from Stable Diffusion surpassed DINO by 19 percentage points and OpenCLIP by 14. It handled semantic correspondence across different instances, geometric correspondence across pose, and temporal correspondence across video frames. A denoiser trained to align conditions and spatial structure had developed location-sensitive features with substantial semantic content.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr auto 1.2fr auto 1fr;gap:.75rem;align-items:center">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Two observations</strong><p style="margin:.45rem 0 0">Different poses, instances, or times</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,transparent)"><strong>Shared denoising network</strong><p style="margin:.45rem 0 0">A fixed noise step and hidden layer</p><div style="margin-top:.7rem;display:flex;gap:.3rem"><i style="height:.65rem;flex:1;background:#94a3b8;border-radius:999px"></i><i style="height:.65rem;flex:1.6;background:var(--accent);border-radius:999px"></i><i style="height:.65rem;flex:.8;background:#64748b;border-radius:999px"></i></div></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Feature neighbors</strong><p style="margin:.45rem 0 0">Point correspondence and propagation</p></div>
  </div>
  <figcaption>Figure 7. DIFT bypasses image sampling and reads spatial features from the denoiser. Noise step and network layer locate the readout.</figcaption>
</figure>

### 6.2 Noise level works like a scale control

DIFT features depend on the diffusion time step. At low noise, the network sees something close to the input and can retain texture and precise location. With more noise, local evidence weakens and shape or category priors matter more. Excessive noise eventually removes instance detail. The paper found useful correspondence over a reasonably broad range, which makes the effect more persuasive than one lucky time step.

Network depth controls a related tradeoff. Shallow maps preserve resolution and boundaries. Deeper layers have wider context and often match semantic parts more reliably, at the cost of exact localization. A correspondence system may select an intermediate layer or combine several levels. A generator does not contain one uniform representation. Where the readout is placed determines which capability becomes visible.

DIFT has ordinary failure modes. Repeated texture, symmetric parts, severe occlusion, and uncommon categories can confuse nearest-neighbor matching. Bias from web-scale image and text data remains. Zero-shot correspondence shows that one form of structure has emerged. It does not guarantee counting, material reasoning, or causal judgment.

### 6.3 Turning denoising error into a class score

A diffusion model offers another readout. [Your Diffusion Model is Secretly a Zero-Shot Classifier](https://arxiv.org/abs/2303.16203) proposed Diffusion Classifier. Given an image (x) and a candidate label expressed as text (c), the method samples noise and time steps and asks a conditional diffusion model to predict the noise. A condition that fits the image should make denoising easier and produce lower average prediction error.

<div class="equation" role="math" aria-label="the score of condition c for image x is the negative expected squared denoising error"><span>s(c ∣ x) = −E<sub>t, ε</sub> [‖ε − ε<sub>θ</sub>(x<sub>t</sub>, c, t)‖²]</span></div>

Candidate conditions share the same noise and time samples to reduce Monte Carlo variance. No new classifier parameters are trained, and natural-language class names enter through the existing conditioning channel. The paper found competitive performance on several classification benchmarks and particularly interesting compositional behavior, where attributes and relations in the condition matter.

The compute cost is substantial. Every candidate requires many U-Net evaluations. In the paper's Oxford-IIIT Pets example, an adaptive scheme still took about 18 seconds per image on an RTX 3090. More classes increase the burden. Prompt wording, model checkpoint, and pretraining distribution also affect the score. The method is a revealing probe of knowledge inside a generator. It is rarely a drop-in answer for latency-sensitive classification.

| Readout | Object being read | New parameters | Strength | Limitation |
| --- | --- | --- | --- | --- |
| iGPT linear probe | A selected Transformer layer | A linear layer | Measures linearly accessible information | Depends on layer and labeled probe set |
| DIFT | Spatial features in a diffusion U-Net | None | Dense and location preserving | Depends on time, layer, and matching rule |
| Diffusion Classifier | Conditional denoising error | None | Text can define classes and compositions | Many candidates and samples are expensive |
| Downstream fine-tuning | Some or all encoder weights | Many | Adapts to difficult tasks | New training can be confused with pretrained ability |

### 6.4 An internal capability needs reproducible coordinates

A claim about representation quality should report the exact checkpoint, input processing, noise schedule, time step, layer, normalization, and matching rule. A conditional-error classifier also needs its candidate set, prompt template, number of samples, and random-number sharing strategy. Omitting any of these can make the result hard to reproduce.

Controls matter even more. How far does a randomly initialized network go. What happens with a discriminative model at comparable resolution and compute. How much does removing the text condition change. Do irrelevant prompts disturb the ranking. A large generator inevitably retains a great deal of input information. These controls help attribute success to structure learned through generation while accounting for capacity and leakage.

## Chapter 7　Two answers to unified generation and understanding

### 7.1 Emu3 puts modalities into one sequence

[Emu3](https://arxiv.org/abs/2409.18869) maps text, images, and video into discrete token spaces and trains a Transformer from scratch with next-token prediction. Mixed multimodal sequences share one causal objective. Image generation continues a sequence with visual tokens. Image understanding predicts text after a visual prefix. Video extends visual tokens across time.

The objective is appealingly simple. A single training loop can cover generation and perception without separate diffusion, contrastive, and language losses. Cross-modal relations are learned through the same conditional distribution. The paper demonstrated image generation, vision-language understanding, and autoregressive video generation up to five seconds at 24 frames per second. One next-token objective was broad enough to support a substantial range of tasks.

The surrounding system remains complex. A visual tokenizer decides what detail survives discretization. Visual sequences are much longer than text. Long video creates a severe context burden. Data mixture ratios determine where capacity goes. Unification happens at the token and backbone level, while vocabulary, position, preprocessing, and sampling still require modality-aware design.

### 7.2 Why Janus separates the visual entrances

[Janus](https://arxiv.org/abs/2410.13848) offers a different answer. It keeps a shared unified Transformer while using separate visual encoding paths for understanding and image generation. Understanding benefits from high-level semantic features stable under nuisance variation. Generation needs color, texture, and spatial detail sufficient to reconstruct visual tokens. A single visual encoder may face conflicting granularity requirements.

Janus places the separation at the input. An understanding encoder maps an image into semantic features and adapts them to the shared backbone. A generation encoder uses a discrete representation suitable for reconstruction, with a corresponding decoder to recover generated visual tokens. Sequence modeling and cross-modal context remain shared.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:16px">
      <strong>The Emu3 route</strong>
      <div style="margin-top:.8rem;display:grid;gap:.5rem"><span style="padding:.65rem;border-radius:10px;background:color-mix(in srgb,var(--accent) 8%,transparent)">Discrete text, image, and video tokens</span><span style="text-align:center;color:var(--accent)">↓</span><span style="padding:.65rem;border:1px solid var(--accent);border-radius:10px">One next-token Transformer</span></div>
    </div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:16px">
      <strong>The Janus route</strong>
      <div style="margin-top:.8rem;display:grid;grid-template-columns:1fr 1fr;gap:.45rem"><span style="padding:.65rem;border-radius:10px;background:color-mix(in srgb,#22c55e 10%,transparent)">Understanding encoder</span><span style="padding:.65rem;border-radius:10px;background:color-mix(in srgb,#f59e0b 12%,transparent)">Generation encoder</span><span style="grid-column:1 / -1;text-align:center;color:var(--accent)">↓</span><span style="grid-column:1 / -1;padding:.65rem;border:1px solid var(--accent);border-radius:10px">Shared unified Transformer</span></div>
    </div>
  </div>
  <figcaption>Figure 8. Unification can happen at different boundaries. Emu3 emphasizes one token objective, while Janus lets two visual entrances serve different granularity needs.</figcaption>
</figure>

The first Janus paper reported 61 percent on GenEval, with FID values of 8.53 on COCO-30K and 10.10 on MJHQ-30K, alongside vision-language understanding results. Exact numbers move with data, scale, and evaluation implementation. They establish the viability of decoupled visual paths more clearly than they settle a permanent architecture ranking.

### 7.3 Four checks for unification

The first check is interference. Does adding generative data lower understanding performance. Does a high-resolution visual vocabulary hurt language tasks. An average score can hide a regression in a small but important task.

The second check is transfer. Does sharing help a low-resource task, or merely simplify maintenance. Fully separate models, a shared backbone with separate entrances, and a fully unified model should be compared under matched parameter and training budgets.

The third check is interface cost. How long are visual sequences. What happens to memory and first-token latency. Do generation and understanding require different resolutions. Pulling every task into the longest sequence can consume the efficiency gained by parameter sharing.

The fourth check is information loss. Reconstruction quality of a visual tokenizer does not establish semantic quality. Robust semantic features do not guarantee fine generation. Janus makes the tension explicit and allows each path to be measured for what it preserves.

| Dimension | Emu3 choice | Janus choice | What an experiment should compare |
| --- | --- | --- | --- |
| Objective | Next-token prediction over mixed sequences | Autoregression through a shared backbone | Convergence and transfer under the same data budget |
| Visual entrance | Discrete visual tokens in a unified sequence | Decoupled encoders for understanding and generation | Semantic retention and reconstruction detail |
| Shared component | Token interface and Transformer backbone | Primarily the Transformer backbone | Parameter efficiency and interference |
| Main advantage | A uniform pipeline and composable tasks | Reduced conflict between visual granularities | Cost of adding a new task |
| Main risk | Long sequences, tokenizer loss, and capacity competition | More components and an alignment burden | End-to-end latency and ablations |

## Chapter 8　From completing observations to predicting a world

### 8.1 Pixels are not the only useful future

Future video contains a large amount of unpredictable detail. A reflection on a cup, a wrinkle in clothing, or camera noise can create pixel error without changing the fact that a hand will pick up the cup. A model required to generate every future pixel spends capacity on such details and may average several plausible futures into a blur.

A joint-embedding predictive architecture moves the target into representation space. A context encoder reads visible video. A target encoder produces latent representations for future or hidden regions. A predictor tries to approach those target representations. If the target space is stable to irrelevant texture while retaining object and action state, the task aligns more closely with useful abstraction.

[V-JEPA 2](https://arxiv.org/abs/2506.09985) scales this approach for video. Its VM22M collection draws from curated YouTube video, Something-Something V2, Kinetics, HowTo100M, ImageNet, and related sources. Pretraining covers more than one million hours of video and images without action labels. The objective predicts latent representations and leaves pixel reconstruction aside.

### 8.2 Do the representations support perception and anticipation

The paper reported 77.3 top-1 on Something-Something V2 and 39.7 recall at five on EPIC-KITCHENS action anticipation. After alignment with an 8-billion-parameter language model, it reached 84.0 on PerceptionTest and 76.9 on TempCompass video question answering. These tasks cover action categories, cues about a coming action, and temporal questions. Together they show that predictive training left information usable across several forms of video understanding.

Video benchmarks can still reward background and dataset priors. Objects in a kitchen hint at likely actions, and editing patterns can reveal event boundaries. Action-conditioned prediction provides stronger evidence. Given the current observation and a candidate action, a model predicts a resulting state. If that prediction helps choose an action that reaches a target, the model begins to serve as a world model.

### 8.3 The closed-loop check in V-JEPA 2-AC

V-JEPA 2-AC freezes the video encoder and trains a frame-causal, action-conditioned predictor. It uses fewer than 62 hours of DROID robot video with actions and proprioceptive state. The predictor receives current visual state, candidate actions, and robot state, then predicts future representations. During planning, model predictive control evaluates action sequences, chooses one whose predicted future approaches a goal-image representation, executes an initial segment, and observes again.

<figure class="concept-figure">
  <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:.75rem;align-items:center">
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Current observation</strong><p style="margin:.45rem 0 0">Image and robot state</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--accent);border-radius:14px;background:color-mix(in srgb,var(--accent) 8%,transparent)"><strong>Candidate action rollouts</strong><p style="margin:.45rem 0 0">Predict several future latent states</p></div>
    <div style="font-size:1.3rem;color:var(--accent)">→</div>
    <div style="padding:1rem;border:1px solid var(--border);border-radius:14px"><strong>Act and observe again</strong><p style="margin:.45rem 0 0">Compare the real outcome and replan</p></div>
  </div>
  <div style="margin-top:.8rem;padding:.8rem 1rem;border-radius:12px;background:color-mix(in srgb,#22c55e 10%,transparent);text-align:center">Goal representation ↑　predicted futures approach it　camera feedback keeps correcting the plan</div>
  <figcaption>Figure 9. A future hypothesis becomes testable when it meets the observation produced after an action.</figcaption>
</figure>

The paper tested reaching and grasping with Franka arms in two laboratories, without target-environment data, task-specific training, or manually specified reward functions. Video pretraining supplied broad visual dynamics. A small action-labeled robot dataset connected action to the predictor. A goal image specified the desired state.

The zero-shot label needs careful reading. The predictor had seen robot interactions from DROID. It had not seen data from the target laboratories or the exact tasks. Distance to a goal-image representation still acts as a cost. Avoiding a hand-written grasp reward does not mean the system has no target signal.

### 8.4 Why a latent future behaves more like a hypothesis

A pixel generator presents a visually complete future, which encourages viewers to trust irrelevant details. A latent predictor admits that many details do not matter for a decision and represents what its target encoder treats as stable. Given an action sequence from t through t + H, it predicts the representation at that future point and compares the state with a goal representation.

<div class="equation" role="math" aria-label="the selected action minimizes distance between the predicted future representation and the goal representation"><span>a* = arg min<sub>a</sub> d(ẑ<sub>t+H</sub>(z<sub>t</sub>, a), z<sub>g</sub>)</span></div>

Two risks follow. Representation distance may ignore safety, allowing a predicted arm path through an obstacle. A predictor can also be overconfident on actions beyond its training distribution. Closed-loop replanning limits accumulated error, though it cannot replace collision constraints, uncertainty estimates, and failure detection.

| Future target | Prediction | Advantage retained | Information at risk | Suitable evaluation |
| --- | --- | --- | --- | --- |
| Future pixels | Color at every location | Direct visualization and detail | Ambiguous futures blur and consume capacity | Perceptual metrics and event consistency |
| Discrete visual tokens | Compressed image or video tokens | Fits unified autoregressive modeling | Tokenizer error and long sequences | Reconstruction, generation, and transfer |
| Future latent representation | Abstract target-encoder state | Focuses on stable task-related factors | Safety-critical detail may disappear | Latent prediction, anticipation, and control |
| Action-conditioned representation | State after a proposed action | Supports comparing plans with goals | Out-of-distribution actions can be unreliable | Real execution success and closed-loop error |

## Chapter 9　Making a future hypothesis testable

### 9.1 What a hypothesis should leave behind

A useful future hypothesis should include more than a sample. Five records are needed. The first is the current observation, including time window, sensors, and preprocessing. The second is the condition, such as action, language goal, and environment state. The third defines the target as pixels, tokens, or a specific latent layer. The fourth describes uncertainty through sample dispersion or ensemble disagreement. The fifth records the real outcome after the prediction horizon.

These records make failure attributable. A miss may come from an occluded obstacle, an action outside the training distribution, or a representation distance insensitive to the task. Keeping only the final rendered video makes those causes difficult to separate.

### 9.2 Multiple futures should not collapse into an average

A person at an intersection may turn left or right. A robot approaching a cup may grasp the handle or the body. The observed next frame is one valid future among several. A point regression loss penalizes alternatives that did not occur and can produce an average state.

A generative distribution can retain alternatives, provided that coverage is measured. Sampled futures can be evaluated by whether the real outcome lies near the predicted set and whether samples differ at the event level. A latent model can predict several prototypes or an explicit distribution, then report likelihood, calibration error, and coverage. Planning experiments should verify that different branches lead to meaningfully different actions.

Diversity can be superficial. Changing background texture increases pixel distance without covering another event. Evaluation should compare object trajectories, contact relations, and task states. A useful future model concentrates probability on a small number of realizable and behaviorally distinct paths.

### 9.3 Counterfactual action is harder than following a video

Recorded video shows only the action that happened. A model can learn that a hand usually reaches before lifting a cup without learning what another motion would cause from the same state. Planning evaluates actions that were never executed, which requires counterfactual generalization.

Action-conditioned data helps by showing several actions from similar scenes. Failure, hesitation, and recovery belong beside successful trajectories. If training nearly always contains a straight path to a target, a detour around an obstacle has little support.

Paired interventions provide a stronger evaluation. Start from nearly identical states, vary one action dimension, and compare both the real and predicted difference. If shuffling action labels barely changes predictions, the supposed action-conditioned world model is relying mainly on visual inertia.

### 9.4 From offline score to closed-loop evidence

Offline prediction error supports quick iteration but misses error accumulation. A small mistake at every step pushes the model toward states absent from training. Closed-loop control executes a short segment, observes again, and replans. Frequent correction can also hide a poor dynamics model.

Both open-loop and closed-loop results are therefore needed. Open-loop tests measure representation error and event consistency across horizons. Closed-loop tests measure task success, collision, path length, replanning frequency, and recovery. A reactive baseline without a future predictor helps reveal whether the gain comes from predictive modeling or from visual servoing.

| Evaluation level | Central question | Minimum control | Useful metrics | Warning sign |
| --- | --- | --- | --- | --- |
| Representation | Does predicted state retain task information | Current-frame copy and random features | Linear readout, retrieval, and distance calibration | Works only for in-domain categories |
| Dynamics | Does action change the prediction | Shuffled actions and zero action | Multi-horizon error and action sensitivity | Output stays fixed when action changes |
| Distribution | Are alternative futures covered | Single-point regression | Coverage, calibration, and event diversity | Samples differ only in texture |
| Planning | Does prediction improve action choice | Reactive policy and model-free search | Success, path length, and safety events | Strong offline score with no control gain |
| Transfer | Do regularities survive a new environment | In-domain trained counterpart | Cross-scene drop and recovery rate | A background change causes collapse |

## Chapter 10　A research program built around evidence

### 10.1 Choose the variables that must be understood

A project should begin with the variables that affect decisions. A correspondence task may need part identity and two-dimensional position. Spatial question answering needs objects, depth, scale, and a reference frame. Robot manipulation adds contact state, reachability, and action consequences.

Those variables guide the prediction target. Pixels retain detail. Discrete tokens give sequence models a common interface. Latent representations can filter irrelevant variation. Structured objects make audits easier. Several targets can be trained together, though each objective should have a stated role. If a task depends on contact and the data never show the moment of contact, impressive samples cannot supply missing evidence.

### 10.2 Use bottlenecks to close shortcuts

An effective objective removes the cheapest solution. Image reconstruction can use larger blocks and higher masking. Video reconstruction can use tubes to prevent copying from adjacent frames. Spatial supervision can preserve the depth and segmentation values behind every answer. Action prediction can include shuffled-action controls to check whether the condition matters.

A bottleneck can also go too far. When almost every patch disappears, category priors may dominate and instance detail may vanish. A highly invariant latent space may erase a small obstacle relevant to safety. A good experiment plots difficulty against several outcomes. Mask ratio, compression, and prediction horizon should be compared with reconstruction, transfer, and control. The useful point is rarely the one with the lowest training loss.

### 10.3 Share at the layer where sharing helps

A unified output grammar reuses a task interface. A shared sequence backbone reuses cross-modal context. A shared visual entrance makes sense only when understanding and generation need compatible detail. Emu3 and Janus show several possible boundaries for unification.

A three-way ablation can locate that boundary. Fully separate systems give an interference-free reference. A shared backbone with separate visual entrances tests parameter reuse. A fully unified visual representation tests the strongest sharing. Total parameters, training data, and compute must remain close, or a budget difference will masquerade as an architectural result.

### 10.4 Fix the coordinates of internal readouts

Selecting whichever layer performs best after every run creates selection bias. A safer study names a shallow, middle, and deep layer in advance. Diffusion experiments can add three fixed noise levels. Models then share input processing, feature dimension, and probe budget. The registered positions become the main result, while a complete search remains an analysis.

Readout tasks should cover several forms of information. Classification checks global semantics. Correspondence checks dense geometry. Spatial questions check relations. Action anticipation checks time. Closed-loop control checks whether predictive structure is usable. Success on one readout establishes one accessible property. Consistent gains across different readouts provide stronger evidence of generality.

### 10.5 Preserve the evidence chain in synthetic supervision

Every synthetic example should retain its source image, teacher checkpoint, raw predictions, calculation rules, question, and answer. Numerical answers benefit from units and confidence intervals. Relations near a threshold should keep their continuous intermediate values. A teacher update should first be evaluated on a fixed audit set, then incorporated with an explicit version record.

Random inspection alone is insufficient. Sampling should be stratified by small objects, occlusion, reflection, long distance, unusual view, and minority category. A small gold set from sensors or careful annotation can measure teacher error continuously. Synthetic scale supplies coverage. The gold set supplies calibration.

### 10.6 A compact research record

The following table can serve as a study checklist. It cannot guarantee a correct conclusion, though it prevents several familiar jumps in evidence.

| Item | Decision to make before training | Evidence to publish |
| --- | --- | --- |
| Prediction target | Pixels, tokens, structures, or latent state | Target definition and preprocessing |
| Information bottleneck | Masking, order, compression, or horizon | Difficulty ablations and shortcut controls |
| Representation coordinate | Layer, diffusion time, and pooling | Fixed coordinates and a full layer curve |
| Sharing boundary | Encoders, backbone, and decoders that share | Budget-matched separate and shared baselines |
| Synthetic supervision | Teachers, rules, confidence, and versions | Gold-set error and stratified audit |
| Future hypothesis | Conditions, branches, and uncertainty | Open-loop coverage and calibration |
| Closed-loop use | Objective, constraints, and replanning rate | Success, safety events, and reactive baseline |
| Domain transfer | Differences between training and deployment | Out-of-distribution loss and failure cases |

## Chapter 11　Plausible conclusions that the evidence does not support

### 11.1 A realistic sample proves physical understanding

Visual continuity can come from short-range statistics. Physical understanding requires tests of persistence, collision, reappearance after occlusion, and intervention. Paired videos can vary support, contact, or object mass while preserving appearance. A model that changes its prediction with the causally relevant variable has stronger evidence than one that merely looks smooth on ordinary clips.

### 11.2 Lower reconstruction loss means a better representation

A model can memorize frequent texture and improve pixel error without helping category or correspondence. A representation that filters sensor noise may reconstruct worse and control better. Plotting the pretraining target alongside downstream readouts reveals where their curves separate. The separation is useful evidence about objective design.

### 11.3 One decoder emits every format, so perception is unified

A common sequence decoder reduces task-specific code. It does not resolve differences in resolution and granularity. Detection coordinates, image texture, and long video events require different evidence from an input. A unified system earns its name through transfer and efficiency while avoiding task interference.

### 11.4 A very large synthetic set covers the long tail

An object missed by every teacher never enters a generated question. A relation absent from templates does not appear through scale. Long-tail coverage has to be measured against a real target distribution. Counting diverse sentences is inadequate. Object classes, relation types, distance ranges, and failure categories matter underneath the wording.

### 11.5 A zero-shot readout means the capability required no training

DIFT and Diffusion Classifier train no new task parameters, though their generators received large-scale pretraining. Similar images and labels may occur in those data. Zero-shot describes adaptation to the task. It does not erase the source of the representation. Reporting should state what is known about pretraining data and include deduplication and domain-transfer tests where possible.

### 11.6 A successful robot run proves general causal knowledge

A successful trajectory may depend on visual servoing, goal-image similarity, or a convenient layout. Tests should vary objects, backgrounds, arms, and action magnitudes, and should include failure. Shuffling actions, removing the predictor, or replacing predicted distance with current-frame distance can isolate the contribution of future modeling. Generality comes from stable performance under systematic variation.

## Chapter 12　Questions worth pursuing

### 12.1 Which future representation keeps dangerous details

Latent targets make prediction easier through invariance and may hide small obstacles, sharp edges, or tiny motion before contact. A future representation could be layered. A high-level branch predicts objects and events. A lower branch preserves geometry and safety-relevant detail. Planning can use task-dependent distance while keeping collision constraints explicit. Learning this division without hand-coding every hazard remains an open problem.

One evaluation can keep event labels, depth maps, and force sensing for the same robot trajectories. The high-level branch decides whether a grasp occurs. The low-level branch estimates clearance from the gripper to the cup and the instant of contact. Correct event recognition with poor geometry can still cause a collision during execution. Separate metrics reveal that failure and show whether adding the low-level branch harms semantic transfer across scenes. Safety-relevant detail then receives a measurement independent of the visual appeal of a generated frame.

### 12.2 Can a generative target discover controllable variables

Ordinary video supplies observational correlation. Action data identifies changes available to an agent. Joint training could combine abundant action-free video prediction with a small action-conditioned objective. The first supplies visual structure, and the second marks controllable directions in latent space. The risk is overfitting the shared representation to one robot. Object dynamics should transfer while embodiment-specific control remains distinguishable.

### 12.3 Connecting a language hypothesis to visual verification

A language model can propose a high-level hypothesis such as a cup being hidden by a box and becoming visible when the box moves. A visual predictor can translate that statement into a constraint on a future state. A robot can act and check whether the object appears. Language supplies composition and explanation, vision supplies spatial and temporal consistency, and observation decides the result. Traceable intermediate variables are necessary so a fluent account cannot override visual evidence.

### 12.4 Turning generative failure into active data collection

Large disagreement among future samples, similar denoising errors for competing conditions, and frequent closed-loop correction all reveal weak knowledge. These states can enter a data queue for sensor measurement, human annotation, or robot exploration. New real evidence can recalibrate synthetic teachers and future predictors. Generation then helps decide where the next evidence should come from as well as defining a training target.

### 12.5 Does a unified model need unified memory

Image understanding often depends on a current frame. Video prediction needs persistent temporal state. Robot planning also needs action history and failure. Placing the entire past into one token context quickly becomes unwieldy. A system may need object-level state, event summaries, and a short visual buffer. Generators and understanding readouts could query the same memory at different resolutions. Whether that memory can be updated and corrected may matter more than the length of a single generation.

### 12.6 Making uncertainty visible

Many systems emit one answer. A viewer cannot tell whether a future trajectory is a confident choice or one arbitrary sample among near ties. If generation is to serve as hypothesis formation, uncertainty should travel with the prediction. Pixel models can compare object trajectories across samples. Latent systems can use ensembles or distribution heads. Conditional denoising readouts can report the error margin among candidate conditions.

Uncertainty must be calibrated against outcomes. A claim assigned 70 percent confidence should occur about 70 percent of the time across a suitable set. Video futures can be mapped to observable propositions such as whether a hand touches a cup, a cup leaves a table, or a door opens fully. Reliability diagrams can then evaluate those propositions. A small latent distance lacks a probabilistic interpretation until it has been calibrated.

Calibrated uncertainty can change behavior. A low-risk, high-confidence action may execute for a longer segment. An uncertain action can use a shorter segment and observe again. A possible collision can veto an action even when expected progress is high. The same uncertainty can trigger active data collection, giving it an operational role beyond an appendix plot.

### 12.7 Moving understanding evaluation toward state change

Visual benchmarks are strong at asking what appears in a frame. They cover state transition less thoroughly. Naming a cup and a hand does not establish when the grip becomes secure. Labeling an activity as cutting does not locate the order of contact among knife, food, and board. A future benchmark can record object state, relation state, and event boundary, then ask for the condition and result of a change.

Such annotation need not be entirely manual. Tracking, segmentation, and depth can propose trajectories. Rules can find candidate contact or occlusion. People can review uncertain segments. Synthetic supervision expands coverage, sensors anchor scale, and humans resolve semantic boundaries. Evaluation teachers should be isolated from training teachers so the same model does not write and grade the exam.

State-change records connect tasks. Video questions can ask why a transition occurred. Correspondence can track the same part through it. Planning can request a target relation state. Shared records make scores explain one another. If event recognition works while object tracking fails, persistence may be missing. If open-loop prediction works and planning fails, the cost function or action interface becomes a stronger suspect.

## Chapter 13　A complete study beginning with kitchen video

The previous principles become clearer in a concrete project. Consider learning object state and action consequences from kitchen video, followed by transfer to tabletop manipulation. Tasks remain intentionally simple. A robot moves a cup to a tray, opens a box lid, or places a towel in a basket. Simple tasks are easier to measure and make background shortcuts easier to expose.

### 13.1 Three layers of data

The first layer contains abundant video without action labels. It spans kitchens, viewpoints, lighting, and human manipulation. Its role is to teach appearance, occlusion, and event order. Basic cleaning is enough. One model can use VideoMAE-style tube reconstruction and another can use V-JEPA 2-style latent prediction. They should share encoder scale and data budget.

The second layer is smaller and geometrically grounded. A controlled scene uses a depth camera to record three-dimensional positions of cups, boxes, trays, and hands. Detection and segmentation teachers propose annotations, and people correct important frames. The records generate questions about direction, distance, containment, and contact. Every question keeps depth values, masks, and its calculation, making the SpatialVLM-style supervision auditable.

The third layer is action-conditioned robot data. From similar initial states, an arm varies direction, magnitude, and gripper state. Failures stay in the set. Cameras, proprioception, force, and contact are recorded before and after actions. This layer can be far smaller than the unlabelled video. Its purpose is to connect visual change with controllable action.

Dataset partitions must separate whole kitchens, object instances, and robot layouts. Adjacent clips cannot be split across training and evaluation. Visually similar background footage should be deduplicated with metadata and image fingerprints. A transfer claim needs evidence that the exact room was held out, since a different filename proves very little.

### 13.2 Pretraining objectives under an equal budget

Four encoders provide a useful comparison. The first uses supervised video classification. The second reconstructs pixels under tube masking. The third predicts future latent representations. The fourth combines masked and future prediction. They receive the same backbone, clip length, optimization steps, and approximately matched compute.

The joint-loss weight should not be chosen only by the best downstream test score. Validation can plot both pretraining losses, feature variance, and several frozen readouts across weights. If future prediction harms correspondence as its weight rises, the representation may have discarded spatial detail. If reconstruction dominates without improving anticipation, pixels may be consuming capacity. A weight is selected before opening the test set.

Mask strategy needs its own ablation. Independent frame masks, spatial blocks, and temporal tubes can use the same visible ratio. Copying from an adjacent frame should appear as an explicit baseline. A model that barely beats copying has weak evidence of temporal structure, regardless of its absolute reconstruction score.

### 13.3 Five frozen readouts

The first readout classifies objects with a linear layer over pooled features. The second measures dense correspondence at three fixed network layers, tracking keypoints across pose change. The third trains a small sequence decoder for spatial relations verified by the three-dimensional record. The fourth anticipates the next action event from preceding video. The fifth detects physical contact between gripper and object.

Together they cover semantics, geometry, time, and physical interaction. An objective that improves classification alone supports a narrow semantic claim. An objective that improves correspondence and contact while leaving names unchanged may emphasize geometry. Separate scores should keep those differences visible.

Probe budgets need control. A linear probe receives fixed training epochs and a fixed regularization range. A small decoder has the same layers and parameters for every encoder. Training examples are identical. Random features, ImageNet-supervised features, and current-frame-only features provide references for the incremental value of generative video learning.

### 13.4 Testing one readout and two visual entrances

Structured outputs can follow Pix2Seq. Object boxes, categories, contact states, and target relations become token sequences. A shared decoder handles detection, questions, and future events, with a task token marking the grammar. The experiment then measures whether a common readout helps a low-resource contact task.

The visual entrance has two settings. Full sharing sends understanding and future generation through one encoder. A decoupled setting keeps a shared temporal backbone while giving understanding a robust semantic entrance and generation a detail-preserving patch entrance. Total parameters remain close. A gain limited to pixel reconstruction does not justify the added complexity. A regression in geometric readout under full sharing would provide evidence for separation.

The output sequence should randomize irrelevant object order and vary coordinate resolution. Format errors should be reported separately. A model may identify the scene correctly and omit an end token, causing parsing to fail. Separating grammar validity from task accuracy locates the problem in the interface or in visual evidence.

### 13.5 Two audits for synthetic spatial supervision

An automatic pipeline extracts object tracks and approximate depth from unlabelled video, creating many qualitative questions. Sensor data calibrates scale and supplies quantitative questions. Model teachers can label the training split. People verify critical relations in validation and test using depth records. The sources remain explicitly separate.

The first audit occurs before student training. Stratified samples cover object size, occlusion, material, distance, and relation type. The second audit begins after training. High-confidence student mistakes are traced back through teacher output and geometric rules. Teacher error calls for data or rule repair. A correct teacher with a wrong student points toward representation or readout.

Growth of synthetic data is constrained by audit error. When one relation type passes a chosen error threshold, expansion pauses until its teacher or filter improves. Two billion questions are useful only when unit supervision quality is under control. Scale supplies coverage, and the audit determines whether that coverage is usable.

### 13.6 Let real action judge the world model

An action-conditioned predictor freezes the visual encoder. Current representation, robot state, and candidate actions produce a distribution over future representations. The planner searches for an action sequence that approaches a goal state while satisfying collision constraints. It executes a short segment, observes, and records the gap between prediction and reality.

Evaluation has three stages. Offline replay measures error and calibration across horizons. A simulator or safety enclosure probes action outside the main distribution and checks failure detection. Real tabletop experiments finally report task success, failed contact, collision, path length, and the number of replans.

Each stage has simple baselines. Offline prediction compares with current-frame copying and an action-free model. Execution compares with visual servoing based only on a goal image. Real tasks compare with behavior cloning and random-shooting planning. A world model that cannot beat these controls consistently needs better representation or action data before its success is attributed to predictive understanding.

Action shuffling is among the most useful negative controls. Video and state remain fixed while action sequences are exchanged. Little change in prediction or planning shows reliance on visual momentum. Occluding the gripper or object can test the use of contact evidence. Specific controls give weight to a claim about action consequences.

### 13.7 Reporting the evidence chain

The main results should follow the evidence chain. First show whether pretraining yields stable features. Then show spatial and temporal readouts. Follow with action-conditioned prediction, and finish with closed-loop control. Each level should include successes, failures, and whether an advantage survives the transition to the next level.

| Report section | Main result | Required comparison | Question answered |
| --- | --- | --- | --- |
| Pretraining | Reconstruction or latent-prediction curves and compute | Copying, random features, and supervision | Does the objective use unlabelled video effectively |
| Representation | Category, correspondence, relation, and contact | Fixed probe budget and layer curves | Which information entered the representation |
| Synthetic supervision | Stratified teacher error and student gain | Gold labels and a no-synthetic version | Does scale improve real generalization |
| Dynamics | Multi-horizon error, action sensitivity, and calibration | Zero action and shuffled actions | Does the model predict action consequences |
| Control | Success, safety, path, and recovery | Visual servoing, cloning, and model-free search | Does prediction improve decisions |
| Transfer | Drop under new kitchens, objects, and layouts | In-domain results and low-data adaptation | Do regularities survive background and embodiment |

A summary table can remain, though it should not hide conditions. Average success might come entirely from reaching while grasp contact stays unchanged. Average spatial accuracy may be dominated by left and right questions while metric distance remains poor. Disaggregated results tell later work whether data, objective, readout, or planning needs attention.

This project spans objective design, data construction, internal readout, future prediction, and action-based verification. Every segment can fail independently and can leave an inspectable intermediate result. The evidence chain is the research contribution.

## Conclusion

The connection between generation and understanding becomes concrete along the path from iGPT to V-JEPA 2. Pixel prediction showed that label-free distribution modeling could form semantically useful features. Masked reconstruction used information bottlenecks for efficiency. Pix2Seq joined structured tasks to sequence readout. SpatialVLM organized traceable spatial supervision. DIFT and Diffusion Classifier read correspondence and conditional compatibility from denoisers. Emu3 and Janus explored different sharing boundaries. V-JEPA 2 moved prediction to future representation and brought the result into contact with observation after action.

These studies do not yield one universal recipe. They change the question. Generation can be a task that forces a model to compress regularity, an interface that writes structure, a factory for broad supervision, a source of internal features, and a hypothesis about a future that reality can reject.

I would prioritize systems that preserve intermediate evidence. Mask locations remain known. Readout layers are fixed. Synthetic labels trace back to sensor records. Action conditions can be shuffled. A future prediction is compared with the next observation. Such a system may produce fewer spectacular demonstrations, though it can say much more clearly what the model learned and where an error entered.

Understanding also need not be treated as one mysterious score. It can be decomposed into object persistence, stable spatial relation, state change under action, calibrated uncertainty, and support for a new readout. The generative objective presses these regularities into a model. Experimental design takes them out one at a time.

The decisive evidence comes after generation. Can a limited readout use the representation. Can a synthetic label be traced to measurement. Does an internal feature survive a domain change. Does a future prediction meet the world after intervention. Once those checks are connected, generation becomes a disciplined way to study understanding.
