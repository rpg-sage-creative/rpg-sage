import type { DialogOptions } from "../DialogOptions/DialogOptions.js";
import type { DiceOptions } from "../DiceOptions/DiceOptions.js";
import type { GameSystemOptions } from "./GameSystemOptions.js";

export type ServerOptions = DialogOptions & DiceOptions & GameSystemOptions;