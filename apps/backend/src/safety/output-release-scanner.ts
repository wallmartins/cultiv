export interface UnsafeCodeScanResult {
  readonly unsafe: boolean;
  readonly category?: "destructive" | "exfiltrative" | "out_of_scope";
  readonly rationale?: string;
}

export interface SensitiveDataScanResult {
  readonly leaked: boolean;
  readonly category?: string;
  readonly sanitized?: string;
}

export interface OutputReleaseScannerAdapter {
  readonly scanForUnsafeCode: (content: string, context: { readonly contentType: string }) => UnsafeCodeScanResult;
  readonly scanForSensitiveDataLeak: (content: string) => SensitiveDataScanResult;
}

function containsDestructivePatterns(content: string): boolean {
  const destructive = [
    /rm\s+-rf\s+\/[^\s]*$/gim,
    /format\s+c:/gim,
    /dd\s+if=.+of=\/dev\/sda/gim,
    /drop\s+database\s+/gim,
    /delete\s+from\s+.+where\s+/gim
  ];
  return destructive.some((pattern) => pattern.test(content));
}

function containsExfiltrativePatterns(content: string): boolean {
  const exfiltrative = [
    /fetch\(.+?\)\s*\.then\(.*?=>\s*console\.log/gim,
    /process\.env\.[A-Z_]+/gim,
    /document\.cookie/gim,
    /localStorage\.getItem/gim,
    /XMLHttpRequest\(\).*?open\(/gim
  ];
  return exfiltrative.some((pattern) => pattern.test(content));
}

function containsOperationalLeakPatterns(content: string): boolean {
  const operational = [
    /system\s+prompt\s*[:=]/gim,
    /hidden\s+instruction/gim,
    /operational\s+context\s*[:=]/gim,
    /internal\s+policy/gim
  ];
  return operational.some((pattern) => pattern.test(content));
}

function containsPromptEchoPatterns(content: string): boolean {
  const promptEcho = [
    /ignore\s+previous\s+instructions/gim,
    /reveal\s+the\s+system\s+prompt/gim,
    /you\s+are\s+an\s+ai\s+assistant/gim,
    /as\s+a\s+language\s+model/gim
  ];
  return promptEcho.some((pattern) => pattern.test(content));
}

export function createHeuristicOutputReleaseScannerAdapter(): OutputReleaseScannerAdapter {
  return {
    scanForUnsafeCode: (content, context) => {
      if (containsDestructivePatterns(content)) {
        return { unsafe: true, category: "destructive", rationale: "Output contains destructive code patterns" };
      }
      if (containsExfiltrativePatterns(content)) {
        return { unsafe: true, category: "exfiltrative", rationale: "Output contains exfiltrative code patterns" };
      }
      return { unsafe: false };
    },
    scanForSensitiveDataLeak: (content) => {
      if (containsOperationalLeakPatterns(content) || containsPromptEchoPatterns(content)) {
        const sanitized = content
          .replace(/system\s+prompt\s*[:=].*?(\n|$)/gim, "[redacted-system-prompt]$1")
          .replace(/hidden\s+instruction.*?(\n|$)/gim, "[redacted-instruction]$1")
          .replace(/operational\s+context\s*[:=].*?(\n|$)/gim, "[redacted-context]$1")
          .replace(/ignore\s+previous\s+instructions/gim, "[redacted-override-attempt]")
          .replace(/reveal\s+the\s+system\s+prompt/gim, "[redacted-exfiltration-attempt]");
        return {
          leaked: true,
          category: "operational_leak",
          sanitized
        };
      }
      return { leaked: false };
    }
  };
}
