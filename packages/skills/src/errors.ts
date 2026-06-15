import { Data } from "effect";

export class SkillAlreadyRegisteredError extends Data.TaggedError("SkillAlreadyRegisteredError")<{
  readonly name: string;
}> {}

export class SkillDefinitionInvalidError extends Data.TaggedError("SkillDefinitionInvalidError")<{
  readonly name?: string;
  readonly message: string;
}> {}

export class SkillPathForbiddenError extends Data.TaggedError("SkillPathForbiddenError")<{
  readonly resolvedPath: string;
}> {}

export class SkillModuleInvalidError extends Data.TaggedError("SkillModuleInvalidError")<{
  readonly source: string;
  readonly message: string;
}> {}

export class SkillModuleLoadError extends Data.TaggedError("SkillModuleLoadError")<{
  readonly source: string;
  readonly message: string;
}> {}

export class SkillTemplateError extends Data.TaggedError("SkillTemplateError")<{
  readonly template: string;
  readonly message: string;
}> {}

export class SkillSpecifierError extends Data.TaggedError("SkillSpecifierError")<{
  readonly specifier: string;
  readonly message: string;
}> {}

export class SkillPackageNameError extends Data.TaggedError("SkillPackageNameError")<{
  readonly packageName?: string;
  readonly message: string;
}> {}

export class LanguageProfileNotFoundError extends Data.TaggedError("LanguageProfileNotFoundError")<{
  readonly code: string;
}> {}
