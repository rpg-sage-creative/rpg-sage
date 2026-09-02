import { HasSource, type SourcedCore } from "./base/HasSource.js";

export interface ArcaneSchoolCore extends SourcedCore<"ArcaneSchool"> {
	moniker: string;
}

export class ArcaneSchool extends HasSource<ArcaneSchoolCore> {

	public get abbrev(): string { return this.core.name.slice(0, 3); }
	public get moniker(): string { return this.core.moniker ?? ""; }
}
