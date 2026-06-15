---
title: Architecture
doc_type: architecture
status: active
domain: system
last_updated: 2026-05-16
---

# Architecture

## Overview

The AI Writing Engine is a **layered, plugin-based orchestration engine** evolving into a **web platform for customizable AI writing workflows**. It consists of six conceptual layers:

1. **DSL / API Layer** — How developers define pipelines and skills (declarative JSON/YAML or programmatic TypeScript API).
2. **Core Engine Layer** — The pipeline runtime: scheduling, state management, execution tracing, and error handling.
3. **Adapter / Plugin Layer** — Pluggable implementations for execution (LLM adapters), memory (storage backends), and skill resolution.
4. **Declarative Skills Layer** — Safe, code-free skill creation through prompt templates with variable mapping. Enables non-technical users to extend pipelines.
5. **Skill Contract Layer** (Phase 2.5) — Execution contracts for declarative skills: input validation, output parsing, semantic types, and registry introspection.
6. **Web Platform Layer** (future) — Next.js full-stack application: visual pipeline builder, skill editor, reference text corpus, real-time execution, and trace inspection.

The architecture prioritizes **inversion of control**: the core engine owns the orchestration logic, while all external interactions (LLM calls, persistence, I/O) flow through well-defined interfaces implemented by plugins. The declarative skills layer sits between the engine and the web platform, ensuring user-created skills are safe to execute in a multi-tenant environment.

## Key Architectural Drivers

- **Portability**: A pipeline definition should run unchanged in a local Node.js process, a CLI tool, or a web API.
- **Observability**: Every execution produces a complete trace of inputs, instructions, and outputs per step.
- **Extensibility**: New skills, memory backends, and execution adapters can be added without modifying the core engine.
- **Safety**: User-created skills cannot execute arbitrary code. They are pure prompt templates.
- **Accessibility**: Non-technical users must be able to create and customize pipelines through a web UI.

## Components

### 1. Pipeline Runtime (Core Engine)

- **Orchestrator**: Executes pipelines step-by-step. Manages step ordering, retry logic, and conditional `continueOnError`.
- **Context Manager**: Maintains the execution context (shared state, variables, and intermediate outputs) passed between steps.
- **Trace Recorder**: Captures every step execution into a structured trace object for debugging and replay.
- **Skill Registry**: Resolves skill definitions (built-in native, built-in declarative, or user-created declarative) at runtime.

### 2. Skill System

- **Skill Contract**: A standardized interface for all skills.
  - `inputSchema`: Defines expected input shape.
  - `instruction`: A template or function that generates the prompt/instruction for the step.
  - `outputSchema`: Defines expected output shape.
  - `execute`: Optional local execution logic (for pure-transform skills).
- **Built-in Native Skills**: Reference implementations with complex logic:
  - `analyze` — Extracts intent, audience, and constraints from input.
  - `draft` — Generates a raw content draft based on analysis.
  - `voice-match` — Transforms draft to align with a voice profile (queries memory, formats conditionally).
  - `refine` — Applies editorial rules and anti-patterns.
- **Declarative Skills**: User-defined skills created via prompt templates.
  - Stored as JSON with `name`, `description`, `promptTemplate`, and `inputMapping`
  - Executed by a template engine that resolves variables from context/state
  - Safe for multi-tenant execution (no arbitrary code)
- **Contract-Based Declarative Skills** (Phase 2.5): Evolved declarative skills with execution contracts.
  - Extends the declarative skill with a `contract` object:
    - `type`: semantic role (`generate`, `transform`, `validate`, `enrich`)
    - `input`: required/optional input declarations
    - `output`: parser hint (`text`, `json`, `auto`) and schema description
  - Engine validates inputs pre-flight and parses outputs post-adapter
  - Enables pipeline compatibility analysis and registry introspection
  - Backward compatible: skills without contracts continue to work as legacy declarative skills
- **Custom Native Skills**: Developer-defined skills loaded from files or npm packages (local/CLI only).

### 3. Declarative Skills Layer

- **Template Engine**: Resolves variables in prompt templates using the execution context.
  - Variable syntax: `{{variable}}` or `{{$state.stepName}}` or `{{$inputs.topic}}`
  - Supports default values and basic conditionals
  - Maps template variables to context paths via `inputMapping`
- **Skill Store**: Persists declarative skills (JSON) to the configured backend.
- **Validator**: Ensures declarative skills have required fields and valid template syntax before registration.

### 3.5 Skill Contract Layer (Phase 2.5)
- **Contract Definition**: Metadata that defines a skill's execution guarantees.
  - `type`: semantic role (`generate`, `transform`, `validate`, `enrich`)
  - `input`: required/optional inputs mapped from context paths
  - `output`: parser (`text`, `json`, `auto`) and schema description
- **Contract Validator**: Pre-flight validation before step execution.
  - Verifies all required inputs are present in context
  - Checks inputMapping resolves to defined context paths
  - Emits warnings for potential step-to-step incompatibilities
- **Output Parser**: Post-adapter response interpretation.
  - `text`: passthrough string
  - `json`: attempts JSON parse; records parse error gracefully on failure
  - `auto`: heuristically detects JSON vs text
- **Registry Introspection**: Contract discovery API.
  - `getContract(skillName)`: returns the contract for a registered skill
  - `listByType(type)`: filters skills by semantic role
  - Enables UI generation and pipeline validation without executing skills

### 4. Memory System

- **Memory Interface**: Abstract contract for storing and retrieving voice profiles, examples, rules, anti-patterns, and reference texts.
- **File Memory Backend**: Default MVP backend using JSON files on disk.
- **Database Memory Backend** (future): PostgreSQL or similar for web platform multi-tenancy.
- **Vector Memory Backend** (future): Integration with vector stores for semantic retrieval of reference texts.
- **Memory Manager**: Handles namespacing, versioning, and retrieval logic for pipeline steps.
- **Reference Text Corpus**: First-class collection of user-authored texts with metadata (title, tags, excerpt) used by skills to learn style and context.

### 5. Execution Adapters

- **Adapter Interface**: Abstract contract for executing instructions against an AI model or agent.
- **Local LLM Adapter**: Executes instructions by calling an LLM API (e.g., OpenAI-compatible HTTP).
- **Agent Adapter**: Emits structured instructions as output without executing them, intended for consumption by external agents.
- **Hybrid Adapter**: (Future) Combines local execution for some steps and agent emission for others.

### 6. DSL & API

- **Declarative DSL**: JSON/YAML schema for defining pipelines, skills, and memory bindings.
- **Programmatic API**: TypeScript/JavaScript API for building pipelines in code.
- **CLI**: Command-line interface for running pipelines and inspecting traces.

### 7. Persistence & Tracing

- **Trace Store**: Saves execution traces (intermediate steps, inputs, outputs, metadata).
- **State Store**: Saves and resumes pipeline execution state.
- **Skill Store**: Saves declarative skill definitions.
- **Corpus Store**: Saves reference texts and user-generated content.
- **Format**: JSON-based trace, state, skill, and corpus files.

### 8. Web Platform (future)

- **Next.js Full-Stack App**:
  - API Routes: instantiate Engine server-side, handle auth, manage user data
  - React Frontend: pipeline builder, skill editor, execution dashboard, corpus manager
- **Auth & Multi-tenancy**: User accounts, teams, and isolated namespaces
- **Real-time Progress**: SSE or WebSocket from API routes to show step-by-step execution
- **History**: Browse past executions, inspect traces, replay pipelines

## Execution Flows

### Flow 1: Define and Run a Pipeline (Local Execution)

1. User defines a pipeline via DSL (JSON/YAML) or programmatic API.
2. Pipeline is loaded and validated by the DSL parser / API layer.
3. Orchestrator initializes the Context Manager with pipeline inputs and memory bindings.
4. For each step in the pipeline:
   a. Skill Registry resolves the skill definition (native, declarative, or contract-based).
   b. **Contract Validator** checks pre-flight conditions (required inputs present, mappings resolvable).
   c. Skill generates an instruction using the current context (native `execute()` or template engine).
   d. Execution Adapter (Local LLM) sends the instruction to the configured LLM.
   e. Adapter returns the output.
   f. **Output Parser** interprets the response according to the skill's contract (`text`, `json`, `auto`).
   g. Context Manager updates the context with the step output (and parsed output, if applicable).
   h. Trace Recorder logs the step execution, including `resolvedInputs`, `contract`, and `parsedOutput`.
5. Orchestrator completes the pipeline and returns the final output.
6. Trace Store persists the full execution trace.

### Flow 2: Agent-Based Execution

1. Steps 1–4a same as Flow 1.
2. Execution Adapter (Agent) formats the instruction into a structured output (e.g., markdown with JSON frontmatter).
3. Adapter returns the instruction object without making an LLM call.
4. Orchestrator continues with the instruction as the step output (to be consumed by an external agent).
5. Final output is a sequence of structured instructions rather than generated content.

### Flow 3: Resume / Replay

1. User requests replay of a previous run using a trace ID.
2. Trace Store loads the persisted trace.
3. Orchestrator reconstructs the pipeline state from the trace.
4. User can modify inputs or step parameters and re-execute from any step.
5. New execution produces a new trace while preserving the original.

### Flow 4: Memory Evolution

1. User or pipeline stores a new voice profile, example, or reference text via the Memory Manager.
2. Memory Manager writes to the configured backend (e.g., File Memory, Database).
3. On subsequent pipeline runs, skills query the Memory Manager to retrieve relevant profiles/examples/corpus.
4. Over time, the memory backend accumulates user-specific context, improving output quality.

### Flow 5: User Creates a Declarative Skill

1. User opens the skill editor (web UI or CLI).
2. User provides:
   - Name and description
   - Prompt template with variables (e.g., `{{input}}`, `{{$state.draft}}`)
   - Input mapping (which context paths feed which template variables)
   - **Contract** (Phase 2.5): skill type (`generate`, `transform`, `validate`, `enrich`), output parser (`text`, `json`, `auto`)
3. Validator checks syntax, required fields, and contract validity.
4. Skill is persisted to the Skill Store.
5. Skill becomes available in the Skill Registry for pipeline composition.
6. Registry Introspection API exposes the contract for discovery and validation.
7. User adds the new skill to a pipeline and executes it.
8. Engine applies pre-flight validation and output parsing according to the contract.

### Flow 6: Web Platform Execution

1. User logs into the web platform and creates a new writing project.
2. User uploads reference texts to the Corpus Store and configures a voice profile.
3. User builds a pipeline using the visual builder (drag-and-drop native and declarative skills).
4. User enters the topic/theme and clicks "Generate".
5. Frontend sends request to API route with pipeline definition and inputs.
6. API route instantiates Engine with Database Memory Backend and Local LLM Adapter.
7. Engine executes the pipeline step-by-step, emitting progress events (SSE/WebSocket).
8. Frontend displays real-time progress: "Analyzing...", "Drafting...", "Matching voice...", "Refining..."
9. Engine returns the final text to the API route.
10. API route returns the final text and trace ID to the frontend.
11. Frontend displays the generated text with options to copy, edit, or rerun.

## Plugin Interfaces

The engine exposes three primary plugin interfaces:

### ExecutionAdapter

```typescript
interface ExecutionAdapter {
  name: string;
  configure: (config: Record<string, unknown>) => void;
  execute: (instruction: string, context: Context) => Promise<string>;
}
```

### MemoryBackend

```typescript
interface MemoryBackend {
  read: (namespace: string, key: string) => Promise<unknown>;
  write: (namespace: string, key: string, value: unknown) => Promise<void>;
  list: (namespace: string) => Promise<string[]>;
  delete: (namespace: string, key: string) => Promise<void>;
  query: (namespace: string, query: MemoryQuery) => Promise<Record<string, unknown>>;
}
```

### Skill

```typescript
interface Skill {
  name: string;
  inputSchema?: object;
  outputSchema?: object;
  execute: (context: Context) => Promise<StepOutput>;
}
```

## Extension Points

- **Custom Skills**: Implement the `Skill` interface and register with the engine (native), or create a declarative skill JSON (no code).
- **Custom Adapters**: Implement the `ExecutionAdapter` interface for new LLM providers or agent formats.
- **Custom Memory Backends**: Implement the `MemoryBackend` interface for databases, vector stores, or cloud storage.
- **Custom DSL**: The parser accepts any JSON/YAML conforming to the pipeline schema; future versions may support additional formats.

## Trade-offs

| Decision | Chosen Approach | Rationale | Trade-off |
|----------|----------------|-----------|-----------|
| Primary language | TypeScript | Broad developer adoption; excellent for library APIs; runs in Node.js and browsers. | Slightly more ceremony than Python for ML/AI prototyping. |
| Serialization format | JSON (primary), YAML (supported for DSL) | JSON is native to TypeScript/JS; YAML is human-friendly for config files. | YAML adds a parsing dependency; less strict than JSON. |
| First execution adapter | OpenAI-compatible HTTP | Widest compatibility (OpenAI, Azure, local proxies, many providers). | Not every provider is 100% compatible; may need provider-specific adapters later. |
| Default memory backend | File-based JSON | Zero external dependencies for MVP; works everywhere. | Does not scale to large datasets; no semantic search. |
| Skill execution | Async function-based (native) + Template engine (declarative) | Native skills handle complex logic; declarative skills enable safe user customization. | Two code paths to maintain. Declarative skills cannot express complex logic. |
| Pipeline state | Immutable trace + mutable context | Traces are append-only for auditability; context is mutable for step-to-step data flow. | Context mutations must be managed carefully to avoid side effects. |
| Extensibility model | Plugin interfaces (adapter, memory, skill) + Declarative templates | Clean separation of concerns; third parties can extend without forking; users can create skills without code. | Requires stable interface design upfront; breaking changes are costly. |
| Web platform architecture | Next.js full-stack with engine in API routes | Single codebase, easy deployment, server-side engine execution. | Engine must be stateless between requests; file-based memory must be replaced for multi-tenancy. |
| User skill security | Declarative only (no code execution) | Multi-tenant web platform cannot safely execute arbitrary user code. | Limits what users can build; advanced skills require native code from trusted sources. |
| Skill contracts | Metadata-only contracts with lenient validation | Adds predictability and debuggability without forcing rigid schemas on non-technical users. | Users may expect strict runtime type enforcement; lenient mode trades correctness for resilience. |
| Output parsing | Heuristic/auto parser + explicit JSON mode | Gives power users control while defaulting to safe passthrough for simple skills. | Auto-detection can misfire; users must understand parser selection. |
| Reference corpus | Simple concatenation first, semantic search later | MVP needs to work without vector store infrastructure. | Large corpora may exceed LLM context limits until semantic retrieval is implemented. |

## Risks

- **Interface instability.** The plugin interfaces (adapter, memory, skill) are foundational. Early breaking changes will fragment the ecosystem. Mitigation: start with minimal, well-considered interfaces and version them.
- **LLM API drift.** OpenAI-compatible APIs diverge over time. Mitigation: design adapters to be thin and provider-specific overrides to be easy.
- **Performance at scale.** File-based memory and JSON traces will not scale to thousands of runs or large vector stores. Mitigation: architect the plugin layer so that backends can be swapped without engine changes.
- **Over-engineering the DSL.** A too-expressive DSL becomes a new programming language. Mitigation: keep the DSL declarative and push complex logic into native skills via the programmatic API.
- **Security of execution.** Pipelines can execute arbitrary code if custom skills are not sandboxed. Mitigation: web platform restricts users to declarative skills only; native skills are code-reviewed and trusted.
- **Declarative skill limitations.** Users may demand capabilities that prompt templates cannot express (API calls, complex conditionals, data processing). Mitigation: offer a curated marketplace of native skills for advanced use cases.
- **Contract complexity vs. accessibility.** Adding contracts increases conceptual overhead for non-technical users. Mitigation: contracts are optional; defaults are sensible; UI can hide complexity behind guided wizards.
- **Output parser reliability.** LLMs may not always return well-formed JSON even when instructed. Mitigation: lenient parsing with graceful degradation; parse errors recorded in trace; step can mark `continueOnError`.
- **Context window limits.** Injecting large reference text corpora into prompts may exceed LLM context limits. Mitigation: implement semantic chunking and retrieval as a future memory backend enhancement.
- **Adoption friction.** Users accustomed to single-prompt tools (ChatGPT) may find multi-step pipelines complex. Mitigation: provide pre-built templates and a simple "Quick Generate" mode that hides pipeline complexity.
