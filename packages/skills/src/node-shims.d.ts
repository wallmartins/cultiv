declare const process: {
  cwd(): string;
};

declare module "node:path" {
  export function isAbsolute(path: string): boolean;
  export function resolve(...paths: string[]): string;
  export const sep: string;
}

declare module "node:url" {
  export function pathToFileURL(path: string): { href: string };
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
}

declare module "node:fs/promises" {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
  export function readdir(path: string): Promise<string[]>;
  export function rm(path: string): Promise<void>;
  export function stat(path: string): Promise<{ mtimeMs: number }>;
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
}
