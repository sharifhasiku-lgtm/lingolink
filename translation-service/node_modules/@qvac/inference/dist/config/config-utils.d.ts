import { type QvacConfig } from '../schemas/index.js';
export type { QvacConfig };
export declare function validateConfig(config: unknown): QvacConfig;
export declare function parseJsonConfig(content: string, filePath: string): unknown;
