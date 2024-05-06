import { isDefined } from "@rsc-utils/type-utils";
import { ChannelOptions, SageChannelType } from "../SageChannel.js";

export type OldChannelOptions = ChannelOptions & {
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

export function updateChannelOptions(options: OldChannelOptions): void {
	if (!isDefined(options.type)) {
		const gameMaster = options.gameMaster;
		const player = options.player;
		const nonPlayer = options.nonPlayer;

		if (isDefined(gameMaster) || isDefined(player) || isDefined(nonPlayer)) {
			const gmWrite = gameMaster === 3;
			const pcWrite = player === 3;
			const bothWrite = gmWrite && pcWrite;
			const bothBlock = !gameMaster && !player;

			const allowDialog = options.dialog === true;
			const allowCommands = options.serverAdmin || options.gameAdmin || options.admin || options.search || options.commands;
			const allowDice = options.dice === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!allowDialog || allowCommands);
			const ic = bothWrite && !ooc && allowDialog;
			const dice = bothWrite && allowDice && !gm && !ooc && !ic;
			const none = bothBlock;
			const misc = !ic && !ooc && !gm && !dice && !none;

			if (ic) {
				options.type = SageChannelType.InCharacter;
			}
			if (gm) {
				options.type = SageChannelType.GameMaster;
			}
			if (ooc) {
				options.type = SageChannelType.OutOfCharacter;
			}
			if (dice) {
				options.type = SageChannelType.Dice;
			}
			if (misc) {
				options.type = SageChannelType.Miscellaneous;
			}
			if (none) {
				options.type = SageChannelType.None;
			}
		}
	}

	if (isDefined(options.gameAdmin)) delete options.gameAdmin;
	if (isDefined(options.serverAdmin)) delete options.serverAdmin;
	if (isDefined(options.admin)) delete options.admin;
	if (isDefined(options.commands)) delete options.commands;
	if (isDefined(options.dialog)) delete options.dialog;
	if (isDefined(options.dice)) delete options.dice;
	if (isDefined(options.search)) delete options.search;

	if (isDefined(options.gameMaster)) delete options.gameMaster;
	if (isDefined(options.player)) delete options.player;
	if (isDefined(options.nonPlayer)) delete options.nonPlayer;
}