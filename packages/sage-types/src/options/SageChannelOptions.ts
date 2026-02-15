import type { ChannelOptions } from "./ChannelOptions.js";
import type { DialogOptions } from "./DialogOptions.js";
import type { DiceOptions } from "./DiceOptions.js";
import type { GameSystemOptions } from "./GameSystemOptions.js";

export type SageChannelOptions = DialogOptions & DiceOptions & GameSystemOptions & ChannelOptions;
