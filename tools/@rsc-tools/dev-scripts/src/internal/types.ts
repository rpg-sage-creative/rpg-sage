
export type Action = "deploy" | "env";

export type Where = "local" | "docker" | "dev" | "beta" | "stable";

export type CodeName = "dev" | "beta" | "stable";

export type What = "bot" | "map" | "services";

export type Ghost = "ghost";

export type Force = "--force";

export type ArgDataItem = {
	argIndex?: number;
	prompt: string;
	values: string[];
	defValue?: string;
};

export type ArgData = Record<string, ArgDataItem>;
