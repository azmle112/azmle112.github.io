---
title: "Capability Beyond the Model, Rereading Harness Engineering for Self-Improvement"
description: "Why does the same foundation model behave so differently across agent systems? This long-form essay follows execution loops, context, durable state, tools, evaluation, and rollback through ACE, MCE, Meta-Harness, ADAS, AFlow, STOP, and Self-Harness."
pubDate: 2026-08-10
updatedDate: 2026-08-19
readingTime: "55 min"
tags: ["Agent", "Harness", "Agent Engineering"]
lang: "en"
translationKey: "harness-engineering"
tocDepth: "chapters"
featured: true
draft: false
sources:
  - label: "Lilian Weng, Harness Engineering for Self-Improvement"
    url: "https://lilianweng.github.io/posts/2026-07-04-harness/"
  - label: "Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models"
    url: "https://arxiv.org/abs/2510.04618"
  - label: "Meta Context Engineering via Agentic Skill Evolution"
    url: "https://arxiv.org/abs/2601.21557"
  - label: "Meta-Harness: End-to-End Optimization of Model Harnesses"
    url: "https://arxiv.org/abs/2603.28052"
  - label: "Automated Design of Agentic Systems"
    url: "https://arxiv.org/abs/2408.08435"
  - label: "AFlow: Automating Agentic Workflow Generation"
    url: "https://arxiv.org/abs/2410.10762"
  - label: "Self-Taught Optimizer (STOP): Recursively Self-Improving Code Generation"
    url: "https://arxiv.org/abs/2310.02304"
  - label: "Harness Updating Is Not Harness Benefit"
    url: "https://arxiv.org/abs/2605.30621"
  - label: "Self-Harness"
    url: "https://arxiv.org/abs/2606.09498"
---

The first thing that stopped me in Lilian Weng's *Harness Engineering for Self-Improvement* was a mundane observation. Put the same foundation model in a chat box, a coding agent, and a research system with a closed experimental loop, and it can feel like three different models. The chat model answers from the messages in front of it. The coding agent can search files, edit code, run tests, and recover from errors. The research system can also preserve experiment state, compare several directions, and hand failed trials to the next round. The weights remain unchanged while the set of achievable tasks changes dramatically.

It is tempting to call the difference prompting. Prompts matter, yet real systems quickly run past the boundary of a piece of text. A tool has been running for ten minutes and times out. Which component retains the process handle and decides what happens next? The context is full of logs. Which evidence stays visible? The model says the task is complete. Which mechanism opens the artifact, runs the test, and reads the external system? A change helps the current example and damages an older task. Can the system return to the last stable version? These decisions happen around the model, and each one changes practical capability.

Weng uses *harness* for this surrounding layer. The word is useful because it includes more than an agent loop or a long system prompt. A harness connects the model to a task, an environment, and evidence. It owns context assembly, tools, permissions, durable state, stopping rules, evaluation, and recovery. Different papers draw the boundary in different places, but the engineering questions remain concrete.

I reread the essay alongside the primary papers it discusses or points toward. [ACE](https://arxiv.org/abs/2510.04618), [MCE](https://arxiv.org/abs/2601.21557), [Meta-Harness](https://arxiv.org/abs/2603.28052), [ADAS](https://arxiv.org/abs/2408.08435), [AFlow](https://arxiv.org/abs/2410.10762), [STOP](https://arxiv.org/abs/2310.02304), [Harness Updating Is Not Harness Benefit](https://arxiv.org/abs/2605.30621), and [Self-Harness](https://arxiv.org/abs/2606.09498) optimize different objects. Read together, they reveal a stable pattern. A model can generate candidate changes. The system still has to record where a candidate came from, decide what evidence would support it, test it outside the examples that inspired it, and return to a known version when it fails. That pattern is the center of this essay.

## Chapter 1　A harness manages what happens beyond one answer

A model call has a tidy input and output. An agent task rarely does. After a user states a goal, the system may need to locate evidence and call a tool. The tool changes the environment and returns a new observation. The model decides the next action from that observation. A long task can involve dozens of calls, with files, terminal processes, browser pages, test reports, and human approvals appearing along the way. The final answer is only the last artifact in a much larger execution.

Early descriptions of agents often listed a model, memory, tools, planning, and action. Those categories are still useful. Harness engineering moves attention toward runtime details. It asks how a loop begins and ends, how tool results enter the next call, which state survives a process restart, where permissions are enforced, and which test blocks a false claim of completion. A principle written in a system prompt becomes system capability only when the runtime can uphold it.

<figure class="concept-figure harness-loop-figure">
  <div class="concept-flow harness-loop">
    <div class="concept-step"><span class="concept-index">01</span><strong>Task</strong><small>Goal, constraints, and acceptance criteria</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><span class="concept-index">02</span><strong>Context assembly</strong><small>Select evidence, state, and available skills</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><span class="concept-index">03</span><strong>Model decision</strong><small>Propose an action or candidate answer</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><span class="concept-index">04</span><strong>Tools and environment</strong><small>Execute and produce a new observation</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step concept-step-accent"><span class="concept-index">05</span><strong>Validation and writeback</strong><small>Check, update state, or revert</small></div>
  </div>
  <figcaption>Figure 1. A harness turns individual model calls into an executable and inspectable loop.</figcaption>
</figure>

The last step in the figure is easy to omit. A model proposes an action and an environment produces a consequence. Neither tells us whether the user's goal has been met. A command returning exit code zero only proves that the process exited normally. It does not prove that the file contains the right content, that a page is publicly reachable, or that the change preserved old behavior. A harness translates acceptance criteria into evidence that can actually be checked.

The following layers often collapse into one another in casual discussion. Separating them makes failures easier to locate.

| Layer | What it directly changes | Common examples | What it cannot guarantee alone |
| --- | --- | --- | --- |
| Prompt | Text instructions in the current call | Role, format, procedural reminders | Durable state and external execution results |
| Context engineering | Information visible to each call | Retrieved passages, examples, summarized history | Tool permissions and loop control |
| Workflow | Connections among several calls | Planning, execution, reflection, voting | Quality of durable state and rollback |
| Harness | The running system around the model | Tools, state, permissions, evaluation, recovery | Domain knowledge absent from the base model |

There is no universal harness boundary. Papers and products use *scaffold*, *agent framework*, *context engineering*, and *runtime* for adjacent ideas. A broad name is harmless as long as the implementation remains precise. If a mechanism changes what the model sees, what it may do, how execution continues, or what counts as success, it changes the agent's effective capability.

## Chapter 2　The execution loop determines how far a model can go

Coding agents offer the clearest example. A basic loop reads the task, searches the repository, opens relevant files, proposes a patch, and runs tests. When a test fails, the error output becomes the next observation and the model continues debugging. The loop stops after validation succeeds, the budget is exhausted, or a decision requires a person.

That description sounds ordinary. Small interface choices still change the outcome repeatedly. Regex support and file filters affect whether the agent locates evidence before its context fills. Patch-based editing limits accidental changes compared with whole-file replacement. A terminal interface that returns a process handle lets the agent manage long-running work. A harness that restates unfinished acceptance criteria at phase boundaries helps the model retain the task across a long context.

Stopping needs explicit semantics. Language models are good at producing a polished conclusion, including when the evidence is incomplete. A harness can require tests, a clean inspection of the working tree, a rendered artifact, or the terminal state of an external job before it allows completion. Completion then becomes a guarded state transition instead of a sentence generated by the model.

A practical loop has at least five states. Preparation loads the task and current permissions. Execution calls tools. Observation parses the result. Revision chooses whether to continue, change direction, or restore an earlier state. Completion collects evidence for delivery. Production systems add waiting, approval, recovery, and cancellation branches. If those branches are represented only as free-form text, exceptions are easily swallowed as ordinary observations.

Loop behavior also exposes differences between models. One model repeats the same command after a tool failure. Another searches indefinitely and delays implementation. A third changes files and forgets the requested artifact. The Self-Harness experiments mine exactly these recurring patterns. The resulting harness changes add dependency checks, artifact verification, retry discipline, tool error recovery, and environment preservation. A universal instruction cannot anticipate every model's stable failure pattern. Execution traces show where the current model repeatedly loses control.

Workflow topology matters too. Sequential workflows fit tasks with stable dependencies, where one output becomes the next input. Routing workflows classify the task and select a specialized tool or skill. Parallel workflows let independent workers inspect different evidence sources before a coordinator merges the results. Feedback workflows send an artifact between a generator and a checker until an executable condition is met.

No topology wins everywhere. Parallel calls cost more and can return incompatible conclusions. A feedback loop without a round limit or exit rule can rewrite the same passage forever. One routing mistake prevents every later tool from being useful. Each edge needs a defined meaning. The code and trace should reveal where the input came from, which component owns the state, where failure returns, and what the system delivers when the budget ends.

Long tasks also have partial success. One worker may finish a source audit while another waits for an external job. The whole task is not complete, but the finished work should not disappear. A recoverable loop stores each subtask state and artifact. The parent advances only when dependencies are satisfied. After interruption, it resumes from the latest verified node instead of asking the model to reconstruct progress from a conversation.

## Chapter 3　Context has a lifecycle; a message list does not

A short task can keep its history in messages. That approach degrades quickly in long work. Tool output grows, logs repeat, and early constraints lose influence. Blind truncation removes requirements. A single summary removes diagnostic detail. Keeping every token crowds out the evidence needed for the current decision.

State management begins with a temporal question. When will this information be needed again? Raw output from a command may matter for the next two calls. A user constraint may remain binding for the entire task. A failed trajectory does not need to enter every prompt, but it should remain available in an indexed artifact. A passing test result should be attached to the exact code revision it evaluated, or a later agent may use stale evidence for a new change.

<figure class="concept-figure state-lifecycle-figure">
  <div class="concept-stack state-stack">
    <div class="concept-layer layer-hot"><span>Hot state</span><strong>Current goal, next action, latest observation</strong><small>Loaded directly into the next model call</small></div>
    <div class="concept-layer layer-warm"><span>Working state</span><strong>Plan, decisions, open items, known constraints</strong><small>Loaded selectively for the current phase</small></div>
    <div class="concept-layer layer-cold"><span>Durable state</span><strong>Source, full traces, test reports, version history</strong><small>Stored outside context and retrieved when needed</small></div>
    <div class="concept-layer layer-gate"><span>Writeback gate</span><strong>Source, version, and validity travel with the state</strong><small>Stops old conclusions from silently surviving a new environment</small></div>
  </div>
  <figcaption>Figure 2. State is layered by distance of use, while provenance and version are saved at writeback.</figcaption>
</figure>

The file system is attractive here. It holds far more material than one context window, supports search and partial reads, and works naturally with version control. Weng describes files as a common form of persistent memory. Meta-Harness pushes the pattern further. Its optimizer can inspect every candidate harness, score, and execution trace, then decide which files matter for the current hypothesis.

Files alone do not create good memory. Inconsistent names, missing provenance, and concurrent writes can make a directory less reliable than a short prompt. Useful state usually answers four questions. What does this record assert? Which execution produced it? Which version does it describe? Under what conditions does it expire? A multi-agent system also needs ownership and merge rules.

| State class | Typical contents | Suitable location | Common failure |
| --- | --- | --- | --- |
| Session state | Current goal and latest tool result | Messages and short-lived cache | Disappears after context truncation |
| Task state | Plan, checklist, blockers | Structured file or task store | Concurrent writers overwrite one another |
| Evidence state | Raw logs, screenshots, test reports | Versioned artifact directory | Drifts away from the code it evaluated |
| Procedural state | Skills, runbooks, recovery rules | Searchable skill files | Grows while never being activated |
| Organizational state | Permission, ownership, approval | External control plane | Old authority is mistaken for current authority |

This is the territory explored by ACE and MCE. Both treat context as an evolving object. Incremental learning must preserve useful detail and also prevent indefinite growth. A longer window increases the amount of material available. A lifecycle determines which material remains trustworthy.

Context assembly usually includes selection, ranking, and compression. Selection decides which records are eligible. Ranking decides what the model sees first. Compression determines the retained granularity. The right ordering depends on the task. For a concrete error, the latest failure and nearby source code matter more than a project overview. For an architecture decision, historical constraints and reasons earlier approaches failed may need to appear first.

A retrieval score cannot stand in for provenance. A semantically similar passage may be stale or may come from a failed experiment. A reliable context record carries a timestamp, version, task scope, and pointer to evidence. The assembler should also log what it selected. When the task fails, a maintainer can then distinguish a reasoning error from a retrieval omission.

Summaries need pointers back to their sources. A summary can tell the model that an event occurred. When the details determine the next action, the agent should reopen the original artifact. Treating a summary as raw evidence copies any mistaken compression into future rounds. Meta-Harness's ablations make this problem concrete. A neat fixed summary did not preserve the diagnostic clues that became important later.

State also needs garbage collection. Ten generations of a similar rule can lead retrieval to return contradictory advice. A system can merge duplicates, mark outdated records as archival, and rerun important lessons under current model and tool versions. Deletion should leave a tombstone or change record. When behavior shifts later, investigators need to know which memory left the active set and when.

## Chapter 4　Tool interfaces amplify small differences

Tools are how a model touches the outside world. A tool definition normally includes a name, description, parameter schema, and result structure. The model has to decide when to call it, fill the arguments correctly, and interpret the returned state. Ambiguity at any step charges the system again on every loop.

File search offers a simple example. A generic shell is flexible, but it exposes quoting rules, platform differences, and unbounded output. A structured search tool validates arguments and can constrain directories or result counts. Its designer must anticipate common operations. Mature harnesses often keep both specialized tools and a controlled shell. Frequent actions become dependable while unusual tasks retain an escape hatch.

Return values matter as much as arguments. A natural-language error saying something “seems unsuccessful” is difficult to automate. A structured result can separate exit status, standard output, standard error, timeout, and a process that is still running. A browser tool should distinguish a page load, a visible element, a dispatched click, and a confirmed server-side change. Every observation should stay as close to the environment fact as the interface allows.

Permissions cannot live only in a prompt. File deletion, publication, email, and production configuration create real consequences. A harness can classify actions as read-only, reversible writes, external writes requiring approval, and high-risk operations. Enforcement belongs at the tool boundary. The model proposes an action, the runtime checks its scope against current authority, and the audit record stays attached to the operation.

Subagents and background work expand parallel capacity while introducing more state. A parent needs to specify the task boundary, input material, and return format. It still has to validate that the result can be merged. A background process needs a handle, polling semantics, and cancellation. Delegation without a later observation leaves the harness unable to say what happened.

Tool descriptions should state preconditions and failure semantics. An upload tool can verify that its input file exists before making a remote request. A query may return an empty set, a permission denial, or a network timeout, and each outcome calls for a different recovery. A single prose string forces the model to infer the category. Error codes, retryable flags, and correlation identifiers let recovery live in code.

Idempotency determines whether automatic retry is safe. Reading a file twice usually changes nothing. Sending a message twice gives the recipient two copies. A harness should know which operations may be repeated and which require an external state check first. Idempotency keys, previews, and post-action confirmation reduce duplicate writes after a timeout.

Tool output may contain hostile instructions. Pages, issue threads, and user-supplied documents can ask the model to abandon its rules. The harness needs a boundary between system instructions and untrusted data. High-risk tools should sit behind independent permission checks. Convincing text from an external source cannot enlarge actual authorization.

Multi-agent merging also needs a contract. A worker should return its conclusion, evidence, unresolved items, and modification scope. The parent must be able to follow the answer back to raw material. When two workers edit files concurrently, isolated workspaces or serialized merging prevent silent overwrite. Parallel execution saves time only if the harness can reconcile its results.

## Chapter 5　Observability turns failure into usable material

The final answer rarely explains an agent failure. The model may have opened the wrong file ten turns earlier, misunderstood a malformed tool result, and continued from a false premise. A final score says that the run failed. A trace gives the failure a location.

A useful trace records the context assembled for that step, the tool call, the environmental response, state writes, validation results, and the stopping reason. Sensitive information still needs redaction, and large payloads should live outside the immediate log. The trace must preserve enough identifiers to connect an error to its inputs and code version.

<figure class="concept-figure observability-figure">
  <div class="concept-grid trace-grid">
    <div class="concept-card"><span>Input</span><strong>Task and constraint version</strong><small>What the model received at that moment</small></div>
    <div class="concept-card"><span>Action</span><strong>Call, arguments, and duration</strong><small>What the system actually executed</small></div>
    <div class="concept-card"><span>Observation</span><strong>Raw and parsed result</strong><small>Where facts first diverged</small></div>
    <div class="concept-card"><span>State</span><strong>Reads, writes, and provenance</strong><small>How old information reached later calls</small></div>
    <div class="concept-card"><span>Validation</span><strong>Assertions, scores, failures</strong><small>Whether acceptance criteria were met</small></div>
    <div class="concept-card concept-card-accent"><span>Attribution</span><strong>Reproducible failure pattern</strong><small>Where the next change should land</small></div>
  </div>
  <figcaption>Figure 3. A trace decomposes final failure into input, action, observation, state, and validation.</figcaption>
</figure>

Observability does not mean storing every token forever. The system should begin with the debugging question. Diagnosing runaway retry needs action class, error class, retry count, and stopping reason. Diagnosing retrieval needs the query, candidates, selected records, and downstream result. A log earns its cost by supporting attribution.

Self-Harness's Weakness Mining stage offers a concrete method. It runs the current harness on held-in tasks, collects failures with validator evidence, and groups recurring patterns. The proposer sees behaviors that repeatedly fail and behaviors that should remain intact. Candidate changes can then target missing artifacts, ineffective retries, dependency checks, or state recovery.

Meta-Harness works at another scale. One candidate evaluation can generate roughly ten million diagnostic tokens. A fixed-length summary cannot know in advance what the next proposer will need. Meta-Harness stores history in a file system and lets a coding agent search source and raw traces under its current hypothesis. In its most complex setting, the proposer reads a median of 82 files per iteration and consults more than twenty previous candidates. Selective reading creates the usable context while complete history remains available.

Trace design should support replay. Model sampling and external services make exact reproduction difficult. A system can still record model identity, decoding settings, tool versions, input snapshots, environment images, and random seeds. Uncontrolled external state should include a read time and response digest. Investigators can then judge whether behavior changed because of the candidate harness or because the environment moved.

Failure-only datasets are dangerous. A rule may prevent one error while slowing previously successful tasks. A proposer needs passing examples to identify behavior worth preserving. Self-Harness includes passing behaviors in a bounded proposal context. Meta-Harness lets the coding proposer compare many candidate histories. Both protect old capability through evidence, though they expose that evidence through different interfaces.

Observability eventually has to fit routine debugging. No team can manually inspect every long trajectory. A harness can first aggregate tool errors, missing artifacts, failed validators, permission blocks, and no-progress loops. Maintainers inspect representative runs while retaining access to the original traces. Automatic grouping provides an entrance, not a verdict.

## Chapter 6　The evaluator decides what the system learns

A harness can generate many candidates and let a search run for a long time. The evaluator determines its direction. Unit tests reward programs that pass those tests. A benchmark rewards strategies that fit its cases. A model judge rewards responses that match its preferences. Anything absent from the metric receives no pressure, and any loophole can become a search target.

An evaluator serves at least three roles. It decides whether a task run succeeded, compares candidate harnesses, and gates promotion into the next stable version. These roles may share evidence, but their thresholds differ. An exploratory trial can be useful after revealing a direction. A release candidate needs a much broader regression record.

| Evaluation layer | Question | Suitable evidence | Main risk |
| --- | --- | --- | --- |
| Outcome check | Does the requested artifact exist and work? | Unit tests, schema validation, external state reads | Format passes while meaning is wrong |
| Process check | Did the agent obey permissions and boundaries? | Tool audit, policy assertions, approvals | A correct result hides a dangerous path |
| Regression check | Did the new harness damage old capability? | Fixed regressions, held-out tasks, repeated runs | Search overfits the development set |
| Cost check | Is the gain worth the resources? | Tokens, latency, calls, recovery cost | A small gain requires an unusable budget |
| Long-term check | Does the change add maintenance debt? | Readability review, ownership, production monitoring | Short benchmarks miss later cost |

Randomness complicates comparison. A run can pass once and fail the next time. When candidates are close, one score does not establish improvement. Repeated trials, confidence intervals, and paired task results reduce false conclusions. Under a limited budget, a small smoke set can remove broken candidates before the full regression suite runs.

The proposal process must stay separate from the promotion set. Self-Harness gives held-in traces to the proposer and protects generalization with held-out tasks. Its acceptance rule requires no regression on either split and an improvement on at least one. The rule is conservative, which suits a process that edits future runtime behavior. Ideas are cheap. A bad release changes every later task.

Research tasks are especially hard to score. Compilation, exact mathematical answers, and external tool state provide relatively clear checks. The value of a research question, the quality of an explanation, and its long-term influence resist a single number. Weng raises scientific taste, negative results, reward hacking, and long-horizon success. A system can execute an experiment correctly while asking an unimportant question.

Evaluation protocols should be fixed before search whenever possible. Changing tasks, thresholds, or scoring after a candidate appears makes normal variation look like progress. When the evaluator itself proves defective, it needs a new version. The baseline and candidates should then be rerun under the new protocol. Old and new scores cannot be placed on one curve without qualification.

Leakage also corrupts search. Once the proposer sees held-out traces, the gate no longer measures generalization. Shared memory creates a subtler path. An answer from one evaluation can enter global state and become available to later candidates. Each candidate should begin in a clean environment. Shared history may include design lessons, not protected answers.

Cost should be reported beside correctness. A harness that improves pass rate by two points while making ten times as many calls may be unsuitable for production. Cost includes more than tokens. Latency, compute, external API charges, human approvals, and failure cleanup all matter. Meta-Harness compares classification accuracy and context consumption, yielding a Pareto frontier that can support an actual deployment choice.

Safety evaluation needs ordinary success paths, not only adversarial prompts. An agent may download a file, unpack it, and execute a script. Each action is common in isolation while their sequence changes the risk. A process evaluator should reason about the sequence and stop it before an irreversible effect.

Human evaluation remains useful for open responses, research design, and visual quality. It needs a rubric, blind comparison, and a record of disagreement. A model judge can pre-screen large candidate sets. High-impact promotion should retain human review. The harness can organize evidence so that reviewers compare a specific difference instead of rereading an entire run.

## Chapter 7　ACE lets context grow incrementally from evidence

ACE stands for [Agentic Context Engineering](https://arxiv.org/abs/2510.04618). It treats context as an evolving playbook. After an execution produces a result, a Generator extracts candidate lessons from the trajectory. A Reflector examines whether those lessons are supported and under what conditions they apply. A Curator then makes localized changes to the existing context.

The incremental design matters. Repeatedly compressing and rewriting an entire context encourages what the paper calls brevity bias and context collapse. A concise rewrite can look cleaner while erasing exceptions, examples, and provenance. After several rounds, the context may become a smooth list of generalities that no longer explains how to act. ACE keeps an entry structure and performs additions, updates, and deduplication locally. A lesson can accumulate without forcing every older detail through another lossy summary.

<figure class="concept-figure context-evolution-figure">
  <div class="concept-flow context-evolution">
    <div class="concept-step"><strong>Execution trace</strong><small>Successful and failed runs retain evidence</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Generator</strong><small>Proposes reusable lessons</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Reflector</strong><small>Checks attribution and conditions</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Curator</strong><small>Writes locally, merges, and deduplicates</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step concept-step-accent"><strong>Evolving playbook</strong><small>Loaded selectively in the next run</small></div>
  </div>
  <figcaption>Figure 4. ACE uses generation, reflection, and curation to make evidence-linked incremental updates.</figcaption>
</figure>

The ACE abstract reports a 10.6 percent improvement on agent tasks and an 8.6 percent improvement in finance relative to strong baselines. It can adapt from natural execution feedback without labeled supervision. Those figures belong to the paper's experimental settings and should not be projected onto every agent. The more durable contribution is the representation. Context becomes an artifact with entries, update operations, and a strategy for retaining detail.

Consider a classification agent that confuses two closely related categories. A conventional prompt optimizer might rewrite the whole instruction. ACE can create a rule tied to the failed cases, retain counterexamples, and merge it with the existing playbook. If later evidence contradicts the rule, the Curator can revise that entry without regenerating unrelated guidance. The history can reveal when the rule entered the system and which evidence supported it.

The approach still depends on a human-designed update pipeline. Entry schema, reflection sequence, merge semantics, and invocation schedule are fixed by the system designer. A single procedure may fit some tasks and constrain others. MCE extends the search surface to the procedure that creates the context.

## Chapter 8　MCE evolves the skill and the context artifact together

[Meta Context Engineering via Agentic Skill Evolution](https://arxiv.org/abs/2601.21557) describes a bi-level process. A base-level agent executes the current context-engineering skill, using training trajectories to update a context artifact such as a file or program. A meta-level agent sees the skill history, execution process, and evaluation results. Through agentic crossover, it proposes a new context-engineering skill. The outer level changes how context is engineered. The inner level uses that method to change the task-specific artifact.

This separation addresses a recurring limitation of fixed reflection templates. Some tasks benefit from a library of examples. Another task may need an executable checker. A third may need changes to retrieval and memory layout. The skill specifies the procedure, while the artifact stores its task-specific product. Both can evolve.

The MCE paper evaluates five domains in online and offline settings. Its abstract reports relative gains over existing agentic context-engineering methods ranging from 5.6 to 53.8 percent, with a mean of 16.9 percent. The range matters as much as the mean. Benefits vary substantially by domain. Context optimization in this setup has moved well beyond changing a sentence. It includes files, code, and the process that constructs them.

ACE and MCE keep model weights fixed. The visible information and the machinery that produces it change. They are well suited to knowledge accumulation and procedural adaptation. Permissions, stopping logic, recovery, and independent evaluation still belong to the wider harness.

The difference becomes concrete in the classification example. ACE can turn errors into new discrimination rules and curate them into a playbook. MCE can also alter the method used to build that playbook. Its meta-level agent might decide to maintain a counterexample bank, write a category-balanced sampler, or change how conflicting rules merge. ACE evolves the content. MCE evolves the content-producing skill alongside its artifact.

Bi-level evolution makes attribution harder. If the inner artifact and outer skill both change, an improvement can come from either. Ablations and full version history become important. A skill can also specialize to its current domain and fail after transfer. MCE tests adaptation across domains, while a deployed system would still need every skill version, artifact, trace, and evaluator result to identify a regression.

Capacity and invocation cost remain. A larger rule set demands better selection. A more sophisticated skill costs more to execute. Permanent accumulation delays maintenance without removing it. Each lesson needs a purpose, evidence, and retirement path under new evaluation.

## Chapter 9　ADAS, AFlow, and STOP turn workflows into search objects

Once a workflow is represented as code, it can be generated, executed, and compared. [Automated Design of Agentic Systems](https://arxiv.org/abs/2408.08435) frames the problem through a search space, a search algorithm, and an evaluator. Its Meta Agent Search writes new agent programs and adds successful candidates to an archive that informs later designs.

The paper starts with simple systems such as Chain-of-Thought and Self-Refine. A meta agent first writes a high-level design, implements it as code, and performs two rounds of self-revision. Evaluated candidates enter an expanding archive. The experiments cover coding, science, mathematics, and multi-task benchmarks, with additional transfer across domains and models. The result is evidence that agent architecture itself can become a machine-searchable object.

[AFlow](https://arxiv.org/abs/2410.10762) represents workflows as graphs. Nodes invoke models and edges express conditional control in code. Monte Carlo Tree Search selects candidates for expansion. A model modifies a workflow using historical performance, then the system executes and evaluates the new version. Search stops when the top-k average stabilizes or the budget ends. Across six benchmarks, the paper reports an average 5.7 percent gain over strong baselines. In some tasks, a workflow built from a smaller model exceeds GPT-4o while using 4.55 percent of its dollar inference cost.

[STOP](https://arxiv.org/abs/2310.02304) begins with a seed improver. The improver receives a program to optimize, a utility function, and a black-box language model, then returns a better program. The researchers ask the improver to rewrite itself and use the revised version in the next round. The runs discover beam search, genetic algorithms, simulated annealing, temperature schedules, and tree search strategies.

The paper states STOP's boundary carefully. The base language model does not change, and the authors do not claim complete recursive self-improvement. The changing object is the scaffolding program that calls the model. Under GPT-4, mean downstream performance rises across iterations. Weaker-model settings can regress. A loop's ability to continue says little about its ability to improve. Model capability and utility design constrain the result together.

<figure class="concept-figure workflow-search-figure">
  <div class="concept-cycle workflow-search-cycle">
    <div class="concept-step"><strong>Candidate program</strong><small>Workflow, graph, or improver</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Task execution</strong><small>Produces output and a full trace</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Evaluator</strong><small>Correctness, cost, and constraints</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Search policy</strong><small>Selects a parent and generates a change</small></div>
    <div class="concept-arrow concept-arrow-return" aria-hidden="true">↺</div>
  </div>
  <div class="concept-legend"><span>ADAS　code archive</span><span>AFlow　MCTS workflow tree</span><span>STOP　self-editing improver</span></div>
  <figcaption>Figure 5. All three systems place an external agent program inside a generate, execute, and select loop.</figcaption>
</figure>

Their shared move is turning system design into executable candidates. Their representations and search policies differ. ADAS leaves the space relatively open, allowing the meta agent to invent code structures. AFlow constrains workflows to graphs and manages exploration with MCTS. STOP directly optimizes the improver program. An open space permits more invention while increasing evaluation cost and the difficulty of setting a safe boundary.

Representation determines what search can discover. Graphs express branches, loops, and parallelism cleanly, and they make node-level cost easier to measure. Code can implement caches, exception handling, file protocols, and arbitrary control, but candidates become harder to compare. Text rules are easy to generate and review yet may be too weak for real state transitions. Before search begins, designers should list the editable surface. Can prompts change? Can tools be added or removed? May control flow change? Can state schemas migrate? This inventory defines both the creative space and the risk envelope.

Parent selection matters as well. Always expanding the highest score quickly concentrates the search around one local pattern. Selecting only for novelty burns evaluation on implausible ideas. ADAS's archive, AFlow's tree, and STOP's iterative improver preserve history in different ways. A practical archive can retain high scorers, behaviorally distinct candidates, and candidates that explain an important failure. Score describes current performance. Behavioral descriptors preserve directions the search has not exhausted.

Credit assignment is one of the hardest parts of workflow search. If a candidate changes the planning prompt, tool order, and retry count together, a higher score gives no clear cause. Inheriting every change accumulates accidental complexity. A generator should prefer small modifications with explicit identities. Successful candidates can receive follow-up ablations in which changes are removed one at a time. Exploration may remain broad, but the stable branch should contain interventions whose effects are understandable.

Transfer across models also needs fresh evaluation. A workflow may depend on a strong model's context length and tool adherence, then loop under a weaker model. A strict template can help a small model and constrain a stronger one. Cross-model results in a paper show that transfer can occur. They do not replace verification in the target environment. A release record should identify the harness and model as one tested pair.

## Chapter 10　Meta-Harness searches the full harness code

A text optimizer often receives a candidate, a score, and a short explanation before proposing the next version. Harness diagnosis produces much more material. One evaluation can span many tasks and generate source files, tool traces, errors, and partial scores. Compressing all of this before anyone knows the next question discards details on an arbitrary schedule.

[Meta-Harness](https://arxiv.org/abs/2603.28052) takes a deliberately software-oriented approach. It stores source, scores, and raw traces for historical candidates in a file system. The proposer is a coding agent that can search directories, open selected files, run checks, and edit harness code. Each iteration creates several candidates. Their evaluations become new files for later iterations. Across the paper's domains, the foundation model remains frozen. The search changes the harness.

<figure class="concept-figure meta-harness-figure">
  <div class="concept-grid meta-harness-grid">
    <div class="concept-card concept-card-wide"><span>Historical file system</span><strong>Source, score, and raw traces for H₀…Hₙ</strong><small>Complete evidence stays available for selective reading</small></div>
    <div class="concept-card"><span>Coding proposer</span><strong>Search, compare, modify</strong><small>Chooses the evidence needed for the current hypothesis</small></div>
    <div class="concept-card"><span>Candidate harness</span><strong>Executable code</strong><small>Each change can be evaluated independently</small></div>
    <div class="concept-card"><span>Domain tasks</span><strong>Classification, mathematics, coding</strong><small>One outer loop works across different runtimes</small></div>
    <div class="concept-card concept-card-accent"><span>Selection</span><strong>Score and cost together</strong><small>Retains reproducible gains</small></div>
  </div>
  <figcaption>Figure 6. Meta-Harness keeps full history and lets a coding agent selectively read it before editing harness code.</figcaption>
</figure>

In online text classification, the selected Meta-Harness system gains 7.7 percentage points over ACE while using roughly one quarter as many context tokens. In a direct comparison, Meta-Harness reaches 48.6 percent accuracy, ACE reaches 40.9 percent, and MCE reaches 40.0 percent. Their context use is about 11.4K, 50.8K, and 28.5K tokens respectively. These figures belong to one controlled setup. They show that better selection and organization can beat indiscriminate context growth.

The ablation on feedback interfaces is even more revealing. With scores alone, candidate median and best accuracy are 34.6 and 41.3. Adding an automatic summary yields 34.9 and 38.7. Access to raw execution traces raises them to 50.0 and 56.7. The summary fails to restore the relevant diagnostic detail, and the best result even falls. The proposer needs to reopen evidence under its current question instead of inheriting an explanation written before that question existed.

For mathematical retrieval, the system evaluates 109 candidate harnesses and selects a four-route BM25 program. On five held-out models and 200 unseen IMO-level problems, the program improves by an average 4.7 percentage points over no retrieval. The selected harness is simple relative to the open coding space. Its legitimacy comes from performance on unseen problems and models, not from the apparent sophistication of its source.

The paper also reports a failure that resembles ordinary software debugging. One proposal bundled structural repair and prompt rewriting, then regressed. After reading the history, the proposer separated the interventions and moved toward safer incremental edits. Multiple simultaneous changes had hidden attribution. Raw history helped reduce the hypothesis.

The outer loop can be read as automated experiment management. Every candidate needs to install, start, and run the same task interface. The evaluator writes task outcomes, aggregate scores, and resources into an isolated directory. The proposer chooses one or more parents and produces the next code batch. Cheap startup checks remove syntax and dependency failures. Expensive tasks are reserved for candidates that can execute. This staged budget keeps open code search from spending most resources on broken programs.

Cost objectives shape what the proposer discovers. Ranking only by accuracy encourages additional retrieval, reflection, and calls without a natural limit. Recording tokens, latency, or monetary cost creates a multi-objective search. Meta-Harness reports both accuracy and context consumption in classification, which lets a deployer choose a point on a Pareto frontier. A research system should also record total search cost. One lucky cheap run is not evidence of a stable workload.

The coding proposer has read, write, and execution tools, which expands the security surface. Candidate directories should be isolated from production. The proposer should see only authorized data, with external writes disabled by default. Evaluation cleanup must terminate stray processes and release temporary resources. A high score does not grant release authority. Promotion from the research directory still passes an independent regression and review path.

## Chapter 11　Updating a harness does not guarantee benefit from it

[Harness Updating Is Not Harness Benefit](https://arxiv.org/abs/2605.30621) separates two axes. Harness-updating asks whether a model can derive a useful persistent change from execution evidence. Harness-benefit asks whether the task agent later invokes and follows that change. The experiments find that the two abilities do not rise together.

Across a capability range from Qwen3.5-9B to Claude Opus 4.6, generated updates produce relatively similar gains. Updating is fairly flat with respect to base task capability. Benefit is non-monotonic. Weaker models gain little, intermediate models gain the most, and the strongest models gain less than the middle group. The paper identifies two common weak-model failures. The agent may never activate the relevant skill or memory. It may activate the artifact and fail to follow it over the trajectory.

This distinction explains a familiar disappointment in memory systems. The system stores a useful lesson, but the next agent never retrieves it. It retrieves the rule and forgets it after ten tool calls. The updater appears capable while task performance stays unchanged. Asking it to write a more polished artifact does not repair activation or adherence.

A harness therefore needs explicit trigger conditions and observable activation. Critical rules can become executable checks, moving adherence from intention into an external constraint. Long tasks can reload important conditions at phase boundaries. Benefit emerges from the full chain of storage, retrieval, activation, adherence, and validation.

This decomposition also suggests better diagnostics. A controlled task can place a unique record in state and test whether retrieval surfaces it. Another assertion can check whether the resulting action obeys the record. A failed end-to-end task then becomes two measurable nodes. The team can repair the retrieval policy or the execution loop instead of rewriting the memory without evidence.

## Chapter 12　Self-Harness constrains self-modification with regression gates

[Self-Harness](https://arxiv.org/abs/2606.09498) lets a target model participate in modifying its own runtime harness. It does not require a stronger external model, and the proposer cannot rewrite the entire system freely. Each round contains Weakness Mining, Harness Proposal, and Proposal Validation.

Weakness Mining finds recurring failures with validator evidence in held-in traces. Harness Proposal uses the same foundation model to generate several diverse, bounded changes, each attached to a concrete mechanism. Proposal Validation reruns candidates on held-in and held-out tasks. A candidate joins the accepted set only when neither split regresses and at least one improves. When several changes pass, the system combines them into the next harness version.

The paper evaluates Terminal-Bench-2.0, SWE-bench Verified, and AppWorld with MiniMax M2.5, Qwen3.5-35B-A3B, and GLM-5. Across all nine benchmark and model combinations, every final harness improves pass rate on both held-in and held-out tasks. The largest relative gain is 132 percent for Qwen3.5 on AppWorld. The largest absolute gain is 40.6 percentage points for GLM-5 on AppWorld.

The concrete changes reveal more than the aggregate. The MiniMax harness creates requested artifacts earlier, handles structured tool content more carefully, and exits tool loops that make no progress. Qwen's changes add dependency checks, avoid repeating failed commands, stop endless exploration, and reconfirm artifacts after tool errors. GLM's harness preserves environment settings across shell calls and moves earlier from exploration to implementation and testing.

The changes are small and legible. Model, evaluator, task split, and tools remain fixed so that harness effects are easier to isolate. The paper also acknowledges its limits. The edits are bounded and evaluated on fixed benchmarks, so benchmark-specific adaptation remains possible. Higher-risk systems need stronger acceptance criteria than pass rate alone.

Weakness Mining anchors edits in repeated evidence. One failure may come from sampling noise. Ten similar traces that omit artifact checks indicate a stable weakness. Clustering should consider the action sequence as well as the final error. The same unsuccessful task can originate in endless planning, missing tests after implementation, or a passed test followed by failure to deliver the target file. The useful edit lands at the earliest point that can alter the outcome.

The proposal stage needs a bounded surface. The target model may change retry policy, dependency checks, phase reminders, and artifact validation. It cannot replace the evaluator or inspect protected held-out cases. A clear boundary makes accepted results interpretable. Diverse proposals can still be small. For one failure pattern, the proposer may offer a pre-call check, post-error recovery, or end-of-phase assertion and let the evaluator distinguish them.

Combining accepted candidates introduces interaction risk. Two changes can work independently and then trigger redundantly or consume too much context together. Their combination should be treated as a new candidate and pass the full gate. Candidate lineage needs parent versions and component edits so that a later regression can first remove the most plausible branch.

Model specificity is informative. MiniMax, Qwen, and GLM receive different changes because their traces reveal different behaviors. A shared harness layer can reduce maintenance, while an adapter layer addresses model-specific weaknesses. Common safety rules belong in the base layer. Recovery tactics may live in the adapter. The tested release still consists of the complete model and harness combination.

## Chapter 13　Why candidate generation must pass validation

Generation is good at widening a search. One failed command may support several explanations. A dependency could be missing, the working directory could be wrong, the command might target another platform, or an earlier artifact could be empty. Pursuing only the first plausible story can spend the entire budget on the wrong cause. Several distinct candidates preserve alternative paths.

A candidate has no privileged epistemic status. It is a proposal waiting for a test. The system should attach an evidence requirement to each one. A missing-dependency hypothesis calls for inspecting lock files and checking installed versions. A wrong-path hypothesis calls for listing the directory and comparing arguments. A proposed harness modification calls for rerunning fixed tasks and observing whether behavior changes in the predicted way.

<figure class="concept-figure candidate-validation-figure">
  <div class="concept-flow candidate-gate">
    <div class="concept-step"><strong>Failure evidence</strong><small>Trace, error, and unmet assertion</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step concept-step-branch"><strong>Generate candidates</strong><small>Keep H₁, H₂, and H₃ meaningfully different</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Minimal experiment</strong><small>Change one attributable mechanism</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Regression gate</strong><small>Held-in, held-out, cost, and permission</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step concept-step-accent"><strong>Accept or reject</strong><small>Save the evidence with the decision</small></div>
  </div>
  <figcaption>Figure 7. Generation creates meaningful alternatives; validation decides whether any may enter the system.</figcaption>
</figure>

Validation should be independent from proposal generation where possible. A model that proposes a change, interprets its own output, and declares success has several opportunities to confirm its initial belief. Unit tests, state assertions, and independent evaluators provide hard gates. Open tasks still require judgment. The system should at least expose raw evidence and the exact modification to the reviewer.

Candidate count also needs a budget. More candidates broaden coverage, increase evaluation cost, and create more opportunities for an accidental high score. A search record should include the total number of comparisons. Cheap tests can reduce the pool before expensive validation. This staged design is usually more reliable than running every idea through the complete suite.

This is the use of generation that interests me most. A model can propose counterexamples, competing explanations, diagnostic questions, and code changes. Understanding grows through movement between those candidates and evidence. A rejected candidate still narrows the space and contributes a failure condition for the next round. The harness maintains the exchange and prevents an untested sentence from becoming persistent system state.

An actionable validation record has at least five parts. It begins with a hypothesis that names the failure the candidate should change. It records the intervention as the exact fields, code, or control flow modified. It fixes the task, randomness, and environment while stating the expected observation. After execution, it stores raw results and a statistical summary. Finally, it records a decision of accept, reject, or insufficient evidence. Without the hypothesis, a score change has no mechanism. Without raw results, later review is impossible. Without the third decision, noise is forced into a winner and loser.

A minimal experiment diagnoses mechanism. A complete regression decides release. Suppose an agent often omits the requested artifact. A phase-end file assertion can first run on a small relevant set to confirm that the behavior changes. This establishes that the mechanism is active. It does not establish overall value. The candidate still needs cross-task regression to see whether the assertion harms tasks with non-file outputs, adds useless calls, or creates a loop when the tool fails.

Statistical variation creates false gains. With many candidates, a few will rank highly through chance. A reliable protocol gives candidates the same number of runs, stores paired outcomes for each task, and asks how broadly the improvement is distributed. If the difference sits inside noise, the system can expand the sample or keep the stable version. A release process does not owe every iteration a winner.

Validation should try to falsify a candidate. If a new rule claims to reduce ineffective retry, construct transient, permanent, and recoverable failures. A rule that helps permanent errors may stop too early under temporary failures. Its condition then needs to narrow. An adversarial checker converts a broad lesson into procedural knowledge with explicit limits.

Understanding can also become an executable probe. If the team suspects that an agent does not retrieve task state, a controlled record with a unique marker can test whether later actions depend on it. If retrieval occurs but adherence fails, an activation event and a behavioral assertion separate the two. The updating and benefit distinction becomes a practical diagnostic map.

## Chapter 14　Rollback turns improvement into a reversible release

A harness change affects future tasks, which makes it riskier than a single answer. Before entering the active version, it should pass the same disciplines as a software release. Every candidate needs a parent version, diff, target failure pattern, evaluation set, results, and acceptance rationale. Without them, the next iteration cannot attribute a gain or repair a regression.

<figure class="concept-figure rollback-figure">
  <div class="concept-flow rollback-flow">
    <div class="concept-step"><strong>Current stable version</strong><small>hₜ with known passing evidence</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Candidate branch</strong><small>One identified minimal change</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step"><strong>Staged validation</strong><small>Smoke, regression, held-out, human gate</small></div>
    <div class="concept-arrow" aria-hidden="true">→</div>
    <div class="concept-step concept-step-accent"><strong>Canary next version</strong><small>Monitoring and a recovery pointer remain active</small></div>
    <div class="concept-arrow concept-arrow-return" aria-hidden="true">↺</div>
    <div class="concept-step concept-step-muted"><strong>Rollback</strong><small>Restore hₜ after a regression trigger</small></div>
  </div>
  <figcaption>Figure 8. Harness improvement needs versions, staged validation, and an executable path back.</figcaption>
</figure>

Rollback involves more than restoring an old prompt. A new release may change the state schema, write memory the old reader cannot parse, or acquire different tool permissions. Reliable recovery considers code, configuration, state migration, and side effects. A sent message cannot be unsent and deleted data may not be recoverable. Permission design remains the first defense.

| Release stage | Evidence to preserve | Passing condition | Action after failure |
| --- | --- | --- | --- |
| Candidate generation | Parent, diff, target failure | Scope is clear and executable | Reject an unattributable rewrite |
| Smoke test | Key tools and minimal tasks | No syntax, permission, or startup error | Repair or discard the candidate |
| Regression test | Fixed tasks, repeats, cost | No unacceptable loss of old capability | Return to the parent version |
| Held-out check | Tasks hidden from the proposer | Gain leaves the search examples | Mark overfitting and reject |
| Canary | Monitoring, human feedback, anomaly rate | Stable behavior on real tasks | Stop allocation and roll back |

Version history also gives negative results a home. A rejected candidate should not vanish without explanation. Its failure record prevents another proposer from repeating the same intervention and shows which rules were specific to a model or benchmark. Search accumulates experience only when unsuccessful paths remain retrievable.

The recovery path should be rehearsed before release. An old version identifier does not prove that the old version still starts. Dependencies may have changed, state may have passed through an irreversible migration, and credentials may have expired. A team can periodically restore the stable snapshot into isolation, run a minimal task, and check reads and writes. Recovery time and maximum data loss become release metrics.

State migrations benefit from a two-stage compatibility window. The new version first reads the old format and writes the new one. After a period of stable observation, old-format writes stop. An older binary may still fail to understand new records, so critical stores may need dual writes or a reverse converter. Every conversion should preserve counts, hashes, or sampled checks. A rollback that starts successfully while silently dropping memory is still a failed rollback.

Canary rollout needs predetermined stopping rules. A candidate can first receive a small fraction of low-risk tasks. Error rate, human takeover, cost, and latency are compared with the stable branch. Permission anomalies, irreversible side effects, or a core regression should stop it immediately. Ordinary variance needs an evaluation window so that the system does not oscillate after every bad run. Switching versions can itself disturb cache and state.

External effects need compensation plans. A sent email cannot truly be reversed, so the harness can save a draft and require approval before sending. A created resource can be registered by identifier and closed after failure. Actions with no practical compensation should sit behind the narrowest permission and happen late in the workflow. Rollback selects the harness for future runs. Compensation handles effects that already occurred.

## Chapter 15　The boundaries of these systems side by side

All of these papers study a variable system around a fixed model, but their optimization targets and evidence interfaces differ. Compressing them into one broad label hides the important choices.

| Work | Main optimization target | How candidates arise | Primary feedback | How history is retained |
| --- | --- | --- | --- | --- |
| ACE | Context playbook | Generator, Reflector, Curator | Execution feedback and task metric | Incremental structured entries |
| MCE | CE skill and context artifact | Bi-level agentic crossover | Online and offline evaluation in five domains | Skill and artifact versions |
| ADAS | Code-represented agent design | Meta Agent Search | Scores across several domains | Archive of successful agents |
| AFlow | Graph-represented workflow | LLM edits and MCTS | Execution on six benchmarks | Workflow search tree |
| STOP | Improver program | Improver rewrites itself | Meta-utility | Iterative versions |
| Meta-Harness | Complete harness code | Coding agent reads history and edits code | Score, cost, source, raw trace | File system with all candidates |
| Harness Updating Is Not Harness Benefit | Updating and utilization abilities | Cross-model controlled study | Update gain, activation, adherence | Traces and skill artifacts |
| Self-Harness | Bounded surface of the target model's own harness | Parallel proposals after weakness mining | Held-in and held-out regression gate | Accepted and rejected lineage |

ACE and MCE focus on sustained maintenance of context and skills. ADAS, AFlow, and STOP search workflows or programs. Meta-Harness expands the editable object to runtime code and gives the proposer selective access to complete history. Self-Harness assigns proposal to the target model while protecting promotion with a fixed evaluator and regression rule. Harness Updating Is Not Harness Benefit shows that producing an update and benefiting from it are separable capabilities.

Every system still depends on the same foundation. Candidates need an executable identity. Results need an evaluator. History needs a retrieval interface. Changes need comparable parents. Remove one of these and the loop returns to prompt edits guided by impression.

## Chapter 16　What real systems still lack

The first difficulty is evaluation. Open tasks rarely have a complete scalar score. A research agent can produce a higher benchmark number through leakage. A coding agent can pass current tests while creating an unmaintainable implementation. Multi-objective evaluation better reflects reality but introduces weighting and conflict decisions.

The second is long-lived state. Memory grows, environments move, and old skills expire. Systems need retirement, merging, and revalidation. One useful experience cannot receive permanent authority. When a model, tool interface, or organizational policy changes, affected records should return to evaluation.

The third is search diversity. An evaluator draws candidates toward familiar high-scoring patterns. Promising directions with weak early results disappear quickly. Open research needs an exploration budget and a representation of behavioral difference. One hundred paraphrases do not create one hundred hypotheses.

The fourth is reward exploitation. A unit test with a hole invites a shortcut that makes it green. A model judge with a stylistic preference trains candidates to imitate it. Held-out tasks, independent evaluation, trace audits, and human review raise the cost of exploitation without eliminating it. The evaluator itself needs versions and regressions.

The fifth is the location of human responsibility. People do not need to tune every instruction manually. High-impact decisions still need an owner. Humans can define goals and hard boundaries, review the evaluation function, and decide whether to continue after anomalies or distribution shift. Automation can run many reproducible comparisons. Responsibility does not disappear as the number of model calls rises.

The sixth is distribution shift. Tool upgrades, model service changes, and new task populations can leave the old regression suite green while production behavior drifts. A harness should track changes in input mix, tool error classes, and reasons for human takeover. When monitoring detects a shift, automatic promotion can pause while the team adds representative tasks. Continuing to optimize the old score means searching a world that no longer exists.

The seventh is governance of evaluation assets. Protected tasks, human labels, and real failure traces may contain sensitive information or answers that would invalidate future tests. The proposer should receive only what candidate generation requires. An independent evaluator keeps protected answers. As the history grows, the system must scan for accidental leakage into shared files. Once that boundary fails, later high scores become difficult to interpret.

The eighth is maintainability. Generated code can pass tests while duplicating rules or hiding behavior in opaque control flow. Before release, reviewers should inspect module boundaries, dependencies, comments, and opportunities to remove dead logic. Complexity can enter the evaluator or remain a human gate. A harness is long-running software. When the next incident happens, someone still needs to find the code responsible for the action.

One plain limitation remains. A harness can expose ability already present in the model and can amplify the model's habits and weaknesses. STOP's weaker-model regressions and the activation failures in the benefit study show that outer machinery cannot compensate without limit for inner capability. An elaborate harness also consumes context and maintenance effort. Every new mechanism should correspond to a reproducible failure and survive a test that shows why it deserves to remain.

## Chapter 17　How I now understand harness engineering

Harness engineering occupies the distance between a model and a real task. Task decomposition, evidence selection, controlled tool use, state across calls, validation, and recovery jointly determine whether an agent can work reliably. These mechanisms look less glamorous than a new model architecture because each one resembles ordinary infrastructure. Together they define what the model can actually accomplish.

My conclusion is specific. Generation helps a system understand a problem by producing meaningfully different explanations and interventions. Validation brings each one into contact with evidence. State records which paths have already been tried and under which version. Rollback prevents an attractive mistake from permanently changing later behavior. Connected in one loop, those mechanisms allow a run to produce reusable knowledge.

This view decomposes the word “smarter” into research questions. Did the system fail to propose the right candidate, or did it fail to retrieve a relevant lesson? Was the rule retrieved but ignored? Did the evaluator miss the real error? A harness moves those failures into traces, code, and version history. Once a failure has a location, an experiment can target it.

The next useful work will likely remain close to three problems. Candidate sets need genuine differences. Validation needs direct contact with task facts. Durable state needs provenance and an expiry path over long periods. These concerns are quiet, but they decide whether automated improvement is persuasive prose or software that can earn trust.
