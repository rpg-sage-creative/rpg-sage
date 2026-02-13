export function renameProperty<Core extends Record<string, any>, Key extends keyof Core>({ core, oldKey, newKey }: { core:Core; oldKey:Key; newKey:Key; }): void {
	if (oldKey in core) {
		if (newKey in core) throw new Error(`${String(oldKey)} *AND* ${String(newKey)}!?`);
		core[newKey] = core[oldKey];
		delete core[oldKey];
	}
}