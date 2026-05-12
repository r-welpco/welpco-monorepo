// Re-export from the shared database package to avoid duplication.
// All entity files import BaseEntity from this path — this re-export
// keeps those imports working while consolidating the definition.
export { BaseEntity } from '@welpco/database';
