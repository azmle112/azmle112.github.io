---
title: "Understanding a world while the video is still running"
description: "A close reading of streaming video evaluation, incremental inference, persistent state, and thinking during observation, with a focus on evidence, compute budgets, and questions the system has not seen yet."
pubDate: 2026-08-27
readingTime: "50 min"
tags: ["Streaming Video", "Multimodal Models", "Continuous Visual Intelligence"]
lang: "en"
translationKey: "streaming-video-intelligence"
tocDepth: "chapters"
featured: true
draft: false
---

The camera is still recording. The meeting continues, and the driving scene keeps changing. What a model sees now belongs to a world that is still unfolding. It does not know what someone will ask a few minutes later, or whether the next second will contain something worth reporting.

I initially understood streaming video in a straightforward way: divide a video into chunks and process each chunk as it arrives. Reading more papers, then following their public implementations, made that explanation difficult to sustain. Chunking specifies how inputs are grouped. Whether a model can see the future, reuse earlier computation, carry state across time, or keep pace with playback are separate questions. They often appear together, under the same word, "streaming."

The question I now find more useful is this:

> When observations have no known endpoint and future questions are unavailable, how can a model preserve enough evidence for answers, predictions, and actions within finite memory, computation per second, and response time?

I use continuous visual intelligence to describe this goal. Current streaming video MLLMs are still some distance from it, but their work has made several previously entangled problems measurable.

## Before the video ends

Video understanding usually starts with a file. An `mp4` sits on disk, its duration is recorded in the container, and the evaluator knows where it ends. The model samples frames and answers questions. Film analysis, lecture summarization, surgical video analysis, and retrieval from long surveillance recordings all fit this setting. Long contexts, hierarchical retrieval, visual token compression, and long-video reasoning have developed around it.

The basic order is to obtain the complete video, then process a question.

<div class="equation" role="math" aria-label="Complete video, followed by a question and an answer"><span>V<sub>1…T</sub> → Q → A</span></div>

Even if an implementation samples only a few frames or retrieves evidence before answering, it can in principle return to any part of the video. A restricted view usually reflects a limited budget; the underlying events have already happened. The video behaves like a long multimodal document, or a completed record that can be inspected repeatedly.

A continuing stream changes that boundary. Its input sequence keeps growing.

<div class="equation" role="math" aria-label="A continuing sequence of observations"><span>x<sub>1</sub>, x<sub>2</sub>, …, x<sub>t</sub>, …</span></div>

Each new segment must be combined with the state left by earlier observations.

<div class="equation" role="math" aria-label="Streaming state update"><span>S<sub>t</sub> = f(S<sub>t−1</sub>, x<sub>t</sub>)</span></div>

A question may arrive at any moment. The answer can depend only on the state available then.

<div class="equation" role="math" aria-label="An answer generated from the current state and question"><span>A<sub>t</sub> = g(S<sub>t</sub>, Q<sub>t</sub>)</span></div>

For notifications, predictions, or actions, an explicit question need not precede every output.

<div class="equation" role="math" aria-label="A proactive output generated from the current state"><span>A<sub>t</sub> = g(S<sub>t</sub>)</span></div>

<figure><a href="/images/blog/streaming-video-intelligence/fig01-video-document-vs-process.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/streaming-video-intelligence/fig01-video-document-vs-process.svg" alt="A completed video and an unfolding observation process impose different assumptions on computation" loading="lazy" decoding="async" /></a><figcaption>Figure 1. A completed video permits global inspection; an unfolding process depends on the state already available. Open the image for its full resolution.</figcaption></figure>

Duration does not separate these settings. A ten-second security stream may demand strictly causal responses, while a three-hour film can still be analyzed offline after it ends. What matters is whether the endpoint is known, whether future content is accessible, whether historical computation may be repeated, when questions arrive, and how long the model process must remain alive.

Neither setting is inherently more valuable. Access to the complete video suits structural analysis, precise retrieval, and repeated verification. Many medical, film, educational, and forensic tasks can afford to wait. Streaming research takes on a different set of constraints: the events are still happening.

## Four meanings of streaming

The papers use the same label for constraints at several levels. Separating evaluation protocols, inference, state architecture, and deployment makes their contributions easier to assess.

The first level concerns data and evaluation. Is the question timestamp supplied? Are future frames excluded? How is later evidence released? OVO-Bench and StreamingBench made these temporal conditions reproducible.

<div class="equation" role="math" aria-label="Only observations that have arrived by time t are visible"><span>O<sub>t</sub> = V<sub>0…t</sub>,　V<sub>t+1…T</sub> ∉ O<sub>t</sub></span></div>

The second level concerns inference. When another chunk arrives, does the model recompute the whole history, recompute a recent window, or encode only the new content? This determines how much visual encoding, prefill, and attention work it repeats.

The third concerns architecture and state. The system may retain KV, visual memory, event memory, text summaries, or a recurrent latent state. Does that state grow indefinitely? Can it be evicted, merged, or corrected?

The fourth concerns deployment. Does the process remain resident? Do inputs arrive in real time? Can observation continue while the model answers? What happens when computation falls behind, and how is state managed after hours or days?

Success at one level does not establish success at the next.

<div class="equation" role="math" aria-label="Causal evaluation does not imply incremental inference, persistent state, or a real-time system"><span>Causal evaluation ⇏ Incremental inference ⇏ Persistent state ⇏ Real-time system</span></div>

An evaluator can rigorously exclude future frames while permitting every question to re-encode the full history. A model can retain KV while replaying a file prefix as quickly as possible, without handling the arrival of the next camera frame. Evaluation, model architecture, and systems behavior are related, but evidence at one level cannot establish the other two.

### Which temporal relationships does OVO-Bench control?

[OVO-Bench](https://arxiv.org/abs/2501.05510) divides online understanding into Backward Tracing, Real-Time Visual Perception, and Forward Active Responding. The first two require historical or current evidence available before a question. Forward tasks provide the question first, release later clues, and ask when the evidence is sufficient for an answer. This extends evaluation beyond retrospective retrieval to the timing of a response.

The official generic evaluator follows a particular procedure. Backward and Real-Time tasks load pretrimmed `id.mp4` files; Forward probes load `id_i.mp4` at different times. The trimming script intends to construct causal prefixes from zero to `ceil(t)`, after which each annotation receives a separate inference call. Forward tasks also rerun the model at predefined probe times. The model does not autonomously wait and update within one continuing session.

Several implementation details limit what this establishes. The current trimming script skips non-Forward tasks before reaching its Backward and Real-Time branches, leaving those branches unreachable. The official instructions recommend downloading pretrimmed clips. The paper results may well use these released files, but the current script alone cannot reconstruct the complete benchmark from the source videos. Also, `ceil(t)` rounds fractional timestamps up to the next second. This establishes second-level discretization of the cutoff; it does not by itself prove that the released data exposes future evidence.

Sample counts differ between paper versions, current documentation, and released annotations. Dataset size and average question time therefore need a version attached. The current [lmms-eval](https://github.com/EvolvingLMMs-Lab/lmms-eval) integration still reads the pretrimmed clips. Forward uses a multi-round interface, but the ordinary Qwen2-VL adapter rereads the full prefix, runs the visual processor, and calls `model.generate` on each round. Decoding an individual answer uses a cache; visual state does not persist across probe times. A multi-round evaluation interface alone cannot establish that model state survives across rounds.

### How StreamingBench turns a stream into offline inputs

[StreamingBench](https://arxiv.org/abs/2411.03628) covers real-time visual understanding, multisource understanding, contextual understanding, and proactive output. The paper explicitly acknowledges that most models available at the time could not consume a true stream. Except for proactive output, it turns each question into a clip from the start of the video to the question timestamp, then sends that clip to an ordinary offline model.

<div class="equation" role="math" aria-label="StreamingBench prefix evaluation"><span>V<sub>0…t<sub>q</sub></sub> → Trimmed video → One model run</span></div>

The code later added `context_time`: `-1` selects the full prefix, while `60` selects the latest sixty seconds. The initial paper primarily used full prefixes, with sixty-second windows as a supplement. Current documentation presents the sixty-second window as the main protocol. Comparing scores without their versions can therefore conflate two input conditions.

Sequential QA has a further distinction. Every new question triggers another video crop and model call. The prompt includes earlier timestamps, questions, choices, and ground-truth answers. This evaluates contextual QA with an oracle interaction history. It does not test whether the model preserves its own visual state, and errors in one answer do not propagate into the next.

Proactive output uses polling to simulate response timing. Starting at an annotated point, the model processes a growing local segment once per second and is explicitly asked whether it should respond now. Responses count as correct only near the reference time. This is closer to a continuing environment than fixed-time QA, but the evaluator still knows the neighborhood in which to check, and every poll reruns inference. It measures response decisions around an annotated time anchor; freely running notifications require more.

These limits do not diminish what the benchmarks made possible. They turned causal QA, misleading history, forward waiting, multimodal interaction, and response timing into shared tasks, giving later state architectures common evaluation targets. Neither benchmark claimed to impose a unified FLOPs-per-second limit, require cross-question KV reuse, or maintain a resident service. Those additional goals should not be used to dismiss their actual contributions.

<figure><a href="/images/blog/streaming-video-intelligence/fig02-information-vs-computation.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/streaming-video-intelligence/fig02-information-vs-computation.svg" alt="Information streaming limits access to the future; computational streaming concerns reuse of historical computation" loading="lazy" decoding="async" /></a><figcaption>Figure 2. Causal access to information and incremental reuse of computation are separate questions. Open the image for its full resolution.</figcaption></figure>

## How much of the past must be computed again?

A model can observe only `V_0…t`, fully satisfying the information constraint, while sending the entire prefix through its vision tower and language model every time a question arrives. Nothing leaks from the future, yet the same work repeats.

For questions arriving at `t₁, t₂, …, tₙ`, the total processing volume of prefix recomputation is approximately

<div class="equation" role="math" aria-label="Accumulated cost of full-prefix recomputation"><span>C<sub>prefix</sub> ∝ ∑<sub>i=1…n</sub> t<sub>i</sub></span></div>

At a fixed probing frequency, the question count increases with video duration, so repeated processing can grow quadratically. Sampling a fixed number of frames makes a longer prefix increasingly sparse; sampling at a fixed frame rate continually adds visual tokens. Their accuracy, FLOPs, and modes of forgetting differ substantially, even when both receive a causal evaluation score.

Computational streaming asks how much historical work must be repeated when new content arrives. The common choices are these.

| Inference strategy | Input at the next time step | Treatment of earlier computation | State growth | Main cost |
| --- | --- | --- | --- | --- |
| Full-prefix recomputation | All video from the beginning to now | No reuse | Input keeps growing | Repeated visual encoding and prefill |
| Sliding-window recomputation | A fixed recent window | No reuse | Bounded | Evidence outside the window disappears |
| Chunked updates | The new chunk | Partial reuse | Depends on memory | Cross-chunk state needs an explicit definition |
| Persistent KV | New tokens or a new chunk | Extensive reuse | Requires eviction | Position handling, eviction, and cache semantics interact |
| External memory | New content and retrieved state | Visual processing can be incremental | May be bounded or keep growing | Writing, retrieval, and compression introduce errors |
| Periodic or event-triggered processing | Selected time steps | Adaptive | Controllable | A gate may miss rare but decisive events |

Sliding windows are often undervalued. They do not reuse visual encoding across questions, so they fall short of the strongest definition of incremental inference. They do, however, impose a clear computational bound. Processing only the latest `w` frames or seconds prevents input size from expanding with total duration. This difference matters more in practice than placing both a sliding window and a full prefix under the same causal-evaluation label.

<figure><a href="/images/blog/streaming-video-intelligence/fig03-inference-strategies.svg" target="_blank" rel="noopener noreferrer"><img src="/images/blog/streaming-video-intelligence/fig03-inference-strategies.svg" alt="Full-prefix recomputation, sliding windows, and incremental state produce different cumulative compute costs" loading="lazy" decoding="async" /></a><figcaption>Figure 3. Three causal inference strategies have different cumulative computation growth. Open the image for its full resolution.</figcaption></figure>

### A simple baseline that is hard to ignore

[SimpleStream](https://arxiv.org/abs/2604.02317) deliberately reduces the strategy to its simplest form. When a question arrives, it feeds an off-the-shelf VLM the latest `N` frames, sampled at one frame per second, and discards everything outside that window. The paper reports 67.7% average accuracy on OVO-Bench and 80.59% on StreamingBench for the four-frame version. Larger windows do not bring consistent gains; the best `N` depends on the backbone and task.

What I find most useful here is what the result reveals about the evaluation. It does not settle whether memory is valuable. If most questions depend on the last few seconds, a strong visual backbone with clean recent evidence should perform well. Longer history may help memory tasks such as EPM and ASI while introducing irrelevant images into current perception. The paper's Visual-RAG experiments improve some memory tracks but hurt hallucination detection and immediate perception. A reanalysis of StreamForest likewise finds memory gains alongside perception losses.

Several explanations remain compatible with a strong four-frame baseline. Long-distance dependencies may be uncommon in the benchmark. Historical evidence may exist but be sparse. Compression and retrieval errors in complex memory systems may cancel out the information they add. Distinguishing these explanations requires evidence-distance statistics, task-level breakdowns, and matched compute budgets. A winning window baseline establishes an outcome before it establishes its cause.

[StreamOPD](https://arxiv.org/abs/2608.16320) provides a training-side comparison. It fixes inference at one frame per second and the latest four frames, without memory, retrieval, or online thinking modules, and studies post-training and teacher distillation. The paper reports that OPD raises StreamingBench from 77.87 to 83.91, with ST-CueGate reaching 84.55. Some OVO tracks labeled backward also improve, although history outside the window never reaches the model. Certain memory labels therefore mix local cues, model priors, and output policies. These results demonstrate a training contribution; they cannot be attributed to a long-term state architecture.

### What persistent KV actually reuses

[StreamingVLM](https://arxiv.org/abs/2510.09608) offers a relatively clear example of computational streaming. Its official inference path retains each layer's `past_key_values` between one-second chunks, so old video no longer passes repeatedly through the vision tower. The state roughly consists of early text, recent text, and the latest sixteen seconds of visual content. Visual K/V is physically deleted when it leaves the window, and some old text is evicted as well. Each new chunk incurs visual encoding and new-token projection once.

Calling this "zero historical recomputation" would overstate it. Qwen2.5-VL uses 3D mRoPE. After eviction, the official `shrink` mode rebuilds contiguous positions for the active cache, reapplies rotary transformations to retained keys, and computes current attention. It reuses the earlier vision-tower, MLP, and Q/K/V projection work. Position repair and attention over the active window still cost computation.

The paper diagram's 512 sink-text tokens, 512 recent-text tokens, and sixteen seconds of vision summarize a policy. The actual cache also contains role delimiters, timestamps, model commentary, and the current request from recent turns. Earlier visual K/V disappears. Whether distant information survives depends heavily on whether the model mentioned it in commentary at the time and whether that text was later evicted. The system demonstrates controlled ongoing computation and a controlled main KV cache; this does not automatically provide long-term visual memory suitable for unknown future questions.

The paper reports up to 8 FPS on one H100, around 0.05 seconds per token, and evaluation on Inf-Streams-Eval videos averaging 2.12 hours. Its supplementary demo consists of edited excerpts after one hundred minutes of continuous operation. It should not be described as an unedited two-hour demonstration. Training uses Qwen2.5-VL-7B and approximately 128 H100-days. These numbers describe the resource cost, while keeping demos, evaluations, and sustained deployment distinct.

### The computational principles inherited from StreamingLLM

The original [StreamingLLM](https://arxiv.org/abs/2309.17453) addresses continuous text generation. It retains a few initial attention sinks and recent K/V, discards the middle history, and uses cache-relative positions to stabilize decoding. The paper demonstrates generation beyond four million tokens and reports up to 22.2 times the speed of sliding-window recomputation.

The official explanation is explicit about its limits. The method does not enlarge the semantic context or improve long-term memory. Once a distant passkey leaves the cache, it cannot be recovered. For video systems, its useful inheritance is persistent KV with selective eviction and position repair. A visual stream adds visual encoding costs, asymmetric treatment of vision and text, 3D positions, and the consequences of writing model outputs back into the state.

### ViCoStream and pipeline scheduling

[ViCoStream](https://arxiv.org/abs/2606.19849) divides each chunk into visual preprocessing, ViT encoding, token dropping, and LLM prefill. If different chunks overlap across these four stages, the slowest stage determines steady-state throughput.

<div class="equation" role="math" aria-label="Throughput bound for a four-stage pipeline"><span>T<sub>pipe</sub> = max(T<sub>vp</sub>, T<sub>vit</sub>, T<sub>drop</sub>, T<sub>llm</sub>)</span><span>FPS<sub>max</sub> = 1000c ÷ T<sub>pipe</sub></span></div>

The paper's maximum of 134 FPS on a single A100 comes from this ideal pipeline formula. With sixteen frames per chunk and 30% of tokens retained, the four stages take approximately 113, 119, 44, and 42 milliseconds. The slowest, ViT, yields about 134 FPS. Adding all four stages sequentially would give a different end-to-end throughput.

The public code confirms chunked persistent KV, token dropping, recent-chunk attention, and retrieval at query time. The visible execution path is still a sequential Python loop; a scheduler using four overlapping CUDA streams has not been released. The code first appends new K/V to `DynamicCache`, then restricts current attention to recent K/V. I did not find deletion of old KV. Attended history can therefore remain fixed while the stored cache keeps growing. Bounded attention alone does not bound total computation and storage.

## State is what survives into the next second

At this point, memory, cache, compression, and thinking become difficult to treat as independent components. New images keep arriving, and the system must decide how the past will survive. These approaches meet at the same state-construction problem.

<div class="equation" role="math" aria-label="Video through time t is mapped to state at time t">
  <span>V<sub>0…t</sub> → S<sub>t</sub></span>
</div>

If the video can continue indefinitely, the state also needs a capacity limit.

<div class="equation" role="math" aria-label="State size at time t is bounded by a constant C">
  <span>|S<sub>t</sub>| ≤ C</span>
</div>

Recent raw frames preserve detail but cover little time. Visual embeddings or tokens can avoid repeated decoding, although their storage may still grow linearly. A KV cache reuses Transformer computation; the semantics it retains depend on training and eviction. Event memory organizes time into events but may discard background details. Text summaries are compact and easy to retrieve, at the cost of colors, positions, and anything never expressed in words. Latent state offers flexible capacity but is difficult to inspect when it fails. A hybrid combines these representations in layers, with more complicated updates, retrieval, and consistency management.

<figure>
  <a href="/images/blog/streaming-video-intelligence/fig04-state-taxonomy.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig04-state-taxonomy.svg" alt="Different representations of streaming state" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 4. Streaming state can use several kinds of representation. Open the image for its full resolution.</figcaption>
</figure>

Sufficient statistics provide a useful way to think about this. An ideal S<sub>t</sub> retains what future tasks need and discards irrelevant redundancy. But the query has not arrived, and the task distribution may change. Strict statistical sufficiency is difficult to obtain in an open world. A more practical aim is to retain enough information for a family of tasks, then test robustness on unseen questions.

The information bottleneck is another useful interpretation of state compression, provided it is not presented as an objective the papers already optimize. Most current methods do not explicitly train the classical information-bottleneck objective. Here the concept describes a trade-off between compression and the loss of information needed later. Stronger compression makes bounded state easier to maintain, while increasing the chance that details needed by a future question are deleted in advance.

Viewed through state updates, several frequently conflated terms become easier to distinguish.

| Concept | Main purpose | Capability it does not automatically provide |
| --- | --- | --- |
| Cache | Reuse projections and decoding state | Distant semantic recall |
| Memory | Preserve or recover historical evidence | Incremental computation and real-time throughput |
| Compression | Limit token count and state size | Answerability of future questions |
| Thinking | Apply additional transformations to current state | Evidence of reasoning ability |
| Retrieval | Select evidence from history | Correct initial storage of that history |
| Forgetting | Free resources and remove stale state | Knowing what to forget and when |

Persistent KV may last a long time while long-term recall remains weak. An event-memory method may reconstruct the entire visual prefix for every query. Component names tell us what a system uses. State construction and update tell us what it actually carries into the next second.

## Long operation exposes the trade-offs

Short clips tolerate imprecise design choices. With enough model capacity, a little extra storage or another pass through the input may not noticeably hurt. As duration grows, state, computation, and response latency all need explicit bounds.

<div class="equation" role="math" aria-label="As time tends to infinity, working state, computation per unit video time, and response latency each have a constant upper bound">
  <span>t → ∞</span>
  <span>M(t) ≤ C<sub>m</sub></span>
  <span>C(t) / t ≤ C<sub>c</sub></span>
  <span>L<sub>t</sub> ≤ C<sub>l</sub></span>
</div>

Here M(t) is working state, C(t) / t is computation per unit of video time, and L<sub>t</sub> is response latency. Each bound exposes a different trade-off. Token compression may control GPU memory while computation per second remains excessive. KV reuse may keep pace with live input while the cache continues to grow. A recent window is the simplest way to bound both memory and computation, but evidence cannot be recovered once it leaves the window.

<figure>
  <a href="/images/blog/streaming-video-intelligence/fig07-long-horizon-bounds.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig07-long-horizon-bounds.svg" alt="Long operation imposes separate bounds on state, computation, and response latency" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 5. A long horizon imposes simultaneous bounds on state, computation, and latency. Open the image for its full resolution.</figcaption>
</figure>

An object seen an hour ago may acquire a different identity; later observations may overturn earlier interpretations. Participants can change appearance, position, or name. Object persistence must maintain continuity, belief revision must allow correction, and contradictions or stale memories must be detected. More tokens merely postpone these problems.

[StreamForest](https://arxiv.org/abs/2509.24871), [ObjectStream](https://arxiv.org/abs/2607.28312), [StreamFlow](https://arxiv.org/abs/2608.10949), and [LiveStarPro](https://arxiv.org/abs/2606.17798) can all be read as responses to this state problem. StreamForest organizes frames into a Persistent Event Memory Forest, merging with reference to temporal distance, content similarity, and merge frequency while retaining a fine-grained recent window. ObjectStream uses detector-free latent objects as memory anchors, records object histories, and places transient changes and recent context around them.

StreamFlow removes redundant content with a dynamics-aware mid-term filter before expensive visual encoding, then consolidates history into visual latents that can be injected on demand. LiveStarPro combines proactive response timing, causal-attention training, and tree-structured hierarchical memory.

These methods compress different units. Frame-level state favors detail; event-level state preserves temporal structure. Object-level state supports identity continuity, while latent memory delegates capacity allocation to end-to-end training. A future question may ask for exactly what a representation tends to discard, so no representation is intrinsically best.

SimpleStream is useful as a diagnostic stress test. If the latest four frames are already strong, first examine the distribution of evidence distances: how far away is genuinely necessary historical evidence, and how often does it appear? Then match the backbone, visual tokens, update FLOPs, and query-time computation before measuring the contribution of memory. Only after these controls do memory representations become comparable. A strong recent window can reveal evaluation and budget problems. Using it to conclude that long-term memory has no value skips the causal explanation.

## Writing thought into state while watching

Streaming thinking is often described as producing a chain of thought while watching video. For comparing systems, it is more useful to ask what state update each chunk triggers, when the computation happens, and how its result survives.

Conventional video QA usually defers reasoning until the query arrives.

<div class="equation" role="math" aria-label="Conventional video QA observes the video, then receives a question, reasons, and answers">
  <span>Observe<sup>×T</sup> → Q → Think → A</span>
</div>

Streaming thinking moves some of that work into playback.

<div class="equation" role="math" aria-label="Each new observation is followed by a state update or reasoning step">
  <span>x<sub>t</sub> → Update or Think<sub>t</sub> → x<sub>t+1</sub> → Update or Think<sub>t+1</sub></span>
</div>

After the query arrives, the system integrates information across chunks.

<div class="equation" role="math" aria-label="The final state and query undergo global reasoning to produce an answer">
  <span>(S<sub>T</sub>, Q) → Global Reasoning → A</span>
</div>

This changes when reasoning computation is paid for. A conventional system waits for both the video and the question, then incurs a concentrated reasoning delay. A streaming system uses elapsed playback time to interpret observations, draw local inferences, or compress memory. The remaining response delay may then be shorter. The computation has moved earlier; it has not disappeared.

<figure>
  <a href="/images/blog/streaming-video-intelligence/fig05-compute-redistribution.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig05-compute-redistribution.svg" alt="Reasoning during observation redistributes computation over time" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 6. Streaming thinking moves part of the reasoning from query time to stream time. Open the image for its full resolution.</figcaption>
</figure>

### VST rewrites visual input into recurrent text memory

[Video Streaming Thinking](https://arxiv.org/abs/2603.12262) has a clear abstraction. The current clip c<sup>k</sup> and preceding text memory m<sup>k−1</sup> generate a thought z<sup>k</sup>, which is then used to update memory.

<div class="equation" role="math" aria-label="VST generates a thought from the current clip and previous memory, then updates text memory">
  <span>z<sup>k</sup> ∼ p(z | c<sup>k</sup>, m<sup>k−1</sup>)</span>
  <span>m<sup>k</sup> = Update(m<sup>k−1</sup>, z<sup>k</sup>)</span>
</div>

At answer time, the model reads the accumulated text, the latest visual clip, and the query. The paper describes the visual and textual parts as short-term native video memory and long-term textual semantic memory. Visual content arrives chunk by chunk; older content becomes text carried into the next chunk. This is recurrent construction of state from vision to language.

The official OVO evaluator implements that abstraction with a specific sequence. It first samples the complete causal prefix at 2 fps, retaining at most 384 frames. Above this limit, sampling becomes uniform across the entire prefix. It then divides the video into two to five segments according to total prefix duration. The first N−1 segments produce thoughts sequentially, at most four times; the final segment accompanies the query into the answer stage. Each round receives only its current visual chunk, while text generated in earlier rounds is concatenated back into the prompt. There is no explicit transfer of `past_key_values` between rounds, so the accumulated text memory is prefilled again each time.

Replacing old vision with cheaper text brings this path closer to computational streaming than repeatedly processing the entire visual history. The session still does not persist across queries. For another timestamp in the same source video, the evaluator initializes text memory again. It also acquires the complete prefix file, samples it globally, and divides it into equal segments before chunkwise inference starts. Actual input-arrival pacing is outside this procedure.

The paper proposes FIFO to constrain long-term memory, but `max_keep_memory` defaults to 0 in the official OVO script. At most four intermediate thoughts are generated per evaluation sample. State does not explode over that limited range, but the FIFO policy is not exercised on an indefinite stream. VST's main StreamingBench paper result also uses a dedicated single-pass evaluator: it retains recently sampled frames, calls `generate` once, and does not run the intermediate-thought loop. The reported 79.5 supports the strength of a VST-trained checkpoint under that protocol. That number alone cannot attribute the gain to streaming thought.

The paper reports asynchronous background thoughts every 16 to 32 seconds, taking 7.0 seconds on average and 11.2 seconds at P99. If a query interrupts, the system uses the latest completed memory state. One case study reports final QA latency of 0.51 seconds, compared with 9.53 seconds for post-query CoT. The public benchmark evaluator contains neither a wall-clock scheduler nor an interruption handler. These latency figures are paper-reported results that the released evaluation scripts cannot currently reproduce independently.

The reported failure cases explain the cost of text state more clearly. Salient but irrelevant events can occupy memory, and excessive compression can remove a necessary span. Local thoughts may miss relationships across events. A mistaken thought can become a fact assumed by the next round. Textual thought serves as both a reasoning trace and lossy semantic memory; errors propagate through the same recurrence that carries useful information.

### ThinkStream keeps thought in the KV cache

[Thinking in Streaming Video](https://arxiv.org/abs/2603.12938) introduces ThinkStream and its Watch, Think, Speak loop. Each new chunk prompts a short reasoning update, followed by a decision to remain silent or respond. Reasoning-Compressed Streaming Memory retains recent visual K/V, evicts expired dense visual tokens, and keeps historical reasoning and response K/V as semantic anchors.

Where VST stores thought in external prompt memory, ThinkStream writes it into the model's cache state. A typical paper configuration retains a 20-second dense visual window and permits up to 20 reasoning tokens per second. Increasing the token budget from 0 to 20 raises OVO-Backward from 41.8 to 52.3, while step latency rises from 130 ms to 380 ms. At 30 tokens, the score reaches only 52.6 and latency rises to 505 ms. This ablation makes the cost of thought frequency and token budgets concrete. Both belong to the compute-allocation policy.

The paper also compares memory representations. The no-memory average is 56.9. Discrete caption memory falls to 48.7; cold-start CoT memory reaches 60.5; RLVR-optimized CoT memory reaches 64.8. These results support trained reasoning state over the particular naive caption baseline implemented in the paper. They do not establish that reasoning generally outperforms summaries: caption and CoT objectives, token counts, and training are not fully matched. A stricter comparison would hold the backbone, total tokens, visual evidence, and update FLOPs constant while changing the state representation.

ThinkStream bounds its visual window, but reasoning tokens continue to accumulate more slowly. It reduces dense visual-KV growth, and its custom CUDA Graph engine reports a processing threshold below 0.5 seconds at 2 FPS. The public engine preallocates static KV for each layer, prefills only new inputs, and compacts the cache when visual spans leave the window. With the default `max_len=24576` and 20 reasoning tokens per second, a rough capacity estimate is about 20.5 minutes. Early termination and other tokens change the actual duration. Strictly time-independent state size still requires consolidation or a long-term eviction bound for reasoning state.

### TaYS and StreamingThinker compute while input is arriving

[Think-as-You-See](https://arxiv.org/abs/2603.02872) transfers StreamingThinker's text approach to video. A streaming attention mask prevents reasoning steps from seeing later visual content, and decoupled positional encoding resolves position conflicts between visual input and reasoning output. Parallel dual KV caches are designed to allow frame ingestion and token decoding to overlap. On VideoEspresso, the paper reports a 2.9-point accuracy gain, TTFT falling from 10.6 seconds to nearly zero, and reasoning-event deviation falling from 1.52 to 0.69 seconds.

Near-zero TTFT uses a particular timing convention. Reasoning starts while video is still arriving, so the wait measured from receipt of the complete input can approach zero. This supports lower answer-ready latency through overlapping computation. Thought still has a cost, and a backlog develops if computation during streaming exceeds the playback interval.

The public implementation supports a narrower conclusion than the paper architecture. One main evaluation path first encodes the full video, then repeatedly calls `generate` on growing causal prefixes without passing old `past_key_values` between rounds. Another LiveCC path maintains a single persistent KV cache, but there is no auditable scheduler with two concurrent workers. Dual-cache execution, zero-copy merging, and asynchronous overlap remain architectural claims in the paper. The current release directly supports causal generation and improved temporal alignment.

[StreamingThinker](https://arxiv.org/abs/2510.17238) originally studies thinking while reading text. It assigns separate positions to source input and reasoning, maintains source KV and reasoning KV, and uses a causal mask so each reasoning unit depends only on sentences already read. D1 performs local inference during reading, D2 integrates globally after reading, and D3 reflects afterward. D2 produces the largest accuracy recovery in the experiments. The paper also reports an 80% reduction in token waiting and more than 60% lower final-answer time-level latency. Its timing model assumes a reading speed of 150 words per minute.

The text setting suggests a useful structural lesson for video. Local thought can process evidence shortly after it arrives, while relationships across chunks still need global integration. Mechanically splitting batch CoT into many small pieces can damage global consistency.

The released code again sets a clear evidential boundary. The paper describes concurrent source encoding and reasoning generation; current `generate.py` mainly alternates the two inside one Python `while` loop and merges caches with `torch.cat`. An independent concurrency scheduler has not been released. The accuracy change from D1 to D2 is visible algorithmic evidence. Concurrent speed claims should still be identified as paper-level systems claims.

### ThinkOmni and WAT clarify the boundaries

[ThinkOmni](https://arxiv.org/abs/2602.23306) uses an off-the-shelf Large Reasoning Model to guide an omni-modal model during decoding. Stepwise Contrastive Scaling balances their perception and reasoning distributions. It improves reasoning at query time without training, but does not maintain state as a video advances. It is a useful reference because multimodal reasoning and streaming reasoning can improve independently. A method may substantially improve reasoning while still decoding in a batch after the complete input arrives.

[WAT](https://arxiv.org/abs/2603.13412) uses Watching Before Thinking. Its query-independent watching stage maintains both high-fidelity short-term memory and fixed-capacity long-term memory, with semantic diversity guiding the latter. The paper configuration retains 16 STM frames and 768 LTM entries, retrieves the top 32 after a query arrives, and then starts reasoning. It continuously constructs state without continuously producing explicit thought. Thinking therefore should not be identified solely with textual CoT. The materials reviewed for this article did not provide an auditable official repository for WAT, so the discussion relies on its paper's methods and results.

## Thinking while watching is also a state update

Placed side by side, these methods make the scope of thinking easier to specify. Every streaming step can be written as a state update subject to a compute budget.

<div class="equation" role="math" aria-label="Current state is updated from previous state, a new observation, and additional computation">
  <span>S<sub>t</sub> = F<sub>θ</sub>(S<sub>t−1</sub>, x<sub>t</sub>, c<sub>t</sub>)</span>
</div>

Here c<sub>t</sub> denotes additional computation allocated to the current step. Textual thought is one visible form of S<sub>t</sub>; structured event updates and object-track updates also alter state. Latent recurrence, KV rearrangement, and memory consolidation are not readable natural language, but may still perform comparison, attribution, revision, or prediction.

This makes the contribution of thought testable. If it merely condenses visual content into a short description, its main benefit is semantic compression. A stronger case for reasoning capacity requires reliable gains on tasks that a matched summary cannot solve, together with intermediate inferences that can be checked.

Text state fits existing LLM interfaces, supports retrieval and inspection, and usually expresses a given semantic content with far fewer tokens than visual patches. Its costs are equally specific. Unnamed visual details become hard to recover, and generation errors accumulate across time. Free text also lacks enforceable structure. An observation, a hypothesis, and a current belief can end up in the same sentence and become difficult to separate later.

A more robust design assigns types and confidence to state contents. An observation records what was actually seen at a time. A hypothesis retains an unverified interpretation. Entity state records currently valid attributes, and an episodic link points to a visual location that can be reread. When later evidence contradicts an earlier belief, the system can revise the current belief while preserving the historical episode. Natural language can remain the interface to people without forcing all internal state into a free-form thought whose provenance is lost.

## Compute is a budget spent over time

Redistributing reasoning across time produces both the benefits and the costs of streaming thinking. Observation-time computation can be separated into visual encoding, state updates, and memory consolidation.

<div class="equation" role="math" aria-label="Streaming computation is the sum of visual encoding, state updates, and memory consolidation">
  <span>C<sub>stream</sub> = Σ<sub>t</sub> C<sub>encode</sub>(t)</span>
  <span>+ Σ<sub>t∈G</sub> C<sub>update</sub>(t)</span>
  <span>+ Σ<sub>t∈H</sub> C<sub>consolidate</sub>(t)</span>
</div>

There is also C<sub>query</sub> after a question arrives. Reporting only final TTFT favors systems that perform a large amount of work beforehand. Reporting only total FLOPs erases the practical value of low response latency. Evaluation should retain both accounts, alongside the real-time factor, backlog, and deadline-miss rate.

Many implementations assume every chunk deserves thought. Triggering every 16 seconds, generating 20 tokens per second, or invoking an action head on every frame makes training and batching convenient. When a video is static or repetitive, fixed updates spend the budget on low-value segments. A scheduler should assess whether an observation adds information and whether uncertainty in existing state calls for correction. The cost of skipping an update belongs in that same decision.

Asynchronous thought introduces version-consistency problems. A query may arrive halfway through a background update. The system can wait for the latest result, use the most recent completed state, or interrupt and roll back the update. VST chooses the latest completed memory. A general implementation needs state versions and a record of the observation cutoff and memory revision used by each answer. This makes it possible to distinguish evidence that had not arrived, an update that had not finished, and evidence missed during retrieval.

Thought frequency could eventually be a learned control variable. The available actions need not be limited to compute or skip. A light caption, structured update, expensive global consolidation, and external retrieval consume different budgets. Choosing among them from the current state turns temporal compute allocation into a constrained decision rather than a fixed schedule.

## Codecs can help decide where to look

Video codecs already address a related problem. Adjacent frames are mostly redundant, so encoding every pixel as new information is wasteful. I-frames or anchors preserve fuller appearance, while predictive frames use motion, residuals, and bit cost to describe change. A VLM can use these signals to allocate evidence before visual encoding: which times and spatial regions deserve visual tokens?

[OneVision-Encoder](https://arxiv.org/abs/2602.08683) uses codec-aligned sparsity to select patches in its paper method. The ViT still receives decoded RGB patches; motion vectors and prediction residuals determine their positions. Sparse patches are packed into a canvas, while their original (t, h, w) coordinates are retained for 3D RoPE. The LLM does not read compressed coefficients directly.

The public implementation separates visual encoding, spatiotemporal positions, and video reading into different modules. Its released primary preprocessing path uses bitcost and readiness, whereas the paper method describes motion vectors and residuals. Both select sparse visual evidence, but they belong to different levels of evidence and should be identified separately when citing results.

[codec-video-prep](https://github.com/YunyaoYan/codec-video-prep) packages this process as reusable preprocessing. It extracts block-level bitcost from H.264, HEVC, or VP9, builds adaptive readiness groups, and selects a set of 2×2 image blocks globally. Selected RGB patches are packed into a canvas, with source positions stored separately. An older motion-vector-plus-residual path remains in the code; bitcost and readiness are the current default. Combining the paper equations, old implementation, and current main path into one description would misstate the implementation.

[LLaVA-OneVision-2](https://arxiv.org/abs/2605.25979) connects images, sampled video, and codec-stream canvases to a unified visual-token interface. The paper describes logical GOPs that vary with bitcost, motion-residual spatial scores, 2×2 image-block selection, and within-group attention visibility. Codec-stream training applies only to part of the long-video data in later curriculum stages, with up to 384 and 768 source frames. Other training inputs do not all use the codec path. The released runtime also depends on the processor, checkpoint remote code, and an earlier preprocessing package. A single entry function cannot reconstruct every evaluation setting in the paper.

[Mage-VL](https://arxiv.org/abs/2607.24904) uses a 16×16 patchifier in Mage-ViT. Traditional HEVC scores combine motion-vector magnitude with P-frame residual energy, while the DCVC-RT route uses negative log-likelihood. An input of 64 frames at 256×256 produces 16,384 dense patches. A budget of 4,096 removes approximately 75% of the tokens. In stage five, the vision backbone and base LLM are frozen, and a silence/speak gate is trained on about 3.35 million streaming samples.

The public Mage-VL demo also exposes the distance between the paper method and a running system. Its traditional codec route delegates to bitcost/readiness in codec-video-prep, and the ViT continues to consume selected RGB patches. The program segments and preprocesses the complete video first. One gate call evaluates all chunks, while generation uses only the current chunk. The persistent real-time interface and generation over the latest N chunks shown in paper Figure 3 do not appear in the public demo.

These studies establish that codec metadata can allocate spatial and temporal evidence under a token budget. Using the same signals to decide when to invoke expensive computation remains a research hypothesis proposed in this article.

<figure>
  <a href="/images/blog/streaming-video-intelligence/fig06-codec-compute-scheduling.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig06-codec-compute-scheduling.svg" alt="Codec signals can select visual evidence and may guide compute scheduling" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 7. Codec-based selection has empirical support; codec-driven scheduling of expensive reasoning remains a hypothesis to test. Open the image for its full resolution.</figcaption>
</figure>

A controller could read keyframes, motion magnitude, residual energy, bitrate, GOP boundaries, and scene cuts. It could apply light state updates to repetitive segments, invoke the full vision tower when residuals rise or new objects appear, and trigger reasoning when semantic uncertainty increases further. Codec signals are cheap and arrive naturally with the video, making them plausible inputs to an early scheduling stage.

There are concrete counterexamples. Small text in a static image, the color of an indicator, or a slowly developing hazard may have low bit cost while being decisive for a future question. Strong camera motion can produce large residuals without a meaningful semantic change. A codec gate is therefore a low-cost candidate signal. Decisions still need scene semantics, uncertainty, and safeguards for rare events.

## What current systems establish

Progress runs in several directions. OVO-Bench and StreamingBench constrain future visibility, question times, and response times. SimpleStream gives complex memory methods a strong recent-window baseline. StreamForest, ObjectStream, and WAT investigate events, objects, and layered visual memory. VST and ThinkStream write observation-time reasoning into state. StreamingVLM, MOSS-VL, and ViCoStream pursue incremental computation and throughput.

These contributions do not form one ordered ladder. Public evaluation remains some distance from sustained operation, so it is more useful to compare demonstrated behavior with the offline or finite-horizon conditions that remain.

| Work or protocol | What it establishes | Remaining offline or finite-horizon conditions |
| --- | --- | --- |
| Main OVO-Bench evaluation | Causal prefixes and forward probes | Pretrimmed videos; independent inference for each probe |
| Main StreamingBench evaluation | Timestamp-based cropping and polling for proactive output | Known checking neighborhood; recomputation for every query or poll |
| VST's OVO path | Recurrent visual-to-text state within a sample | Full prefix acquired before sampling; state rebuilt across queries |
| SimpleStream | Input always restricted to a recent window | Window recomputed after each query; no persistent state |
| StreamForest and ObjectStream | Bounded incremental memory in the methods | Official evaluation still rebuilds memory within each prefix |
| StreamingVLM | Persistent KV with eviction | File input; distant visual information largely survives through commentary |
| ThinkStream | Persistent KV and visual-span eviction | Full file loaded first; reasoning KV constrained by a fixed maximum length |
| Public LiveStarPro release | Proactive output and hierarchical caption trees | Complete video encoded before the streaming loop |
| Mage-VL demo | Codec token selection and a speak gate | Full video segmented first; no released persistent live-state interface |
| MOSS-VL | Frame-arrival sessions can overlap with generation | Append-only visual cache; default operation limited by maximum frame count |
| JoyAI adapter | State survives across requests; asynchronous hierarchical summaries | Forced silence before queries by default; codec version unreleased |
| StreamArena harness | Wall-clock progression and proactive-output deadlines | Full StreamMind memory agent not open-sourced |

The same table therefore records advances along different axes. StreamingVLM gives stronger evidence for incremental computation; StreamForest states its bounded event compression more clearly. JoyAI advances cross-request state, and StreamArena tightens real-time evaluation. A comparison of "how streaming" two systems are must first identify the relevant axis.

Having the complete video on disk does not necessarily cause future leakage. A loader can remain causal if, at time <var>t</var>, it decodes only the interval from <var>t</var> to <var>t</var> plus <var>&Delta;</var>. File access does introduce other conditions: random access, possible knowledge of total duration, and accelerated replay. Network jitter, camera backpressure, and an unknown endpoint may never be exercised.

A known query timestamp can also support rigorous trimming without automatically making an answer easier. The operational difficulty lies between queries. A real system does not know when the next question will arrive and cannot build a new, specially suited state for every question. Running queries independently removes state accumulation, error propagation, user correction, and memory expiration from the measurement.

A fast final answer may also reflect substantial computation spent during playback. VST deliberately amortizes reasoning over playback time, which is a reasonable deployment choice. Experiments still need to report update computation per second. A background thinker that continuously occupies a GPU and a system that updates only at events can have similar TTFT while demanding very different resources.

## A design space that makes comparisons precise

A single streaming label cannot describe these systems. A multidimensional description makes their differences explicit.

| Dimension | Design choices |
| --- | --- |
| Visible input | Complete offline video / causal prefix / recent window / live stream |
| Input unit | Frame / chunk / event / object / compressed representation |
| Inference | Full recomputation / window recomputation / incremental update / recurrent state |
| State representation | Stateless / visual / KV / latent / semantic / textual / hybrid |
| State budget | Growing / fixed active context / strictly bounded / adaptive |
| Compute timing | Query time / playback time / periodic / event-triggered |
| Reasoning level | Direct answer / local update / local thought / global integration |
| Query protocol | Fixed time / arbitrary query / standing condition / continuous operation |
| Output | Answer / prediction / notification / clarification / action |
| Interaction | Passive / responsive / conditionally proactive / openly proactive |
| Runtime horizon | Short / long / hours / no fixed endpoint |
| Resource constraints | Unrestricted / bounded tokens / real-time deadline / bounded FLOPs per second |

<figure class="article-figure">
  <a href="/images/blog/streaming-video-intelligence/fig09-design-space.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig09-design-space.svg" alt="Twelve design dimensions for streaming video MLLMs, grouped by observation, updates, budgets, and action" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 8. A shared design space for streaming video MLLMs. Open the image for its full resolution.</figcaption>
</figure>

The axes can be combined in many ways. A causal prefix can use full recomputation or persistent KV. Text state can keep growing or be constrained by FIFO. Proactive output can depend on a recent window or hierarchical memory. Codec inputs can feed ordinary batch inference or a real-time gate.

In an implementation, these choices interact. State representation limits the available forgetting policies. Predictability of future questions determines how strongly memory can specialize to known tasks. Playback-time thought reduces query latency but increases ongoing computation and creates paths for error propagation. Changing a window changes information, compute, and state budgets together. Codec selection affects both visible evidence and visual cost, and may also alter temporal scheduling.

At least three budgets should be explicit in a comparison. Systems must receive the same information, so future access is not mistaken for an architectural gain. Total state and visual resolution should match, so additional tokens cannot masquerade as better memory. Playback and query-time computation need separate accounts to show the sustained cost of low latency.

## From answering questions to continuous visual intelligence

Most benchmarks still center on a mapping from questions to answers.

<div class="equation" role="math" aria-label="A question at time t produces an answer at time t">
  <span><var>Q</var><sub>t</sub> → <var>A</var><sub>t</sub></span>
</div>

Streaming changes which prefix is visible at answer time. A continuously running system must also let state inform decisions directly.

<div class="equation" role="math" aria-label="Current state may trigger ignoring, remembering, predicting, notifying, asking, or acting">
  <span><var>S</var><sub>t</sub> → {Ignore, Remember, Predict, Notify, Ask, Act}</span>
</div>

Each decision carries specific requirements. Ignoring involves false-alarm and compute trade-offs. Writing memory requires a state budget and evidence provenance. Prediction requires calibrated confidence and a time horizon. Notifications have deadlines and interruption costs. Asking addresses missing information, while acting requires safety constraints and rollback interfaces.

Proactivity also has distinct levels. P0 answers after a query. P1 registers an explicit standing condition, then receives no additional prompt when the event occurs; StreamArena's proactive track fits here. P2 accepts a broader standing instruction and chooses when to speak or remain silent. LiveStarPro narration and JoyAI's action policy with forced silence disabled are closer to this level. P3 lets a system independently decide what deserves attention and notification in an open world. Rigorous, systematic validation of that level remains limited.

StreamArena gives P1 a stricter protocol. It contains 243 videos averaging 88.8 minutes, with open-ended tasks covering real-time perception, historical recall, tool use, and proactive interaction. A proactive task provides its standing instruction at the start of a stream or early in it. No new prompt arrives at the target event. Output must fall between 0.5 seconds before and 2 seconds after the target. The public harness advances by wall clock and provides an asynchronous callback interface. The full StreamMind agent described in the paper was not released with the repository, so the benchmark protocol and system blueprint remain separate pieces of evidence.

The public JoyAI-VL-Interaction adapter maintains per-session raw chunks, mid-term summaries, long compressed memory, dialogue, and asynchronous jobs. The paper configuration retains 100 seconds of short-term state, 5 mid-term summaries, and 15 long-term blocks, giving nominal semantic coverage of about 2.08 hours. That figure describes how much time the text hierarchy can cover. It does not mean visual detail is preserved without loss for two hours. The default service forces silence before a query; the proactive commentary described in the paper requires disabling the corresponding flag. AdaCodec, mentioned in the paper, is also absent from the public release.

MOSS-VL separates its visual cache from the autoregressive language sequence through gated cross-attention. Each new frame is encoded once, and visual ingestion can continue while the model speaks. The public driver supports camera, screen, and websocket sources, demonstrating a computationally incremental design. The core cache lives in remote code that has not been fully audited for this article, so the paper's mechanisms cannot all be treated as independently verified from the public implementation. Its visual cache remains append-only, and both experiments and the default driver depend on finite frame limits. Watching while speaking is feasible; bounded long-term state still requires a separate answer.

<figure class="article-figure">
  <a href="/images/blog/streaming-video-intelligence/fig10-capability-progression.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig10-capability-progression.svg" alt="Capabilities extend from offline long-video analysis through causal and stateful streaming toward proactive systems and continuous visual intelligence" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 9. From offline long-video understanding toward continuous visual intelligence. Open the image for its full resolution.</figcaption>
</figure>

Continuous visual intelligence can be specified as a set of system conditions. Inputs have no known endpoint, future content is unavailable, and state persists across multiple questions. Main working memory and computation per second have budgets. The system updates state during playback, integrates it when a question arrives, and produces proactive output when appropriate. Each answer should also be traceable to the state version and visual evidence it used.

## Eight questions that experiments could falsify

### 1. How should streaming state representations be compared?

Current papers retain raw frames, visual tokens, KV, captions, free-form thoughts, event trees, object anchors, or latent slots, then compare final scores across different backbones and budgets. Such comparisons mix the effects of state representation, extra tokens, training, and stream-time computation. Text state loses visual detail, visual state is expensive, and latent state is hard to audit.

A narrower question is more useful: with unknown future queries and a fixed total state budget, which representation preserves the widest range of usable information while supporting correction and provenance? One testable hypothesis is that hybrid state forms an interpretable Pareto frontier at a matched budget. Recent visual tokens preserve detail, structured events retain temporal and causal relationships, and a few raw keyframes remain available for inspection. This combination should outperform text-only or vision-only state on unseen questions, without necessarily winning every task category.

A minimal experiment would fix the backbone, input, total token budget <var>B</var>, update FLOPs per second, and final reasoning budget. It would compare raw vision, compressed vision, captions, free-form thought, structured event state, latent state, and hybrids. Questions would be sampled only after the stream ends from a pool unavailable during memory writing. Evaluation would separately report factual recall, temporal order, causal relations, spatial layout, OCR, identity persistence, and fine-grained appearance. A deletion probe could remove items judged low-value one at a time and observe when answers change. It would directly expose whether a compressor has discarded necessary evidence.

<figure class="article-figure">
  <a href="/images/blog/streaming-video-intelligence/fig11-state-ablation.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig11-state-ablation.svg" alt="Compare visual memory, summaries, free-form reasoning, structured events, and latent state with the same model, state budget, and compute budget" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 10. A matched-budget state ablation controls representation, computation, and access to future questions. Open the image for its full resolution.</figcaption>
</figure>

### 2. Does streaming thought provide reasoning or semantic compression?

In many systems, a thought simultaneously summarizes observations, records entities, and makes local inferences. ThinkStream's caption control does not fully match training objectives or token budgets, while VST synthesizes thought targets offline from a knowledge graph of the complete video. A higher score therefore does not reveal whether free text is merely an adaptive task summary. It also cannot exclude gains from additional decoding computation at test time.

An experiment could fix visual information, tokens, FLOPs, and training data, changing only how state is expressed. If reasoning drives the gain, CoT state should mainly help tasks that combine evidence or require counterfactual and causal inference. If compression drives it, extractive or structured summaries should perform similarly on factual recall and make facts easier to verify.

The minimal controls are an extractive caption, descriptive summary, fixed-schema event log, free-form rationale, latent update, and a no-op compute control. The last generates an equal amount of hidden work but masks its content during the final answer, isolating the effect of extra computation. An intermediate hypothesis could also be deliberately replaced with a plausible error. If later visual evidence cannot correct it, the update lacks belief revision and local mistakes can harden during long operation.

### 3. How can query-agnostic memory be evaluated?

Benchmark query distributions are usually fixed. Some synthetic data also uses the final question or an evidence trace from the complete video. Even when the runtime prompt contains no question, training may teach the model to prioritize whatever that benchmark commonly asks. Such state can work well in distribution while having no evidence left for unfamiliar spatial details, rare entities, or new task language.

The research question is whether state built before <var>Q</var><sub>future</sub> appears can generalize beyond its original task family. A falsifiable hypothesis is that structured state with observation provenance, entity changes, and a few revisitable visual keyframes will better resist shifts in query distribution than free-form summaries.

The minimal setup must separate writing from questioning completely. Training exposes one set of query families; testing adds unseen types on the same streams. State must be frozen before any test query is revealed, and the model must not rewatch the source video. A stronger test would keep the recent window and question fixed while changing a decisive fact earlier in the stream. If the answer does not follow that historical change, the sample or system may rely on priors and local cues rather than long-term state.

### 4. When is computation worth spending?

Fixed frame rates, chunk sizes, thought intervals, and full-encoder calls per frame make training convenient, but assign similar budgets to static segments and decisive events. Low-information input wastes FLOPs, while rapid events can fall between updates. Motion alone misses static OCR; a semantic gate approaching the size of the main model defeats the purpose of saving computation.

The question is whether a cheap gate using several signals can schedule visual encoding, state updates, and global thought under a fixed FLOPs-per-second budget. A specific hypothesis is that a hybrid of codec bitcost or residuals, scene changes, lightweight object novelty, and model uncertainty will outperform uniform cadence at the same budget. It should also miss fewer valuable static events than a codec-only gate.

Controls should include uniform, scene-cut, codec-only, lightweight semantic, uncertainty, hybrid, and oracle triggers, with strictly matched average visual-encoding calls and reasoning tokens. Measurements should cover event recall, false triggers, recall of rare static evidence, and answer quality, as well as energy, backlog, and missed deadlines. Final QA accuracy alone can reward a gate that simply triggers too often.

### 5. How should state update across time scales?

Real visual processes contain millisecond motion, second-scale actions, minute-scale events, and goals lasting hours. A single window struggles to serve all of them.

<div class="equation" role="math" aria-label="State at time t contains short-term, event, and semantic components">
  <span><var>S</var><sub>t</sub> = (<var>S</var><sub>t</sub><sup>short</sup>, <var>S</var><sub>t</sub><sup>event</sup>, <var>S</var><sub>t</sub><sup>semantic</sup>)</span>
</div>

<figure class="article-figure">
  <a href="/images/blog/streaming-video-intelligence/fig08-multiscale-state.svg" target="_blank" rel="noopener noreferrer">
    <img src="/images/blog/streaming-video-intelligence/fig08-multiscale-state.svg" alt="Short-term, event, and long-term semantic states update at different time scales and retrieve from one another" loading="lazy" decoding="async" />
  </a>
  <figcaption>Figure 11. Different time scales need different update triggers and levels of fidelity. Open the image for its full resolution.</figcaption>
</figure>

Many current hierarchies merely connect three buffers of different lengths and update them after fixed frame counts. If an event boundary falls out of step with that schedule, an entity can lose its identity across events, or a semantic summary can settle too early. Research needs to specify which events trigger writing, merging, and rereading at each layer, and how provenance survives those transitions.

A falsifiable hypothesis is that short-term state should update every frame, event state at boundaries or changes in novelty or uncertainty, and semantic state only when an event closes or a belief changes. This asynchronous hierarchy should beat a fixed-rate hierarchy with the same total budget. A minimal test would independently manipulate actions lasting 1 to 2 seconds, events lasting 1 to 5 minutes, and identity or goal dependencies lasting 30 to 60 minutes in the same video, while fixing total state and update FLOPs.

The benefits should also be selective by scale. The short-term layer should improve current actions, the event layer should improve ordering and local causality, and the semantic layer should support identity, goals, and long-term state. If every gain comes from the largest buffer, the hierarchy is concealing extra capacity rather than demonstrating useful specialization.

### 6. How do we know the model forgot the right things?

FIFO, merging, summary overwriting, and low-saliency eviction usually aim to reclaim space. They rarely measure the future utility of deleted information directly. Stale facts may coexist with current state, frequent content may displace rare decisive events, similar objects may merge incorrectly, and early mistakes may become harder to correct after summary consolidation.

A good forgetting policy removes invalid state, preserves historical episodes, and acknowledges when lost detail cannot be recovered. One testable direction is to attach observation time, validity time, confidence, and source pointers to memory. If typed memory helps, it should make contradiction correction and selective forgetting easier than free-form summaries do.

A minimal test suite could combine stale-state, contradiction, rare-event, identity-return, and semantic-to-episodic retrieval cases, while logging the estimated utility of every eviction. Retention rate alone is insufficient. One could measure retained useful bits per state byte or plot a deletion-utility curve. If performance declines slowly when items are removed in the model's own low-value order, that ranking is useful. If the first deletions remove decisive evidence, the policy has learned compression without learning what is worth preserving.

### 7. What should a streaming benchmark account for?

Most benchmarks report task accuracy and query latency, and define the causal prefix reasonably clearly. They lack a common record of cross-query state lifetime, stream-time computation, and external-memory growth. Full-prefix recomputation and persistent state can then share a label, early computation can look like free acceleration, and a bounded active prompt can hide an ever-growing external event database.

The research question is how to make scores reflect information causality, state lifetime, sustainable computation, and response timing together. A common systems ledger and evidence-distance breakdown should change model rankings substantially. Recent-window, full-prefix, and persistent-state methods should each show strengths on different submetrics. That prediction can be directly falsified.

The experiment would place multiple unpredictable questions on one video timeline and forbid resets of the model process. The evaluator would log the full sequence of frame arrivals, state updates, questions, answers, evictions, and proactive outputs.

The minimum record has five parts. Timing includes real video time, model compute time, real-time factor, TTFT, and answer completion. Compute includes visual-encoding and state-update FLOPs per second. State includes tokens, bytes, and external-storage nodes. Causal auditing records future leakage and dropped frames. Evidence statistics record how predictable questions are and the distances to their nearest and farthest supporting evidence.

Evaluation can separate a causal protocol from a deployment protocol. The former permits accelerated replay while strictly limiting future visibility, making it suitable for broad capability comparisons. The latter plays at 1× wall clock on fixed hardware with a fixed computation budget per second, testing sustained operation. Both are useful because they answer different questions.

### 8. How should proactive intelligence be evaluated?

Existing proactive tasks often supply a standing condition in advance or poll near a reference time. The monitoring target is known, while the cost of notifying a user rarely enters the score. A model that speaks every second can achieve high event recall and interrupt constantly. Broad templates can produce many low-value notices, and competing monitoring targets can displace urgent tasks.

A system needs to choose among ignoring, notifying, asking, and acting under notification budgets, false-alarm costs, and deadlines. A falsifiable hypothesis is that explicitly accounting for event value, false alarms, lateness, computation, and interruption will produce better scheduling than independent binary detectors. It should also encourage questions when evidence is insufficient.

The minimal setup would put events with different values, false-alarm costs, and deadlines into each stream, permit at most <var>k</var> notifications per minute, and allow users to revoke or modify monitors. An interpretable utility is

<div class="equation" role="math" aria-label="Proactive utility is event value minus false-alarm, lateness, streaming-compute, and interruption costs">
  <span><var>U</var> = <var>V</var><sub>event</sub> − &lambda;<sub>fp</sub><var>C</var><sub>fp</sub> − &lambda;<sub>late</sub><var>C</var><sub>late</sub> − &lambda;<sub>compute</sub><var>C</var><sub>stream</sub> − &lambda;<sub>interrupt</sub><var>C</var><sub>interrupt</sub></span>
</div>

Applications assign different weights to these costs. A security assistant may assign a high cost to missing a fire; a meeting assistant may prioritize avoiding frequent interruptions. Robotic actions also need safety constraints and rollback. The evaluation structure can remain common, while its parameters must reflect the application.

## The video continues, and so must the state

Reading these papers alongside their code has shifted my attention from the number of chunks to how state is created, revised, forgotten, and corrected. As time extends, every choice about input, memory, reasoning, and scheduling must meet a resource bound.

When I evaluate a system, I now ask more specific questions. At time <var>t</var>, what has it seen, what did it just compute, and what remains of the past? Will the state keep growing? Before the future query exists, why did the system retain these particular observations? Can it keep up when the next second of input arrives?

> Streaming video intelligence operates in an unfolding world with no known endpoint. It uses only observations that have arrived, continuously updates its understanding with bounded working state and bounded computation per second, and preserves sufficient, traceable evidence for questions, predictions, notifications, and actions that have not yet been specified.

There is still much to resolve. The next time I see "streaming" in a title, I will first look at how long its state can survive, then at how the video was divided into chunks.

## Implementation and evaluation index

This index collects the implementation boundaries used throughout the article. The main text distinguishes paper methods, released evaluation paths, and my interpretation wherever they differ.

### Benchmarks and incremental inference

| Project | What the public implementation supports |
| --- | --- |
| OVO-Bench | `OVOBench.py`, `chunk_videos.py`, and `VideoLLM_Online.py` use pretrimmed causal prefixes. Each query or probe runs independently; the online adapter resets across calls. |
| lmms-eval OVO | Forward multi-round evaluation in `ovobench/utils.py` and `qwen2_vl.py` reprocesses the full prefix each round. Ordinary adapters do not reuse visual KV across probes. |
| StreamingBench | `StreamingBench.py`, `StreamingBenchSQA.py`, and `StreamingBenchProactive.py` implement timestamp crops, SQA with oracle text history only, and proactive output through per-second polling and recomputation, respectively. |
| VST | `qwen2_5_vl_stream_think.py` and `qwen2_5_vl_sf.py` show current-chunk processing with external text recurrence for OVO, rebuilt across queries. The current StreamingBench path is single-pass. |
| StreamingVLM | `process_past_kv`, `prune_id_and_kv_cache`, and `streaming_inference` in `inference.py` encode new vision once, retain KV across seconds, and physically evict old vision and the middle of previous text. |
| StreamingLLM | `kv_cache.py`, `modify_llama.py`, and `run_streaming_llama.py` combine attention sinks with recent K/V for continuous text decoding, without long-term recall. |
| ThinkStream | `StreamingInferenceEngine.generate`, `maybe_evict`, and `CacheEviction.evict` incrementally update static KV. Visual spans are evicted; reasoning and action KV have no long-term consolidation. |
| StreamingThinker | The public main loop in `generate.py` alternates source processing and reasoning. No independent concurrent scheduler was found. |
| TaYS | A main path in `model.py` and `livecc_infer.py` encodes the complete visual input before repeated generation. True dual-cache concurrency described in the paper cannot yet be fully audited from the release. |
| SimpleStream | `query_recent_window` and `eval_streamingbench.py` retrieve the latest <var>N</var> frames and rerun inference for every query, without a feature cache. |
| ViCoStream | `run_incremental_generate` and `modeling_qwen2_5_vl_INC.py` implement incremental KV and bounded attended history. The release does not demonstrate stage concurrency or KV eviction. |

### State and persistent systems

| Project | What the public implementation supports |
| --- | --- |
| StreamForest | `MemoryManager` and `ToMe_FSTW_PEMF.forward` implement bounded method-level state. Official evaluation creates a new manager on each forward call and reconstructs it from the prefix. |
| ObjectStream | `EntityMemoryBank` and `EntityMem.process_memory_streaming` can update a standalone bank persistently. The main benchmark path still rebuilds it locally for each sample. |
| LiveStarPro | The public tree in `tshm.py` and `streaming_infer.py` stores captions only. The full video is encoded before the streaming loop, and retrieval includes a full-tree scan. |
| JoyAI-VL-Interaction | `live_adapter.py` and `memory_summarizer.py` implement cross-request session state and asynchronous summaries. Silence is forced before queries by default; AdaCodec is unreleased. |
| MOSS-VL | `run_online_inference.py` and `video_sources.py` support live sources and incremental frame pushes within a session. The core cache resides in remote code not fully audited here. |
| StreamArena | `streammind/agent.py` and `run_streammind.py` provide a wall-clock harness and agent interface. The full StreamMind agent is not open-sourced. |

### Codec paths

| Project | What the public implementation supports |
| --- | --- |
| codec-video-prep | `run_preinfer` enters the bitcost/readiness path, packs the canvas, and returns an RGB canvas with source coordinates. |
| OneVision-Encoder | `OneVisionEncoderModel.forward` and `VideoRotaryEmbeddingSplit466` show codec signals selecting decoded RGB patches while retaining 3D source coordinates. |
| LLaVA-OneVision-2 | `process_codec_video` and `processing_llava_onevision2.py` show a runtime assembled from the main processor, remote code, and the preprocessing package. |
| Mage-VL | The demo in `inference_streaming.py` and `streammind_gate.py` preprocesses the complete video; the traditional codec route delegates to bitcost and readiness. |

## References

1. Junming Lin et al. [StreamingBench](https://arxiv.org/abs/2411.03628). Official [code](https://github.com/THUNLP-MT/StreamingBench).
2. Yifei Li, Junbo Niu et al. [OVO-Bench](https://arxiv.org/abs/2501.05510). Official [code](https://github.com/JoeLeelyf/OVO-Bench).
3. Yujiao Shen et al. [A Simple Baseline for Streaming Video Understanding](https://arxiv.org/abs/2604.02317). Official [code](https://github.com/EvolvingLMMs-Lab/SimpleStream).
4. Guangxuan Xiao et al. [Efficient Streaming Language Models with Attention Sinks](https://arxiv.org/abs/2309.17453). Official [code](https://github.com/mit-han-lab/streaming-llm).
5. Ruyi Xu et al. [StreamingVLM](https://arxiv.org/abs/2510.09608). Official [code](https://github.com/mit-han-lab/streaming-vlm).
6. Yang Tan et al. [ViCoStream](https://arxiv.org/abs/2606.19849). Official [code](https://github.com/EIT-NLP/StreamingLLM/tree/main/ViCoStream).
7. Junlong Tong et al. [StreamingThinker](https://arxiv.org/abs/2510.17238). Official [code](https://github.com/EIT-NLP/StreamingLLM/tree/main/StreamingThinker).
8. Jialiang Zhang et al. [Think-as-You-See](https://arxiv.org/abs/2603.02872). Official [code](https://github.com/EIT-NLP/StreamingLLM/tree/main/TaYS).
9. Yiran Guan et al. [Video Streaming Thinking](https://arxiv.org/abs/2603.12262). Official [code](https://github.com/1ranGuan/VST).
10. Zikang Liu et al. [Thinking in Streaming Video](https://arxiv.org/abs/2603.12938). Official [code](https://github.com/CASIA-IVA-Lab/ThinkStream).
11. Yiran Guan et al. [ThinkOmni](https://arxiv.org/abs/2602.23306). Official [code](https://github.com/1ranGuan/ThinkOmni).
12. Zifan Han et al. [WAT](https://arxiv.org/abs/2603.13412).
13. Xiangyu Zeng et al. [StreamForest](https://arxiv.org/abs/2509.24871). Official [code](https://github.com/MCG-NJU/StreamForest).
14. Zhenyu Yang et al. [LiveStarPro](https://arxiv.org/abs/2606.17798). Official [code](https://github.com/sotayang/LiveStarPro).
15. Mingkang Dong et al. [ObjectStream](https://arxiv.org/abs/2607.28312). Official [code](https://github.com/DMK041218/ObjectStream).
16. Muxin Fu et al. [StreamFlow](https://arxiv.org/abs/2608.10949). Official [project page](https://streamflow-vlm.github.io/).
17. Feilong Tang et al. [OneVision-Encoder, Codec-Aligned Sparsity as a Foundational Principle for Multimodal Intelligence](https://arxiv.org/abs/2602.08683). Official [code](https://github.com/EvolvingLMMs-Lab/OneVision-Encoder).
18. codec-video-prep maintainers. [codec-video-prep v0.2.5](https://github.com/YunyaoYan/codec-video-prep). Software repository.
19. Xiang An et al. [LLaVA-OneVision-2](https://arxiv.org/abs/2605.25979). Official [code](https://github.com/EvolvingLMMs-Lab/LLaVA-OneVision-2).
20. Senqiao Yang et al. [Mage-VL](https://arxiv.org/abs/2607.24904). Official [code](https://github.com/microsoft/Mage).
21. Dingyu Yao et al. [JoyAI-VL-Interaction](https://arxiv.org/abs/2606.14777). Official [code](https://github.com/jd-opensource/JoyAI-VL-Interaction).
22. Xichen Zhang et al. [StreamArena](https://arxiv.org/abs/2608.05703). Official [benchmark and harness code](https://github.com/JIA-Lab-research/StreamArena).
23. Pengyu Wang et al. [MOSS-VL Technical Report](https://arxiv.org/abs/2608.15045). Official [code](https://github.com/OpenMOSS/MOSS-VL).
24. Keming Wu et al. [StreamOPD](https://arxiv.org/abs/2608.16320). Official [code](https://github.com/UniX-AI-Lab/StreamOPD).
25. EvolvingLMMs-Lab. [lmms-eval](https://github.com/EvolvingLMMs-Lab/lmms-eval). Evaluation framework.
