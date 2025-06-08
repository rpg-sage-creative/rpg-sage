export function hasSecretFlag(description?: string): boolean {
	return /\bsecret\b/i.test(description ?? "");
}