---
title: "From Video Compression to Codec-Native Multimodal Models"
description: "An English reader's map to the full Chinese audit of video codecs, OneVision-Encoder, codec-video-prep, LLaVA-OneVision-2, and Mage-VL."
pubDate: 2026-08-18
updatedDate: 2026-08-19
readingTime: "12 min"
tags: ["Codec-Native", "Video Understanding", "Multimodal"]
lang: "en"
translationKey: "codec-native-video"
tocDepth: "chapters"
featured: true
draft: false
sources:
  - label: "HEVC overview paper"
    url: "https://doi.org/10.1109/TCSVT.2012.2221191"
  - label: "OneVision-Encoder paper"
    url: "https://arxiv.org/abs/2602.08683"
  - label: "OneVision-Encoder official repository"
    url: "https://github.com/EvolvingLMMs-Lab/OneVision-Encoder"
  - label: "codec-video-prep official repository"
    url: "https://github.com/YunyaoYan/codec-video-prep"
  - label: "LLaVA-OneVision-2 paper"
    url: "https://arxiv.org/abs/2605.25979"
  - label: "LLaVA-OneVision-2 official repository"
    url: "https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-2"
  - label: "Mage-VL paper"
    url: "https://arxiv.org/abs/2607.24904"
  - label: "Mage official repository"
    url: "https://github.com/microsoft/Mage"
---

This page is an English reader's map to the full Chinese technical audit. The Chinese version is the authoritative long form, with nine original diagrams, implementation paths, tensor shapes, release differences, and reproduction notes. You can [open the complete Chinese article](/blog/codec-native-video/) at any time.

## The question behind codec-native video

A conventional long-video pipeline samples complete RGB frames and sends every retained frame through a dense visual encoder. This is simple, but it repeatedly processes backgrounds, static objects, and textures that barely changed. A video codec has already spent decades learning how to avoid describing those repetitions. It predicts blocks from the same frame or reference frames, records motion, transforms the remaining residual, quantizes it, and entropy-codes the result.

Codec-native models ask whether some of that structure can guide visual tokenization. A codec signal does not directly tell us what matters to a user question. It does expose where prediction became difficult, where motion occurred, and how coded cost was distributed. Those cues can reduce redundant visual computation before a language model receives its first visual token.

The central engineering challenge is therefore larger than extracting motion vectors. A usable system must align codec blocks with visual patches, preserve time and source coordinates after sparse packing, define grouping semantics, train a visual encoder on irregular input, and keep the public preprocessing code consistent with the model release.

## What a compressed stream can reveal

Packet size gives a coarse signal of temporal coding effort. Motion vectors describe block displacement under the encoder's chosen reference structure. Residual energy records how much prediction failed. Bit cost combines several coding decisions, although its precise meaning depends on the encoder and extraction path.

These quantities live on codec grids rather than a model's patch grid. Their timestamps may follow decoding order while a model expects display order. B frames can depend on references on both sides. A keyframe is expensive because it must stand alone, yet it is not automatically the most useful answer to a semantic query. Every codec-native pipeline has to resolve these mismatches explicitly.

The strongest interpretation is modest. Codec features provide a task-agnostic proposal for where visual novelty or coding difficulty sits. They do not replace query relevance, event coverage, or a model's learned semantics.

## OneVision-Encoder turns sparsity into a visual input form

OneVision-Encoder trains a shared visual backbone to accept ordinary images, dense videos, and codec-guided sparse video input. Sparse patches cannot simply be concatenated and treated as if they came from a compact rectangle. Their original space-time coordinates matter. The design therefore couples visible indices with positional handling so the encoder can recover where a retained patch came from.

The paper describes HEVC-guided selection and a unified encoder. The released repository also reveals a broader asset pipeline. Precomputed visibility records, DALI loading, tensor reshaping, and the LLaVA integration path all become part of the actual method. The release is useful, but paper concepts and executable paths are not perfectly identical. Reproduction has to pin both the paper claim and the code commit.

## codec-video-prep builds the sparse payload

The preprocessing project probes video metadata, samples candidate frames, obtains RGB content and codec-derived scores, masks unusable regions, groups candidates, selects high-scoring patches, and packs them into fixed canvases. The output also needs provenance. A packed patch is only useful if the downstream model can recover its original frame, time, and location.

The repository contains more than one processing route. Configuration defaults, a native extension, and a patched FFmpeg path determine which signals are available. Grouping names can also hide different meanings. An encoded GOP, a logical group used by a model, and a readiness group used by a decoding pipeline should not be treated as interchangeable.

This layer often decides whether a paper result can be reproduced. A visual model can be correct while its input assets are subtly misordered, scaled to a different grid, or packed under another grouping policy.

## LLaVA-OneVision-2 connects sparse vision to a general MLLM

LLaVA-OneVision-2 pushes the codec front end into a general multimodal system. Its paper introduces an adaptive logical grouping policy, spatial selection, temporal quota allocation, a shared visual encoder, and group-aware processing. The official release distributes the relevant behavior across preprocessing, model configuration, the visual tower, and inference code.

Two paths must be kept separate during an audit. The ordinary frame path handles the familiar dense input. The codec path consumes a sparse payload with canvas layouts, padding, and timestamp information. Training assets may be prepared offline, while the public inference path performs a different set of online steps. A result obtained through one route does not automatically validate the other.

Canvas merging is particularly easy to underestimate. If patches from several frames share a canvas, the model needs exact source coordinates and unambiguous boundaries. A small packing fix can change positional meaning without changing the apparent image tensor shape.

## Mage-VL extends the idea toward streaming interaction

Mage-ViT and Mage-VL broaden codec-native vision across traditional and neural codecs and place it inside a streaming multimodal design. The public implementation exposes a traditional-codec entry, a DCVC-RT scoring route, an integrated visual tower, a merger that also serves as a projector, and a gate controlling downstream interaction.

The paper and code again need to be read together. A paper description may discuss motion and residual information, while a particular release path uses bit cost as the practical score. The neural-codec route can replace the scoring source without automatically changing every later stage. Cross-codec support therefore means a shared downstream contract, not that every codec produces an identical signal.

The released streaming demo is an important artifact, but it should not be mistaken for a fully incremental system in every layer. A demo can accept a continuing stream while still recomputing or buffering more history than a strict online deployment would allow.

## The five-layer system

The full path is easiest to reason about as five layers.

| Layer | Main object | Failure to watch |
| --- | --- | --- |
| Codec | prediction, motion, residual, coded cost | confusing coding difficulty with semantic relevance |
| Extraction | timestamps, block scores, candidate frames | display and decoding order drift |
| Packing | sparse patches, canvases, source indices | losing original coordinates or group boundaries |
| Visual encoder | irregular visual tokens and positions | treating sparse input as a dense rectangle |
| Multimodal model | prompts, memory, answers, interaction | claiming end-to-end streaming when earlier stages still recompute |

A video becomes an answer only after every layer agrees on time, geometry, and provenance. Compute savings can appear in decoding, visual encoding, token count, or language-model context. A paper reporting one kind of saving should not be read as evidence for all four.

## Current limits

Most current selectors remain query-agnostic. Fixed top-k rules and hand-tuned thresholds can over-select a brief high-score region while missing long-range coverage. Cross-codec scores lack a universal calibration. Audio rarely participates in event gating. Transfers between decoder memory, CPU arrays, and GPU tensors can erase part of the theoretical gain.

Uncertainty is also underdeveloped. A system should know when sparse codec cues are insufficient and fall back to denser observation. Without such a mechanism, an efficient path can fail silently. Release drift compounds the problem because papers, repositories, preprocessing assets, and demos do not always describe exactly the same pipeline revision.

## How I would evaluate a codec-native release

I would begin with alignment rather than benchmark accuracy. Decode a short clip with known frame order, inspect timestamps, visualize score maps on their true block grid, and trace several selected patches through packing into the visual encoder. Next, compare the dense and sparse paths under the same prompt, resolution policy, and visual-token budget. Only then does an end-task score become interpretable.

The decisive question is not whether a codec signal correlates with motion. It is whether the complete system preserves the evidence a task needs while reducing a clearly measured cost. That claim requires the codec, preprocessing, packing, encoder, and multimodal model to be audited as one chain.

For source-level details, exact repository entry points, nine diagrams, and a reproduction checklist, continue with the [full Chinese audit](/blog/codec-native-video/).
