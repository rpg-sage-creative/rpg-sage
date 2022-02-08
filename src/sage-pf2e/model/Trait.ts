import type { SourcedCore } from "./base/HasSource";
import HasSource from "./base/HasSource";

// export type TraitCore = SourcedCore<"Trait">;
/*// export interface TraitCore extends SourcedCore<"Trait"> { }*/

export default class Trait extends HasSource<SourcedCore<"Trait">> {
}
