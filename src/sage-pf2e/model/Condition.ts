import { HasSource, type SourcedCore } from "./base/HasSource.js";

export type ConditionCore = SourcedCore<"Condition">;
/*//export interface ConditionCore extends SourcedCore<"Condition"> { }*/

export class Condition extends HasSource<ConditionCore> {
}
