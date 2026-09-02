export function renameProperty<Core extends Record<string, any>, Key extends keyof Core>({ core, oldKey, newKey }: { core:Core; oldKey:Key; newKey:Key; }): void {
	if (oldKey in core) {
		if (core[oldKey] !== null && core[oldKey] !== undefined && !(newKey in core)) {
			core[newKey] = core[oldKey];
		}
		delete core[oldKey];
	}
}