import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { StatBlockProcessor } from "@rsc-utils/dice-utils";
import type { CharacterManager } from "../../../model/CharacterManager.js";
import type { GameCharacter } from "../../../model/GameCharacter.js";
import type { DiceMacroBase } from "../../../model/Macro.js";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { EncounterManager } from "../../trackers/encounter/EncounterManager.js";

export type StatMacroCharacters = {
	actingCharacter?: GameCharacter;

	primaryPlayerCharacter?: GameCharacter;
	primaryCompanionCharacter?: GameCharacter;

	gmCharacters?: GameCharacter[];
	playerCharacters?: CharacterManager;
	nonPlayerCharacters?: CharacterManager;

	encounters?: EncounterManager;
};

function getStatMacroCharacters(sageCommand: SageCommand): StatMacroCharacters {
	const { game, server, isPlayer, sageUser, canAdminGame } = sageCommand;
	// if a game exists but we don't belong to it or aren't an admin, we don't need stats
	if (!game || canAdminGame || isPlayer) {
		const actingCharacter = sageCommand.getActiveCharacter();

		const primaryPlayerCharacter = game ? game.playerCharacters.findByUser(sageUser.did) : sageUser.playerCharacters[0];
		const primaryCompanionCharacter = primaryPlayerCharacter?.companions[0];

		const gameGmCharacter = game?.gmCharacter;
		const serverGmCharacter = server?.gmCharacter;
		const gmCharacters = [gameGmCharacter, serverGmCharacter].filter(char => char) as GameCharacter[];

		const { playerCharacters, nonPlayerCharacters } = game ?? sageUser;

		const encounters = game?.encounters;

		return {
			actingCharacter,

			primaryPlayerCharacter,
			primaryCompanionCharacter,

			gmCharacters,
			playerCharacters,
			nonPlayerCharacters,

			encounters,
		};
	}
	return { };
}

function getMacrosFromChars(chars: StatMacroCharacters, actor: { id?:Snowflake, isGameMaster?:boolean; }): DiceMacroBase[] {
	const macros: DiceMacroBase[] = [];
	macros.push(...getMacrosFromChar(chars.actingCharacter, actor.id, true));
	macros.push(...getMacrosFromChar(chars.primaryPlayerCharacter, actor.id, true));
	macros.push(...getMacrosFromChar(chars.primaryCompanionCharacter, actor.id, true));
	if (actor.isGameMaster) {
		chars.gmCharacters?.forEach(gmChar =>
			macros.push(...getMacrosFromChar(gmChar, actor.id, true))
		);
	}
	chars.playerCharacters?.forEach(pcChar =>
		macros.push(...getMacrosFromChar(pcChar, actor.id))
	);
	chars.nonPlayerCharacters?.forEach(npcChar =>
		macros.push(...getMacrosFromChar(npcChar, actor.id))
	);
	return macros;
}

function getMacrosFromChar(char: Optional<GameCharacter>, userId?: Snowflake, override?: boolean): DiceMacroBase[] {
	const out: DiceMacroBase[] = [];
	if (!char) return out;

	const macros = [
		...char.macros,
		...(char.pathbuilder?.getAttackMacros() ?? []),
		...(char.pathbuilder?.getSpellMacros() ?? []),
	];

	// if the char belongs to the active user
	if (char.userDid === userId || override) {
		// check all the macros
		for (const macro of macros) {
			if (macro.dice) {
				// grab the macro if it has a unique name/category combo
				if (!out.some(m => macro.name.toLowerCase() === m.name.toLowerCase() && m.category === char.name)) {
					out.push({ name:macro.name, category:char.name, dice:macro.dice });
				}
			}
		}
	}

	// fetch from companions as well
	for (const companion of char.companions) {
		out.push(...getMacrosFromChar(companion, userId, override));
	}

	return out;
}

export class StatMacroProcessor extends StatBlockProcessor {
	protected constructor(chars: StatMacroCharacters, public macros: DiceMacroBase[]) {
		super(chars);
	}

	public get hasMacros(): boolean {
		return this.macros.length > 0;
	}

	public clone(): StatMacroProcessor {
		return new StatMacroProcessor({ ...this.chars } as StatMacroCharacters, this.macros.slice());
	}

	public for(char: GameCharacter): StatMacroProcessor {
		return super.for(char) as StatMacroProcessor;
	}

	public static from(sageCommand: SageCommand): StatMacroProcessor {
		const chars = getStatMacroCharacters(sageCommand);
		const macros = getMacrosFromChars(chars, sageCommand.actor);
		return new StatMacroProcessor(chars, macros);
	}
}