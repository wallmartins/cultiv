# ADR 0026: TypeScript-Native Client SDK as the Primary Consumer

The public backend API will be consumed primarily through a TypeScript-native client SDK rather than directly by web or mobile applications, and that SDK will live in the same TypeScript ecosystem as the backend contracts. We chose this because the product stack is already TypeScript-centric, a native SDK reduces duplication and integration drift, and it keeps the public HTTP contract narrow while still allowing future OpenAPI export if external consumers become a priority later.
