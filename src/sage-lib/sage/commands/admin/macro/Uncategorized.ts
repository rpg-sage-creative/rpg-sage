export type Uncategorized = "Uncategorized";
export const Uncategorized: Uncategorized = "Uncategorized";
export function isUncategorized(value?: string): value is Uncategorized {
	return value === Uncategorized;
}
