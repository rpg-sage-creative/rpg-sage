import type { ArgData } from "./types.js";
export declare function getArgs<U extends Record<Key, string | undefined>, T extends ArgData = ArgData, Key extends keyof T = keyof T>(argData: T): Promise<U>;
