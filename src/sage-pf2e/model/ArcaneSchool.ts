import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

export interface ArcaneSchoolCore extends SourcedCore<"ArcaneSchool"> {
	moniker: string;
}

export default class ArcaneSchool extends HasSource<ArcaneSchoolCore> {

	public get abbrev(): string { return this.core.name.slice(0, 3); }
	public get moniker(): string { return this.core.moniker ?? ""; }
}
