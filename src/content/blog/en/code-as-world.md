---
title: "Code-as-World and the World as an Executable Hypothesis"
description: "How Code-as-World connects visual evidence, executable world representations, and abductive discovery, and what its results do and do not establish about physical understanding in an open world."
pubDate: 2026-09-03
readingTime: "25 min"
tags: ["World Model", "Physical Intelligence", "Agentic Discovery"]
lang: "en"
translationKey: "code-as-world"
tocDepth: "chapters"
featured: true
draft: false
sources:
  - label: "Code as Worlds technical report"
    url: "https://arxiv.org/abs/2608.27549"
  - label: "MirroS on structured languages and the physical world"
    url: "https://mirros.ai/blog/representing-physical-world"
  - label: "Code-as-World project page"
    url: "https://mirros-lab.github.io/code-as-world/"
  - label: "Code-as-World public repository"
    url: "https://github.com/MirroS-Lab/Code-as-World"
  - label: "MirroS on the path toward Physical RSI"
    url: "https://mirros.ai/blog/building-physical-rsi-beyond-the-known-world"
  - label: "QuantiPhy quantitative physical reasoning benchmark"
    url: "https://quantiphy.stanford.edu/"
---

The project page presents a simple-looking question. A blue ball rolls down a ramp. How fast is it moving when it leaves the ramp? A person can see the ball move, and a language model can talk about gravity, acceleration, and inertia. Ask for an answer in meters per second, though, and the task changes. The model must identify the correct ball, work out the length of the ramp and the interval between frames, account for perspective, and express all those measurements in a consistent set of units.

Questions like this expose a limitation of visual models. Recognizing a physical event is still a long way from recovering the state and mechanism that produced it. A video shows what happened, but object dimensions, mass, velocity, contact relationships, and camera position are not written directly into the pixels. A model can generate a plausible future video without ever settling whether the observed change came from the ball moving, the camera moving, or a brief occlusion.

Reading the *Code as Worlds* technical report alongside MirroS's two research essays, the project page, and the public repository, I found its treatment of that gap especially worth examining. Code-as-World proposes an explicit hypothesis about the world from observations, runs it in a simulator, projects the results back into observable space, and revises the hypothesis in response to discrepancies. Writing the world as code makes the hypothesis executable and testable. Code has a more demanding role here than ordinary structured output.

<figure>
  <a href="/images/blog/code-as-world/teaser.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/teaser.png" alt="Code-as-World overview showing Composition, Evolution, and Appearance, with applications to physical reasoning, video generation, and embodied interaction" width="1824" height="816" loading="eager" decoding="async" /></a>
  <figcaption>Figure 1. The overall Code-as-World proposal. The world representation on the left is executed and rendered for quantitative reasoning, controllable generation, and embodied interaction. Source: MirroS Team technical report, CC BY-NC-SA 4.0.</figcaption>
</figure>

## Pixels provide evidence; understanding requires recovering a world

The official MirroS essay makes a useful observation about pixels as evidence of the physical world. They record what reached a sensor from a particular viewpoint at a particular moment. They preserve rich appearance while combining the factors that produced it. A camera moving left and an object moving right can produce similar image motion. Two balls with different masses can follow similar trajectories in a short video if their initial conditions are chosen appropriately.

A world model faces an inverse problem. Given observations <code>o[≤t]</code>, it must recover latent states <code>s_t</code> and possible rules of evolution, then predict what happens when an action <code>a_t</code> intervenes. Observation loses information, and a finite video covers only a small range of viewpoints and times. Several different worlds may explain the same images.

This is what gives the choice of representation its importance. A representation must compress observations while retaining the variables that affect the future. We should first ask whether it preserves those variables, then how much texture it retains. If a model cannot distinguish object identity, support relationships, and contact events, even sharp images will do little to help it answer counterfactual questions. Where would the ball land if the ramp were less steep? How would the collision change if the cup were replaced by a heavier metal one? Answering requires a world whose conditions can be changed.

<figure>
  <a href="/images/blog/code-as-world/representation-comparison.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/representation-comparison.png" alt="Comparison of pixel-based, 3D, natural-language, and Code-as-World representations" width="1689" height="910" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 2. The technical report's comparison of physical world representations. Each preserves different information; code emphasizes explicit structure, continuous states, and physical mechanisms. Source: MirroS Team technical report, CC BY-NC-SA 4.0.</figcaption>
</figure>

Pixels, 3D representations, language, and code make different trade-offs about information.

| Representation | What it preserves well | What it can leave out |
| --- | --- | --- |
| Images and video | Appearance, texture, and the distribution of real observations | Object identity, mechanisms, and viewpoint effects are often entangled |
| 3D reconstruction | Geometry, cameras, and spatial correspondence | Mass, friction, forces, and state transitions do not emerge automatically |
| Natural language | Entities, events, common sense, and high-level causality | Continuous trajectories, precise contact, and metric states are difficult to express consistently |
| Executable code | Explicit variables, constraints, units, and rules that support intervention | Expressive scope is limited by the schema and simulator |

These trade-offs do not imply that one representation should replace the others. The actual Code-as-World system still reads RGB images, depth, instance masks, 2D tracks, and 3D meshes. An LLM relies on its latent representations when proposing a world hypothesis. A video generator also needs high-dimensional latents to supply materials, lighting, and backgrounds. Code fixes object identity, parameter semantics, units, and execution interfaces so that these modules can work with the same candidate world.

## What an executable world contains

The technical report writes an executable world representation, or EWR, as <code>p = (C, E, A)</code>. Its three components describe what exists, how it changes, and how those changes are observed.

| Component | What it represents | Typical variables |
| --- | --- | --- |
| Composition <code>C</code> | Persistent objects, environmental structure, and relatively stable physical properties | Geometry, scale, mass, friction, gravity, floors, and walls |
| Evolution <code>E</code> | Initial states and dynamics unfolding over time | Position, velocity, forces, contact, collisions, trajectories, and termination conditions |
| Appearance <code>A</code> | How a physical process is observed and presented | Cameras, materials, backgrounds, lighting, frame rate, and generation conditions |

The division is simple, but it introduces a useful constraint. A floor that supports an object and participates in collisions belongs to Composition. A background that contributes only to the look of an image belongs to Appearance. Changing a wall's texture should not alter the ball's bounce. Changing the coefficient of restitution should alter Evolution. The system can therefore distinguish physical equivalence from pixel-by-pixel reproduction.

<figure>
  <a href="/images/blog/code-as-world/conceptual-map.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/conceptual-map.png" alt="Conceptual map connecting observations, EWR, the simulator, renderer, verifier, and downstream learning" width="2004" height="1081" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 3. EWR connects observations with simulation, rendering, verification, and downstream learning. Redrawn for this article from the technical report and the boundaries of the public system.</figcaption>
</figure>

Code in the paper includes structured scene descriptions and programmatic interfaces to a physics engine. The model does not have to reinvent numerical integration. Objects, initial states, and physical parameters are recorded in EWR, then compiled into parameters accepted by a particular simulator. The simulator advances the continuous state. A renderer converts that state back into depth, masks, trajectories, or pixels.

A simplified forward path can be written as follows.

<div class="equation" role="math" aria-label="Compile the executable world into simulator parameters, execute a state trajectory, then render and project predicted evidence"><span>θ = CompileEWR(p)</span><span>τ = RunSimulation(θ)</span><span>η̂ = RenderAndProject(τ, θ)</span></div>

Here, <code>p</code> is the world hypothesis, <code>θ</code> contains simulator parameters, <code>τ</code> is the complete state trajectory, and <code>η̂</code> is the predicted evidence. Execution turns static declarations into consequences over time. The trajectory can be inspected to determine when objects make contact, how velocity changes, and where they go after a collision.

<figure class="figure-tall">
  <a href="/images/blog/code-as-world/scene-representation-case.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/scene-representation-case.png" alt="Scene representation and simulation example for a video of a soccer ball following a ballistic trajectory" width="864" height="1224" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 4. Observations, scene representation, and execution results from the public ballistic soccer-ball example. Colored regions identify Composition, Evolution, and Appearance. Source: appendix to the MirroS Team technical report, CC BY-NC-SA 4.0.</figcaption>
</figure>

The soccer-ball example in the public repository makes the representation concrete. It explicitly records the coordinate system, metric units, time base, initial position and velocity, collision radius, mass, and coefficient of restitution. Rendering geometry can be separated from collision geometry, with one serving appearance and the other computation. This is a declarative world that produces a continuous trajectory when executed.

Discrete text has not eliminated continuous state. Position, velocity, and rotation remain floating-point arrays, while meshes and cameras remain high-dimensional objects. Code gives them names, units, and relationships, then delegates their evolution to a numerical engine. Explicit semantic boundaries and continuous computation coexist.

## Execution makes understanding testable

A natural-language account can describe an event fluently without exposing errors in its parameters. A program produces consequences. If gravity, initial velocity, or camera position is wrong in a candidate world, the simulated trajectory will diverge from the input video in corresponding ways. That error can become a signal for the next revision.

Code-as-World thus imposes a stronger operational requirement on understanding. A model should construct a world capable of generating the available evidence and produce consistent consequences when the conditions change. This resembles abduction in scientific modeling. A researcher observes a limited set of phenomena, proposes a relatively compact explanation of the mechanism, derives observable consequences, and uses evidence to decide whether to retain, revise, or abandon the hypothesis.

The animation below comes from the public soccer-ball example. The left shows the video evidence. The right shows the world-coordinate trajectory obtained by executing EWR in MuJoCo. The image and trajectory serve different purposes. The image lets us see the ball; the trajectory lets the system read its position and velocity at a particular time.

<figure>
  <a href="/images/blog/code-as-world/evidence-to-trajectory.gif" target="_blank" rel="noreferrer">
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcset="/images/blog/code-as-world/evidence-to-trajectory-still.png" />
      <img src="/images/blog/code-as-world/evidence-to-trajectory.gif" alt="Animation synchronizing soccer-ball video evidence with the executed state trajectory" width="1260" height="480" loading="lazy" decoding="async" />
    </picture>
  </a>
  <figcaption>Figure 5. Pixel observations and an explicit state trajectory for the same process. The animation was drawn from execution results for the scene released in the repository. Devices with reduced motion enabled display a still frame.</figcaption>
</figure>

Execution also makes intervention possible. The system can keep objects and the environment fixed, change only the initial velocity, and run again. It can preserve the dynamics while changing the camera to observe the same process from another angle. This makes variables easier to isolate than asking a video model to generate a similar scene. The field affected by each edit and the component responsible for each resulting difference are explicitly recorded.

## How agentic discovery recovers a world from observations

Generating a trajectory from EWR is a forward problem. Recovering EWR from video is an inverse problem. Code-as-World organizes the latter as a loop.

Text input is first organized into entities, spatial relationships, physical events, and expected outcomes. Text rarely specifies complete geometry or camera parameters, so the agent fills out a candidate world using priors and defaults. Video input requires more perceptual evidence. Instance masks establish object boundaries, tracks maintain correspondence over time, and estimates of depth and camera parameters constrain spatial relationships. The system also constructs a 3D mesh for each object.

These forms of evidence feed into the same discovery process. The agent proposes EWR, instantiates and executes it, renders predicted observations, and compares those predictions with the input. Diagnostic results <code>Δ_k</code> are passed to the next iteration together with the previous hypothesis.

<div class="equation" role="math" aria-label="Update the world representation at iteration k using observed evidence, the previous representation, and the previous diagnostics"><span>pₖ = ModifyEWR(agent, η, pₖ₋₁, Δₖ₋₁)</span><span>Δₖ = CompareAndDiagnose(η̂ₖ, η)</span></div>

<figure>
  <a href="/images/blog/code-as-world/agentic-discovery-loop.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/agentic-discovery-loop.png" alt="Code-as-World agentic discovery loop proposing world hypotheses from evidence and repeatedly executing, rendering, and verifying them" width="2046" height="786" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 6. The Code-as-World discovery loop. Text and video evidence pass through different adapters but ultimately constrain the same EWR. Source: MirroS Team technical report, CC BY-NC-SA 4.0.</figcaption>
</figure>

The paper allows at most five iterations and compares the loop with Best-of-5 under the same computation budget. Best-of-5 samples a fresh candidate each time. The discovery loop retains the previous hypothesis and diagnostics. In the main animation-engine experiment, the fifth iteration improves Visual Alignment, Object IoU, Traj-ADE, and Accuracy@2%D, but does not outperform Best-of-5 on Velocity-ADE. When the appendix switches to a physics engine, the fifth iteration outperforms Best-of-5 on all five metrics.

This supports a limited but useful conclusion. Local revisions informed by diagnostics are more effective than five unrelated guesses. The experiment does not establish that the system has found a unique physical mechanism. The simulator and verifier already define the search space, within which the agent adjusts objects, parameters, and constraints. The loop finds a world that explains the current evidence. When evidence is insufficient, several worlds can still remain plausible.

## Verification inherits the ambiguity of observation

The verifier compares semantics, RGB, depth, masks, and trajectories. The report also uses independent metrics to assess the final result, reducing the risk that discovery simply optimizes for one score. This matters because a system can learn to exploit a fixed verifier.

Verification does not remove non-identifiability. A parabolic path in a short video may be explained by several combinations of gravity, initial velocity, object scale, and camera parameters. Errors in depth estimation and collision parameters can compensate for each other. A candidate EWR that reproduces the observations has, for the moment, survived the available evidence.

Simulator mismatch introduces a different kind of error. Real contact depends on small variations in geometry, materials, and the ground. If an engine cannot model flexibility, fracture, or complex friction, the agent may fit an approximately correct trajectory using incorrect parameters. Visual agreement can coexist with an inaccurate mechanism. The technical report identifies this as an explicit limitation.

I would therefore treat the output as a world hypothesis, with no guarantee that it is the true world. A mature system should preserve alternative candidates, parameter uncertainty, and unresolved variables. As new observations arrive, it could choose a viewpoint or action that best distinguishes the remaining possibilities. Verification would then extend from passive comparison to active system identification.

## Turning world code into supervision for physical reasoning

The empirical claim of Code-as-World is quite restrained. The researchers do not ask the VLM to generate EWR at test time or call a simulator online. Verified worlds are first used to construct training data, from which the model learns quantitative physical question answering.

Training has two stages. The first develops image-space measurement. The RefCOCO family and RefCLEF provide object descriptions and bounding boxes, while GOT-10K provides dense trajectories. The system converts these annotations into questions about width, position, displacement, velocity, and acceleration. This yields 73,335 question-answer pairs, of which 46,763 come from GOT-10K. The model first learns to locate the correct object, read pixel-scale quantities, and maintain correspondence across frames.

The second stage develops world-space calibration. Verified EWR provides video, object scale, and complete state trajectories together. Dimensions can be read from geometry, while displacement, velocity, and acceleration can be computed from trajectories. World-space supervision consists of 1,585 text-driven samples and 988 video-driven samples, for a total of 2,573.

Converting pixel measurements into real-world units depends on scale calibration. Let <code>ρ</code> be a reference object's real-world quantity, <code>ρ_pix</code> its image measurement, and <code>y_pix</code> the target's image measurement. The conversion is as follows.

<div class="equation" role="math" aria-label="Conversion between real-world scale and pixel scale"><span>γ = ρ / ρₚᵢₓ</span><span>y = γ · yₚᵢₓ</span></div>

The formula is short, but applying it still asks a great deal of the model. It must find the correct reference and target, identify the requested time, track motion, handle perspective and depth, and use the right units. The conversion also depends on the reference quantity supplied by the benchmark and the relevant projection conditions. It is not a general solution for recovering absolute scale from arbitrary monocular video. The first stage teaches measurement and the second teaches calibration. Without either, the final number loses its basis.

Generation has two clear uses in this training setup. Simulation produces state trajectories with precise labels. A video generator then turns the simulated process into observations closer to the real distribution. EWR and the simulator still determine the state labels; the appearance model handles materials, backgrounds, and lighting. The report's sim-to-real metrics show that generated videos are closer to real videos under JEDi and TRAJAN. Several motion-fidelity metrics remain broadly similar to simulated rendering, though Velocity-ADE and Accuracy@2%D deteriorate slightly. Appearance transfer helps, while introducing measurable deviations.

## What the results establish

QuantiPhy asks models to estimate object dimensions, displacement, velocity, and acceleration from monocular video. Evaluation scores predictions at ten relative-error thresholds, macro-averages across four subsets, and multiplies the result by one hundred for presentation. A score of 55.4 does not mean that 55.4% of the questions were answered correctly. The main results in the technical report are nevertheless striking.

<figure>
  <a href="/images/blog/code-as-world/quantiphy-selected-results.png" target="_blank" rel="noreferrer"><img src="/images/blog/code-as-world/quantiphy-selected-results.png" alt="Mean MRA comparison between Code-as-World-VL and other models on QuantiPhy validation" width="1786" height="1052" loading="lazy" decoding="async" /></a>
  <figcaption>Figure 7. Selected mean MRA results on QuantiPhy validation. Purple denotes Code-as-World-VL, blue open-weight baselines, and gray proprietary baselines. Redrawn from Table 1 of the technical report.</figcaption>
</figure>

The 4B model scores 50.6 and the 9B model 55.4. Under this protocol, the direct-answer 9B version exceeds the 54.8 reported for Gemini 3.1 Flash. The 27B reasoning variant reaches 58.6. However, the 27B variant changes both model size and the response protocol. The paper explicitly cautions that 58.6 demonstrates scalability to a larger reasoning model; it cannot isolate the benefit of reasoning traces.

The data ablation gives a clearer account of what world-space supervision contributes.

| Training data | 4B mean MRA | 9B mean MRA |
| --- | --- | --- |
| Image-space only | 44.2 | 50.9 |
| Add text-driven worlds | 48.5 | 52.5 |
| Add video-driven worlds | 47.8 | 53.1 |
| Combine all three sources | 50.6 | 55.4 |

Each type of world data helps on its own, and combining them produces the best result. Text-driven worlds supply clean, precise physical states. Video-driven worlds retain the appearance and motion distributions of real observations. Both complement image-space grounding. One reporting discrepancy deserves attention. Appendix Table 4, the main results table, and the project page all give 55.4 for the full 9B model, while the text below the table says 56.8. I use 55.4 here, the value shared by the three consistent sources.

These numbers support verified executable worlds as a useful source of quantitative supervision. They do not yet show that a VLM has learned to construct or maintain world code. At test time, the 4B, 9B, and 27B models receive only video frames, questions, and the physical priors supplied by the benchmark. They do not see the EWR used to generate training examples or run the discovery loop.

The scope of evaluation also limits the conclusion. QuantiPhy validation contains 159 question-answer pairs and primarily tests monocular scale calibration under controlled motion. The main results do not cover complex contact, rotation, deformation, occlusion, fluids, or long-duration multi-object dynamics. A relatively small set of world-space data, closely aligned with the training objective, delivers a substantial gain. That is encouraging, but generalization still needs to be tested on more benchmarks and out-of-distribution settings.

## Code, language, latents, and simulators all have a role

Reading Code-as-World as a purely symbolic approach misses one of its most practical features. Latents remain essential, and code does not have to carry perception and generation by itself. The system divides the work.

| Component | Role in the system |
| --- | --- |
| Latent representations | Preserve visual details that are difficult to name; supply perceptual priors and similarity |
| Natural language | Connect object semantics, common sense, qualitative causality, and human instructions |
| Code | Preserve named states, units, constraints, and parameters that can be changed through intervention |
| Simulator | Advance continuous states under specified mechanisms and produce trajectories |
| Renderer and generative models | Convert states into observable evidence and rich appearance |
| Verifier | Compare predictions with the input and turn discrepancies into revision signals |

This division brings world state out of the model's internal representation and into a shared interface. An agent can change mass or a camera; the simulator can execute the change; and the verifier knows which consequences to compare. At the same time, the schema determines which problems the system can represent. If it contains no material fatigue, flexible deformation, or human intentions, a few extra rounds of reasoning are unlikely to supply those missing factors.

A plausible longer-term design would maintain a hybrid world state. Its explicit component would preserve objects, relationships, units, and known constraints. Its latent component would handle appearance, complex contact, and residual effects that cannot yet be named. The system would also need to decide which class of simulator to call and when to acknowledge that its available engines cannot explain the evidence. Code provides clear points for intervention, while latents preserve broader coverage of the open world. The two need ongoing calibration.

## The distance from Code-as-World to Physical RSI

MirroS places Code-as-World within a longer research agenda called Physical RSI. In that agenda, an agent encounters something unexpected in the real world, distinguishes a gap in its world model from a gap in its ability to act, abstracts the unexplained event into a reproducible environment, finds a response, and returns to reality to test and internalize the experience.

Code-as-World implements one local part of that process. Within a single example, it proposes, executes, compares, and revises hypotheses. Physical RSI additionally requires knowledge to persist across experiences, so that a revision changes how the system understands the next situation and the actor and world model help improve each other. Continual internalization, transfer across scenes, and regression testing back in the real world do not appear in the current experiments.

The difference in scale matters. In the paper, “evolve” refers to at most five rounds of hypothesis refinement for one example. Physical RSI concerns long-term learning, where a system must handle a stream of out-of-distribution events, extend its representational language and skills, and keep new knowledge from damaging old abilities. Calling the first process self-evolving intelligence would blur the distinction between completed experiments and a research ambition.

From the perspective of streaming-video research, I am more interested in whether EWR could serve as a bounded long-term state. Raw frames keep accumulating, visual tokens grow with time, and language summaries often lose geometry and metric information. An online system could preserve its current world hypothesis and update only the relevant objects and parameters as new evidence arrives.

<div class="equation" role="math" aria-label="Update the world representation as streaming evidence arrives, then predict the next state from the current state"><span>pₜ = UpdateEWR(pₜ₋₁, evidenceₜ, diagnosticₜ)</span><span>sₜ₊₁ = Simulate(pₜ, sₜ, actionₜ)</span></div>

That proposal raises difficult questions. When new evidence conflicts with the old hypothesis, the system has to decide whether to adjust parameters, add an object, or replace the physical mechanism. Online computation is also constrained by time; it cannot run all five discovery iterations for every new piece of video. If EWR is to serve as long-term state, it should reduce recomputation under a protocol that forbids access to future observations. It should also outperform token memory under the same budget when objects reappear, when causal relationships span long intervals, and when a query requires a numerical answer. These are questions that can be tested directly.

## Experiments that would make this approach more convincing

One set of experiments should address multiple solutions. The system could produce several EWRs still supported by the evidence, assigning confidence to parameter distributions and candidate structures. A new viewpoint or action should narrow that set appropriately. Even an excellent fit from a single point estimate says little about whether uncertainty is reliable.

A second set should let action participate in discovery. Passive video contains actions somebody else has already taken. An embodied agent can move the camera, nudge an object, change its support conditions, and choose the experiment that best distinguishes candidate mechanisms. EWR already provides an interface for intervention. Active perception could test whether that interface is actually useful for system identification.

A third set should confront simulator misspecification. The system should recognize phenomena its current engine class cannot cover, retain explicit conservation laws and geometric constraints, and use learned residual dynamics to fit the unmodeled component. If every mismatch is absorbed by adjusting an incorrect parameter, the world code will increasingly resemble an overfit to a single video.

A fourth set should investigate internalizing discovery in the model. A model could predict EWR patches directly, choose verification tools, and use execution feedback to modify local state. Evaluation should separately measure the proportion of runnable outputs, mechanism correctness, extrapolation under intervention, and reuse across scenes. A correct final answer tests only the last step of this process.

## Where I land

The most valuable contribution of Code-as-World is to make physical understanding executable. A candidate world produces a trajectory, the trajectory produces observations, and discrepancies in those observations inform the next revision. There are now identifiable points at which an attempted understanding can fail.

The limitations make the next experiments more concrete. An intelligent system that accumulates physical experience in an open world needs a world state that new evidence can revise. Code offers one explicit form for that state. A simulator gives it consequences, and a verifier lets observations from reality constrain it. Code-as-World has shown that this sequence can produce useful supervision. Whether it can also become a world representation that a model actively maintains at inference time remains a question for broader physical phenomena, stronger intervention experiments, and long-term state updates.
