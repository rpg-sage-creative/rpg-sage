import { HasSource, type SourcedCore } from "./base/HasSource.js";

// export type TraitCore = SourcedCore<"Trait">;
/*// export interface TraitCore extends SourcedCore<"Trait"> { }*/

export class Trait extends HasSource<SourcedCore<"Trait">> {
}
