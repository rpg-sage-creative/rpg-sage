import type { ActionCore } from "./Action";
import Action from "./Action";

export type ActivityCore = ActionCore<"Activity">;

export default class Activity extends Action<"Activity", ActivityCore> {
}
