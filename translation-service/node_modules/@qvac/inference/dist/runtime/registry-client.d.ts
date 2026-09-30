import { QVACRegistryClient } from '@qvac/registry-client';
export declare function getRegistryClient(): Promise<QVACRegistryClient>;
export declare function closeRegistryClient(): Promise<void>;
export declare function hasActiveRegistryClient(): boolean;
