import type { ActionCore } from "./Action";
import { Action } from "./Action";

export type ActivityCore = ActionCore<"Activity">;

export class Activity extends Action<"Activity", ActivityCore> {
}
