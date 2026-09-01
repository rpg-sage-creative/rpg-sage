import { Action, type ActionCore } from "./Action.js";

export type ActivityCore = ActionCore<"Activity">;

export class Activity extends Action<"Activity", ActivityCore> {
}
