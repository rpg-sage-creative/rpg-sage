export declare function parseArgsAndOptions<T extends Record<string, string | number>>(sliceIndex?: number): {
    args: string[];
    options: T;
};
