import { cloneJson } from "@rsc-utils/core-utils";
import { HasSource, type SourcedCore } from "../model/base/HasSource.js";
import { Metadata, type IHasMetadata, type IMetadata } from "./Metadata.js";

export interface FeatureCore extends SourcedCore<"Feature"> {
	level: number;
	metadata: Partial<IMetadata>;
}

export class Feature extends HasSource<FeatureCore, "Feature"> implements IHasMetadata {

	public constructor(core: FeatureCore) {
		super(core);
		/*// this.id = base.createId(core.objectType, core.name, String(core.level || 0), core.source || "");*/
		this.hasMetadata = Object.keys(core.metadata || {}).length > 0;
		this.metadata = new Metadata(core.metadata);
	}

	public hasMetadata: boolean;
	public get level(): number { return this.core.level ?? 0; }
	public metadata: Metadata;

	public clone(): Feature { return new Feature(cloneJson(this.core)); }

}
