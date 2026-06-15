import { Effect } from "effect";
import { isAbsolute, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { SkillModuleInvalidError, SkillModuleLoadError, SkillPackageNameError, SkillPathForbiddenError, SkillSpecifierError } from "./errors.js";
import type { LoadOptions, SkillDefinition, SkillLoaderOptions } from "./types.js";
import { validateSkillDefinition } from "./validation.js";
import { resolveContextPath } from "./context-path.js";
export { resolveContextPath };

export function loadSkill(specifier: string, options: LoadOptions): Effect.Effect<SkillDefinition, import("./types.js").SkillError> {
  const { registry, ...resolverOptions } = options;
  return Effect.gen(function* () {
    const skill = yield* resolveSkill(specifier, resolverOptions);
    yield* registry.register(skill);
    return skill;
  });
}

export function loadSkills(specifiers: string[], options: LoadOptions): Effect.Effect<SkillDefinition[], import("./types.js").SkillError> {
  return Effect.forEach(specifiers, (specifier) => loadSkill(specifier, options));
}

export function resolveSkill(
  specifier: string,
  options: SkillLoaderOptions = {}
): Effect.Effect<SkillDefinition, import("./types.js").SkillLoadError> {
  if (!specifier || typeof specifier !== "string") {
    return Effect.fail(
      new SkillSpecifierError({
        specifier: String(specifier),
        message: "Skill specifier is required"
      })
    );
  }

  if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith(".\\") || specifier.startsWith("..\\") || isAbsolute(specifier)) {
    return resolveSkillFromFile(specifier, options);
  }

  return resolveSkillFromPackage(specifier);
}

export function resolveSkillFromFile(
  filePath: string,
  options: SkillLoaderOptions = {}
): Effect.Effect<SkillDefinition, import("./types.js").SkillLoadError> {
  const { baseDir = process.cwd(), allowedDirs } = options;
  const resolvedPath = isAbsolute(filePath) ? filePath : resolve(baseDir, filePath);
  return Effect.gen(function* () {
    yield* validateAllowedPath(resolvedPath, allowedDirs);
    const module = yield* Effect.tryPromise({
      try: () => import(pathToFileURL(resolvedPath).href),
      catch: (error) =>
        new SkillModuleLoadError({
          source: filePath,
          message: `Failed to load skill from "${filePath}": ${error instanceof Error ? error.message : String(error)}`
        })
    });

    return yield* validateLoadedSkill(module, filePath);
  });
}

export function resolveSkillFromPackage(
  packageName: string
): Effect.Effect<SkillDefinition, import("./types.js").SkillLoadError> {
  if (!packageName || typeof packageName !== "string") {
    return Effect.fail(new SkillPackageNameError({ message: "Package name is required" }));
  }

  const validPackagePattern = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
  if (!validPackagePattern.test(packageName)) {
    return Effect.fail(
      new SkillPackageNameError({
        packageName,
        message: `Invalid package name format: "${packageName}"`
      })
    );
  }

  return Effect.gen(function* () {
    const module = yield* Effect.tryPromise({
      try: () => import(packageName),
      catch: (error) =>
        new SkillModuleLoadError({
          source: packageName,
          message: `Failed to load skill from package "${packageName}": ${error instanceof Error ? error.message : String(error)}`
        })
    });

    return yield* validateLoadedSkill(module, packageName);
  });
}

function validateAllowedPath(
  resolvedPath: string,
  allowedDirs?: readonly string[]
): Effect.Effect<void, SkillPathForbiddenError> {
  if (!allowedDirs || allowedDirs.length === 0) return Effect.void;

  const normalized = resolve(resolvedPath);
  const allowed = allowedDirs.some((dir) => {
    const normalizedDir = resolve(dir);
    return normalized === normalizedDir || normalized.startsWith(`${normalizedDir}${sep}`);
  });

  if (!allowed) {
    return Effect.fail(new SkillPathForbiddenError({ resolvedPath }));
  }

  return Effect.void;
}

function validateLoadedSkill(
  module: unknown,
  source: string
): Effect.Effect<SkillDefinition, SkillModuleInvalidError | import("./types.js").SkillLoadError> {
  if (!module || typeof module !== "object") {
    return Effect.fail(
      new SkillModuleInvalidError({
        source,
        message: `Skill module "${source}" does not export a valid object`
      })
    );
  }

  const mod = module as Record<string, unknown>;
  const skillExport =
    mod.default ??
    mod.skill ??
    Object.values(mod).find((value) => value && typeof value === "object" && "execute" in value);

  if (!skillExport || typeof skillExport !== "object") {
    return Effect.fail(
      new SkillModuleInvalidError({
        source,
        message: `Skill module "${source}" does not export a recognizable skill`
      })
    );
  }

  return validateSkillDefinition(skillExport as SkillDefinition);
}
