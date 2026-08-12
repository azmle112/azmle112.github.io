---
title: "Capability Beyond the Model: Notes on Harness Engineering for Self-Improvement"
description: "Why can the same model behave like different models in different systems? These notes follow context, tools, state, evaluation, and rollback to examine near-term recursive self-improvement."
pubDate: 2026-08-10
updatedDate: 2026-08-12
readingTime: "14 min"
tags: ["Agent", "Harness", "Test-time Scaling"]
lang: "en"
translationKey: "harness-engineering"
featured: true
draft: false
sources:
  - label: "Lilian Weng, Harness Engineering for Self-Improvement"
    url: "https://lilianweng.github.io/posts/2026-07-04-harness/"
  - label: "Can Agents Benefit from Their Own Harness Updates?"
    url: "https://arxiv.org/abs/2605.30621"
  - label: "Self-Harness"
    url: "https://arxiv.org/abs/2606.09498"
  - label: "Darwin Gödel Machine"
    url: "https://arxiv.org/abs/2505.22954"
  - label: "AlphaEvolve"
    url: "https://arxiv.org/abs/2506.13131"
---

The same foundation model can feel like three different models when placed in a bare chat window, a coding agent, and a research system with an evaluation loop. Prompting explains only part of the gap. Context assembly, tool access, persistent state, failure recovery, and acceptance tests have become part of the capability itself.

Lilian Weng calls this surrounding structure a harness. It orchestrates reasoning and tool use, but also manages files, logs, long-running processes, tests, permissions, and handoffs. Treating it as a long system prompt misses most of the engineering.

Her post is about self-improvement. My main takeaway is narrower: near-term recursive improvement often occurs outside the weights. A system edits its context, workflow, or tools, then uses evaluation to decide whether the edit survives.

## What belongs in a harness

An autonomous agent has to cycle through planning, execution, observation, and revision. A short task can keep its state in the conversation. A task spanning dozens of tool calls or several hours cannot.

A mature harness typically does several jobs:

- orchestrates planning, tool calls, and environment interaction;
- decides what enters the current context;
- stores logs, patches, metrics, and intermediate artifacts;
- starts, observes, and cancels background work;
- runs tests and regressions while preserving failures;
- limits what the agent may edit and escalates when necessary.

Together, these functions resemble a runtime or operating system. The harness does not think instead of the model. It controls what thought can inspect, what traces it leaves, and what counts as success.

## Files as durable memory

Long context can hold more material, but it does not solve every memory problem. Information can still be truncated, compressed, or lose influence over a long trajectory. Files add inspectability, comparison, version control, and recovery.

An experiment directory can preserve source code, scores, trajectories, and status. The next agent does not have to trust a compressed summary from the previous run. It can reopen the original evidence. A human can also ask where a claim came from.

This changes how I think about agent memory. Durable memory is often an accountable external state rather than the longest possible prompt. Summaries provide navigation; raw evidence provides recourse.

## The optimization target keeps moving outward

Early prompt optimization changed an instruction. Later systems optimize a structured context, a workflow, and eventually the harness code itself.

| Work | What changes | Mechanism | Important limit |
| --- | --- | --- | --- |
| ACE | Context playbook | Generator, Reflector, and Curator update entries | Deterministic merges reduce over-compression |
| MCE | Context and its management method | The context function also exists as files | Learns both content selection and management |
| Meta-Harness | Code for retrieving and presenting context | Candidates keep source, score, trajectory, and state | Turns context engineering into testable software search |
| ADAS / AFlow | Agent workflow | Represents workflows as code or graphs and searches them | Gains come from process search, not smarter weights |
| STOP | The improver program | The improver edits itself before evaluation | Weaker models can regress |
| Self-Harness / AHE | Complete harness | Proposes bounded edits from failures, then runs regressions | The evaluator and permissions must remain outside the edit boundary |
| DGM / AlphaEvolve | Program or agent repository | Models produce code edits; evaluators select descendants | Works best with clear, quickly scored objectives |

This is a software-shaped form of self-improvement. The system can propose a small edit, test it, compare old and new behavior, and merge only if the evidence holds. The change stays reversible and its effect is easier to isolate.

## Producing an update is not using it well

[Can Agents Benefit from Their Own Harness Updates?](https://arxiv.org/abs/2605.30621) separates two abilities. Harness-updating asks whether an agent can propose a plausible modification. Harness-benefit asks whether later runs can actually exploit it.

The first scales relatively smoothly with model size. The second is non-monotonic. Generating a tool description, configuration, or code diff is easier than remembering to use it at the right point fifty steps later. The model must retain the constraint and turn it into stable task-level gains.

An automatically generated diff is therefore weak evidence of improvement. The loop also requires understanding, long-horizon execution, and dependable evaluation.

## The evaluator is the narrowest bottleneck

Code, math, and repeatable experiments are relatively easy to score. Tests pass or fail. An objective improves or does not. Open-ended scientific work has ambiguous, delayed feedback that is easier to exploit.

The risks are practical: benchmark overfitting, reward hacking, numerical patches presented as explanations, shrinking exploration diversity, and negative results disappearing from memory. A short sandbox score also says little about maintainability or long-term success.

If the system may edit the evaluator, it can improve the score by changing the ruler. An immutable permission boundary is not an optional safety layer. It is a condition for the experiment to mean anything.

The pace of self-improvement depends on how fast a model generates candidates and how fast we can establish that a change is genuinely better.

## What this suggests for test-time scaling

Extra reasoning tokens are only a budget. A harness determines whether they produce diverse hypotheses, inspectable evidence, correction after failure, and a sensible stopping rule. Without that structure, test-time scaling can become longer self-talk.

I care about four variables: candidate diversity, external evidence, verifier quality, and stop or rollback policy. Generation can help by proposing counterexamples, observations, or competing explanations. It becomes useful when those candidates enter a loop with evidence and rejection.

## What this suggests for streaming video thought

A continuous video stream cannot keep every frame forever. The system has to choose what to retain, compress, and reopen.

A plausible state is hierarchical. Short-term memory keeps local frames and actions. These become event-level summaries with pointers to original evidence. When new information conflicts with an old summary, the model reopens the relevant segment. Temporal claims require dedicated checks for onset, duration, order, and causality.

This resembles the memory lifecycle in a harness. Context length is capacity. Updating, forgetting, retrieval, and evidence review create durable state.

## Where I land

I now understand near-term recursive self-improvement as a verifiable software loop. The model proposes an edit. The harness preserves experience and runs experiments. An evaluator decides whether to accept it. People define the boundary that cannot be edited.

The “self” is distributed across the system. It does not live only in the model parameters.
