import type { ICreatureLanguages } from "./ICreature";

export class CreatureLanguages {
	public constructor(private core: ICreatureLanguages) { }
	public get languages(): string[] { return this.core?.languages ?? []; }
	public get special(): string { return this.core?.special ?? ""; }
}
