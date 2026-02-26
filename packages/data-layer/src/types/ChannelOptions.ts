import { isDefined } from "@rsc-utils/core-utils";
import { assertNumber, type EnsureContext, optional } from "../validation/index.js";
import { SageChannelType } from "./enums/SageChannelType.js";

export type ChannelOptionsAny = ChannelOptionsOld | ChannelOptions;

export type ChannelOptionsOld = ChannelOptions & {
	/** @deprecated */
	gameAdmin?: boolean;
	/** @deprecated */
	serverAdmin?: boolean;
	/** @deprecated */
	admin?: boolean;
	/** @deprecated */
	commands?: boolean;
	/** @deprecated */
	dialog?: boolean;
	/** @deprecated */
	dice?: boolean;
	/** @deprecated */
	search?: boolean;
	/** @deprecated */
	gameMaster?: number;
	/** @deprecated */
	player?: number;
	/** @deprecated */
	nonPlayer?: number;
};

export type ChannelOptions = {
	type: SageChannelType;
};

export const ChannelOptionsV1Keys: (keyof ChannelOptions)[] = [
	"type",
];

export function assertChannelOptions(objectType: string, core: ChannelOptions): core is ChannelOptions {
	if (!assertNumber({ core, objectType, key:"type", optional, validator:SageChannelType })) return false;
	return true;
}

export function ensureChannelOptions(core: ChannelOptionsOld, _context?: EnsureContext): ChannelOptions {
	if (!isDefined(core.type)) {
		const gameMaster = core.gameMaster;
		const player = core.player;
		const nonPlayer = core.nonPlayer;

		if (isDefined(gameMaster) || isDefined(player) || isDefined(nonPlayer)) {
			const gmWrite = gameMaster === 3;
			const pcWrite = player === 3;
			const bothWrite = gmWrite && pcWrite;
			const bothBlock = !gameMaster && !player;

			const allowDialog = core.dialog === true;
			const allowCommands = core.serverAdmin || core.gameAdmin || core.admin || core.search || core.commands;
			const allowDice = core.dice === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!allowDialog || allowCommands);
			const ic = bothWrite && !ooc && allowDialog;
			const dice = bothWrite && allowDice && !gm && !ooc && !ic;
			const none = bothBlock;
			const misc = !ic && !ooc && !gm && !dice && !none;

			if (ic) {
				core.type = SageChannelType.InCharacter;
			}
			if (gm) {
				core.type = SageChannelType.GameMaster;
			}
			if (ooc) {
				core.type = SageChannelType.OutOfCharacter;
			}
			if (dice) {
				core.type = SageChannelType.Dice;
			}
			if (misc) {
				core.type = SageChannelType.Miscellaneous;
			}
			if (none) {
				core.type = SageChannelType.None;
			}
		}
	}

	// delete unused old stuff
	delete core.gameAdmin;
	delete core.serverAdmin;
	delete core.admin;
	delete core.commands;
	delete core.dialog;
	delete core.dice;
	delete core.search;
	delete core.gameMaster;
	delete core.player;
	delete core.nonPlayer;

	return core as ChannelOptions;
}