type PromptOptions = {
    prompt: string;
    values: string[];
    defValue?: string;
};
/**
 * Function to prompt user via CLI with options
 */
export declare function promptUser({ prompt, values, defValue }: PromptOptions): Promise<string | undefined>;
export {};
