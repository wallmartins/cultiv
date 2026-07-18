// One answer to "does this look like a secret?", shared by the Input Safety Gateway's
// inspection and the redaction service so a field like `credential_id` can't be classified
// one way and redacted another. The output-release scanner is a separate concern and does
// not consume this kernel.

export const SECRET_LIKE_FIELD_PATTERNS: readonly string[] = [
  "api_key",
  "apikey",
  "api-key",
  "secret",
  "token",
  "password",
  "private_key",
  "privatekey",
  "credential",
  "auth",
  "authorization",
  "access_key",
  "accesskey",
  "key_id",
  "keyid",
  "bearer"
];

export function isSecretLikeFieldName(
  fieldName: string,
  patterns: readonly string[] = SECRET_LIKE_FIELD_PATTERNS
): boolean {
  const lower = fieldName.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

const SECRET_LIKE_VALUE_PATTERNS: readonly RegExp[] = [
  /\bapi[_\s-]?key\b/i,
  /\bauthorization:\s*bearer\b/i,
  /\bsecret[_\s-]?access[_\s-]?key\b/i,
  /\bpassword\s*[:=]/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bssh-rsa\b/
];

export function containsSecretLikeValue(text: string): boolean {
  return SECRET_LIKE_VALUE_PATTERNS.some((pattern) => pattern.test(text));
}
