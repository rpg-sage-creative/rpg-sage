import type { CodeName, Ghost, Where } from "./types.js";
type Args = {
    codeName?: CodeName;
    where: Where;
    ghost?: Ghost;
};
/**
 * Create env json files for running the bot or services
 */
export declare function writeEnvJson({ codeName, where, ghost }: Args): Promise<void>;
export {};
