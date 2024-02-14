/** @internal */
export function hasSecretFlag(description?: string): boolean {
	return /secret/i.test(description ?? "");
}