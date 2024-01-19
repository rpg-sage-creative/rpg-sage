export * from "./common";
export * from "./dice/base/types";
export * from "./dice/discord";
export * from "./tables";

import { Dice } from "./dice/base/index";
export const roll = Dice.roll;
