import type { SourcedCore } from "./base/HasSource";
import { HasSource } from "./base/HasSource";

export type ConditionCore = SourcedCore<"Condition">;
/*//export interface ConditionCore extends SourcedCore<"Condition"> { }*/

export class Condition extends HasSource<ConditionCore> {
}
