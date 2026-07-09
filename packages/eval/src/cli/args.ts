export interface EvalCLIConfig {
  readonly suite?: string;
  readonly includeJudge: boolean;
  readonly judgeProvider?: string;
  readonly judgeModel?: string;
  readonly generator: "placeholder" | "orchestrator";
  readonly compare: boolean;
  readonly reportFormat: "console" | "json" | "markdown";
  readonly saveBaseline: boolean;
  readonly caseId?: string;
  readonly tags?: readonly string[];
  readonly threshold: number;
  readonly help: boolean;
  readonly version: boolean;
}

interface MutableEvalCLIConfig {
  suite?: string;
  includeJudge: boolean;
  judgeProvider?: string;
  judgeModel?: string;
  generator: "placeholder" | "orchestrator";
  compare: boolean;
  reportFormat: "console" | "json" | "markdown";
  saveBaseline: boolean;
  caseId?: string;
  tags?: readonly string[];
  threshold: number;
  help: boolean;
  version: boolean;
}

const DEFAULT_CONFIG: MutableEvalCLIConfig = {
  includeJudge: false,
  generator: "placeholder",
  compare: false,
  reportFormat: "console",
  saveBaseline: false,
  threshold: 5,
  help: false,
  version: false
};

export class CLIArgumentError extends Error {
  readonly flag: string;

  constructor(flag: string, message: string) {
    super(`Invalid flag ${flag}: ${message}`);
    this.flag = flag;
  }
}

export function parseArgs(argv: readonly string[]): EvalCLIConfig {
  const args = argv.slice(2);
  const config: MutableEvalCLIConfig = { ...DEFAULT_CONFIG };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      config.help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      config.version = true;
      continue;
    }

    if (arg === "--include-judge") {
      config.includeJudge = true;
      continue;
    }

    if (arg === "--judge-provider") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }
      config.judgeProvider = next;
      index += 1;
      continue;
    }

    if (arg === "--judge-model") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }
      config.judgeModel = next;
      index += 1;
      continue;
    }

    if (arg === "--generator") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }
      validateGenerator(next);
      config.generator = next;
      index += 1;
      continue;
    }

    if (arg === "--compare") {
      config.compare = true;
      continue;
    }

    if (arg === "--save-baseline") {
      config.saveBaseline = true;
      continue;
    }

    if (arg === "--suite" || arg === "--case") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }

      if (arg === "--suite") {
        config.suite = next;
      } else {
        config.caseId = next;
      }

      index += 1;
      continue;
    }

    if (arg === "--report") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }

      validateReportFormat(next);
      config.reportFormat = next;
      index += 1;
      continue;
    }

    if (arg === "--tags") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a value");
      }

      config.tags = next.split(",").map((tag) => tag.trim()).filter(Boolean);
      index += 1;
      continue;
    }

    if (arg === "--threshold") {
      const next = args[index + 1];
      if (next === undefined || next.startsWith("-")) {
        throw new CLIArgumentError(arg, "Expected a number");
      }

      const parsed = Number(next);
      if (Number.isNaN(parsed)) {
        throw new CLIArgumentError(arg, `Expected a number, got "${next}"`);
      }

      config.threshold = parsed;
      index += 1;
      continue;
    }

    throw new CLIArgumentError(arg, "Unknown flag");
  }

  return config;
}

function validateReportFormat(value: string): asserts value is "console" | "json" | "markdown" {
  if (value !== "console" && value !== "json" && value !== "markdown") {
    throw new CLIArgumentError("--report", `Expected "console", "json", or "markdown", got "${value}"`);
  }
}

function validateGenerator(value: string): asserts value is "placeholder" | "orchestrator" {
  if (value !== "placeholder" && value !== "orchestrator") {
    throw new CLIArgumentError("--generator", `Expected "placeholder" or "orchestrator", got "${value}"`);
  }
}

export function renderHelp(): string {
  return [
    "Usage: eval [options]",
    "",
    "Options:",
    "  --suite <name>        Filter to a specific suite (voice-fidelity, drift-regression, critic-regression)",
    "  --include-judge       Enable Voice Judge Layer 3 (slower, costs tokens)",
    "  --judge-provider <p>  Judge provider: groq, openai, anthropic, gemini, deepseek (default: groq)",
    "  --judge-model <m>     Judge model (default: llama-3.3-70b-versatile)",
    "  --generator <name>    Generation backend: placeholder (default) or orchestrator",
    "  --compare             Compare results against the latest baseline",
    "  --report <format>     Output format: console (default), json, markdown",
    "  --save-baseline       Persist results as a new baseline",
    "  --case <id>           Run a specific case by ID",
    "  --tags <tags>         Filter cases by comma-separated tags",
    "  --threshold <number>  Regression threshold override (default: 5)",
    "  --help, -h            Show this help message",
    "  --version, -v         Show version"
  ].join("\n");
}

export function renderVersion(): string {
  return "eval v0.1.0";
}
