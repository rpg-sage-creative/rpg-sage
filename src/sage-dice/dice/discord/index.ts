import { HasCore, type IdCore } from "@rsc-utils/class-utils";
import type { OrNull, OrUndefined } from "@rsc-utils/type-utils";
import { randomUuid } from "@rsc-utils/uuid-utils";
import { GameType, parseGameType } from "../../../sage-common";
import {
	CritMethodType,
	DiceOutputType,
	DiceSecretMethodType,
	TDiceOutput,
	getCritMethodRegex,
	parseCritMethodType, parseDiceOutputType
} from "../../common";
import {
	Dice as baseDice,
	DiceGroup as baseDiceGroup,
	DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart
} from "../base";
import type {
	DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore,
	DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore, TDice as baseTDice,
	TDiceGroup as baseTDiceGroup,
	TDiceGroupRoll as baseTDiceGroupRoll,
	TDicePart as baseTDicePart
} from "../base/types";
import {
	DiceGroup as cncDiceGroup,
	DiceGroupRoll as cndDiceGroupRoll
} from "../cnc";
import {
	DiceGroup as dnd5eDiceGroup,
	DiceGroupRoll as dnd5eDiceGroupRoll
} from "../dnd5e";
import {
	DiceGroup as e20DiceGroup,
	DiceGroupRoll as e20DiceGroupRoll
} from "../essence20";
import {
	DiceGroup as pf2eDiceGroup,
	DiceGroupRoll as pf2eDiceGroupRoll
} from "../pf2e";
import {
	DiceGroup as questDiceGroup,
	DiceGroupRoll as questDiceGroupRoll
} from "../quest";
import {
	DiceGroup as vtm5eDiceGroup,
	DiceGroupRoll as vtm5eDiceGroupRoll
} from "../vtm5e";

const DICE_REGEX = /\[[^\]]*d\d+[^\]]*\]/ig;
const GAME_CHECK = /^(?:(cnc|dnd5e|e20|pf1e|pf2e|pf1|pf2|pf|sf1e|sf1|sf|5e|quest|vtm5|vtm5e)\b)?/i;
const DICE_OUTPUT_CHECK = /^(?:(xxs|xs|s|m|xxl|xl|l|rollem)\b)?/i;
const COUNT_CHECK = /^(\d+)(map\-\d+)?\#/i;

function getDiceGroupForGame(gameType: GameType): typeof baseDiceGroup {
	switch (gameType) {
		case GameType.CnC: return <typeof baseDiceGroup>cncDiceGroup;
		case GameType.DnD5e: return <typeof baseDiceGroup>dnd5eDiceGroup;
		case GameType.E20: return <typeof baseDiceGroup>e20DiceGroup;
		case GameType.PF2e: return <typeof baseDiceGroup>pf2eDiceGroup;
		case GameType.Quest: return <typeof baseDiceGroup>questDiceGroup;
		case GameType.VtM5e: return <typeof baseDiceGroup>vtm5eDiceGroup;
		default: return baseDiceGroup;
	}
}

function parseDice(diceString: string, gameType?: GameType, diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: CritMethodType): baseTDiceGroup {
	switch (gameType) {
		case GameType.CnC:
			return cncDiceGroup.parse(diceString, diceOutputType);
		case GameType.DnD5e:
			return dnd5eDiceGroup.parse(diceString, diceOutputType, diceSecretMethodType, critMethodType);
		case GameType.E20:
			return e20DiceGroup.parse(diceString, diceOutputType);
		case GameType.PF2e:
			return pf2eDiceGroup.parse(diceString, diceOutputType, diceSecretMethodType, critMethodType);
		case GameType.Quest:
			return questDiceGroup.parse(diceString, diceOutputType);
		case GameType.VtM5e:
			return vtm5eDiceGroup.parse(diceString, diceOutputType);
		default:
			return baseDiceGroup.parse(diceString, diceOutputType, diceSecretMethodType);
	}
}

function cloneDicePart<T extends baseDicePartCore, U extends baseTDicePart>(clss: typeof baseDicePart, core: T): U {
	return <U>clss.fromCore({
		count: core.count,
		description: core.description,
		dropKeep: core.dropKeep ? { ...core.dropKeep } : undefined,
		fixedRolls: core.fixedRolls,
		gameType: core.gameType,
		id: randomUuid(),
		modifier: core.modifier,
		noSort: core.noSort,
		objectType: core.objectType,
		sides: core.sides,
		sign: core.sign,
		test: core.test
	});
}

function cloneDice<T extends baseDiceCore, U extends baseTDice>(clss: typeof baseDice, core: T, map: number): U {
	const diceParts = core.diceParts.map(dicePartCore => cloneDicePart(clss.Part, dicePartCore).toJSON());
	const hasD20 = diceParts.find(dicePartCore => dicePartCore.count > 0 && dicePartCore.sides === 20);
	if (map && hasD20) {
		const gameType = diceParts[0].gameType;
		const mapCore = <baseDicePartCore>{
			count: 0,
			description: "<i>(MAP)</i>",
			dropKeep: undefined,
			fixedRolls: diceParts[0].fixedRolls,
			gameType: gameType,
			id: randomUuid(),
			modifier: Math.abs(map),
			noSort: false,
			objectType: "DicePart",
			sides: 0,
			sign: map < 0 ? "-" : "+",
			test: undefined
		};
		const otherCore = diceParts.find(dicePartCore => !dicePartCore.count && !dicePartCore.sides && !dicePartCore.modifier);
		if (otherCore) {
			//no need to shuffle test; put before otherCore
			diceParts.splice(diceParts.indexOf(otherCore), 0, mapCore);
		}else {
			const testCore = diceParts.find(dicePartCore => dicePartCore.test);
			if (!testCore) {
				//no need to shuffle test; append to array
				diceParts.push(mapCore);
			}else if (!testCore.count && !testCore.sides && !testCore.modifier) {
				// just a test; insert before testCore
				diceParts.splice(diceParts.indexOf(testCore), 0, mapCore);
			}else {
				// split dice/mod from test
				// const newTestCore = <baseDicePartCore>{ count:0, description:"", dropKeep:null, gameType:gameType, id:randomUuid(), modifier:0, noSort:false, objectType:"DicePart", sides:0, sign:"+", test:testCore.test };
				mapCore.test = testCore.test;
				delete testCore.test;
				//put mapCore and newTestCore after testCore //, newTestCore); <-- after splice
				diceParts.splice(diceParts.indexOf(testCore)+ 1, 0, mapCore);
			}
		}
	}
	return <U>clss.fromCore({
		diceParts: diceParts,
		gameType: core.gameType,
		id: randomUuid(),
		objectType: <"Dice">core.objectType
	});
}

function cloneDiceGroup<T extends baseDiceGroupCore, U extends baseTDiceGroup>(clss: typeof baseDiceGroup, core: T, map: number): U {
	return <U>clss.fromCore({
		critMethodType: core.critMethodType,
		dice: core.dice.map(diceCore => cloneDice(clss.Part, diceCore, map).toJSON()),
		diceOutputType: core.diceOutputType,
		diceSecretMethodType: core.diceSecretMethodType,
		gameType: core.gameType,
		id: randomUuid(),
		objectType: <"DiceGroup">core.objectType
	});
}

interface DiscordDiceCore extends IdCore<"DiscordDice"> {
	diceGroups: baseDiceGroupCore[];
}

export class DiscordDice extends HasCore<DiscordDiceCore, "DiscordDice"> {
	private _diceGroups?: baseTDiceGroup[];
	public get diceGroups(): baseTDiceGroup[] {
		if (!this._diceGroups) {
			this._diceGroups = this.core.diceGroups.map(core => {
				switch (core.gameType) {
					case GameType.CnC:
						return cncDiceGroup.fromCore(core);
					case GameType.DnD5e:
						return dnd5eDiceGroup.fromCore(core);
					case GameType.E20:
						return e20DiceGroup.fromCore(core);
					case GameType.PF2e:
						return pf2eDiceGroup.fromCore(core);
					case GameType.Quest:
						return questDiceGroup.fromCore(core);
					case GameType.VtM5e:
						return vtm5eDiceGroup.fromCore(core);
					default:
						return baseDiceGroup.fromCore(core);
				}
			});
		}
		return this._diceGroups;
	}
	public get hasSecret(): boolean {
		return this.diceGroups.find(diceGroup => diceGroup.hasSecret) !== undefined;
	}

	public roll(): DiscordDiceRoll {
		return DiscordDiceRoll.create(this);
	}
	public toString(outputType?: DiceOutputType): string {
		return this.diceGroups.map(diceGroup => diceGroup.toString(outputType)).join("\n\n");
	}

	public static create(diceGroups: baseTDiceGroup[]): DiscordDice {
		const core: DiscordDiceCore = {
			objectType: "DiscordDice",
			id: randomUuid(),
			diceGroups: diceGroups.map<baseDiceGroupCore>(DiscordDice.toJSON)
		};
		return new DiscordDice(core);
	}
	public static fromCore(core: DiscordDiceCore): DiscordDice {
		return new DiscordDice(core);
	}
	public static parse({
		diceString,
		defaultGameType = GameType.None,
		defaultDiceOutputType,
		defaultCritMethodType = CritMethodType.Unknown,
		defaultDiceSecretMethodType = DiceSecretMethodType.Ignore
	}: {
		diceString: string;
		defaultGameType?: GameType;
		defaultDiceOutputType?: DiceOutputType;
		defaultCritMethodType?: CritMethodType;
		defaultDiceSecretMethodType?: DiceSecretMethodType;
	}): OrNull<DiscordDice> {
		const matchArray = diceString.match(DICE_REGEX);
		if (!matchArray) {
			return null;
		}

		const diceGroups: baseTDiceGroup[] = [];
		matchArray.map(match => match.slice(1, -1)).forEach(match => {
			let gameType: OrUndefined<GameType>;
			[match, gameType] = matchGameType(match, defaultGameType);

			let diceOutputType: OrUndefined<DiceOutputType>;
			[match, diceOutputType] = matchDiceOutputType(match, defaultDiceOutputType);

			let critMethodType: OrUndefined<CritMethodType>;
			[match, critMethodType] = matchCritMethodType(match, gameType, defaultCritMethodType);

			let count: number, map: number;
			[match, count, map] = matchCountAndMap(match);

			const diceGroup = parseDice(match, gameType, diceOutputType, defaultDiceSecretMethodType, critMethodType);
			diceGroups.push(diceGroup);
			if (count > 1) {
				const diceGroupClass = getDiceGroupForGame(diceGroup.gameType);
				const diceGroupCore = diceGroup.toJSON();
				for (let i = 1; i < count; i++) {
					diceGroups.push(cloneDiceGroup(diceGroupClass, diceGroupCore, gameType === GameType.PF2e ? map * i : 0));
				}
			}

			//TODO: change a 'check' (+1 perception) to a 1d20+mod format
		});
		return DiscordDice.create(diceGroups);
	}
}

/** Returns the GameType at the beginning of the match along with the rest of the match. */
function matchGameType(match: string, defaultGameType: OrUndefined<GameType>): [string, OrUndefined<GameType>] {
	const gameMatch = match.match(GAME_CHECK);
	if (gameMatch) {
		const gameTypeString = gameMatch[0];
		return [
			match.slice(gameTypeString.length).trim(),
			parseGameType(gameTypeString, defaultGameType)!
		];
	}
	return [match, defaultGameType];
}

/** Returns the DiceOutputType at the beginning of the match along with the rest of the match. */
function matchDiceOutputType(match: string, defaultDiceOutputType: OrUndefined<DiceOutputType>): [string, OrUndefined<DiceOutputType>] {
	const diceOutputMatch = match.match(DICE_OUTPUT_CHECK);
	if (diceOutputMatch) {
		const diceOutputTypeString = diceOutputMatch[0];
		return [
			match.slice(diceOutputTypeString.length).trim(),
			parseDiceOutputType(diceOutputTypeString, defaultDiceOutputType)!
		];
	}
	return [match, defaultDiceOutputType];
}

/** Returns the CritMethodType at the beginning of the match along with the rest of the match. */
function matchCritMethodType(match: string, gameType: OrUndefined<GameType>, defaultCritMethodType: OrUndefined<CritMethodType>): [string, OrUndefined<CritMethodType>] {
	const critMethodRegex = getCritMethodRegex(gameType);
	if (critMethodRegex) {
		const critMethodMatch = match.match(critMethodRegex);
		if (critMethodMatch) {
			const critMethodTypeString = critMethodMatch[0];
			return [
				match.slice(critMethodTypeString.length).trim(),
				parseCritMethodType(gameType, critMethodTypeString, defaultCritMethodType)!
			];
		}
	}
	return [match, defaultCritMethodType];
}

/** Returns the Count and MAP at the beginning of the match along with the rest of the match. */
function matchCountAndMap(match: string): [string, number, number] {
	const countMatch = match.match(COUNT_CHECK);
	if (countMatch) {
		const countString = countMatch[0];
		return [
			match.slice(countString.length).trim(),
			+countMatch[1],
			countMatch[2] && (+countMatch[2].slice(3)) || 0
		];
	}
	return [match, 1, 0];
}

interface DiscordDiceRollCore extends IdCore<"DiscordDiceRoll"> {
	discordDice: DiscordDiceCore;
	rolls: baseDiceGroupRollCore[];
}

export class DiscordDiceRoll extends HasCore<DiscordDiceRollCore> {
	private _discordDice?: DiscordDice;
	public get discordDice(): DiscordDice {
		if (!this._discordDice) {
			this._discordDice = DiscordDice.fromCore(this.core.discordDice);
		}
		return this._discordDice;
	}

	private _rolls?: baseTDiceGroupRoll[];
	public get rolls(): baseTDiceGroupRoll[] {
		if (!this._rolls) {
			this._rolls = this.core.rolls.map(core => {
				switch (core.gameType) {
					case GameType.CnC:
						return cndDiceGroupRoll.fromCore(core);
					case GameType.DnD5e:
						return dnd5eDiceGroupRoll.fromCore(core);
					case GameType.E20:
						return e20DiceGroupRoll.fromCore(core);
					case GameType.PF2e:
						return pf2eDiceGroupRoll.fromCore(core);
					case GameType.Quest:
						return questDiceGroupRoll.fromCore(core);
					case GameType.VtM5e:
						return vtm5eDiceGroupRoll.fromCore(core);
					default:
						return baseDiceGroupRoll.fromCore(core);
				}
			});
		}
		return this._rolls;
	}

	public get hasSecret(): boolean { return !!this.rolls.find(roll => roll.hasSecret); }

	public toString(outputType?: DiceOutputType, joiner = "\n"): string {
		if (this.rolls[0].gameType === GameType.Quest) {
			joiner = ", ";
		}
		return this.rolls.map(roll => {
			if ((roll.dice.diceOutputType ?? outputType) === DiceOutputType.XXL) {
				return `${roll.dice.toString()}\n${roll.toString(outputType)}`;
			}
			return roll.toString(outputType);
		}).join(joiner);
	}
	public toStrings(outputType?: DiceOutputType): TDiceOutput[] {
		return this.rolls.map(roll => {
			const output = (roll.dice.diceOutputType ?? outputType) === DiceOutputType.XXL
				? `${roll.dice.toString()}\n${roll.toString(outputType)}`
				: roll.toString(outputType);
			return {
				hasSecret: roll.hasSecret,
				inlineOutput: roll.toString(outputType),
				input: roll.dice.toString(),
				output: output
			};
		});
	}

	public static create(discordDice: DiscordDice): DiscordDiceRoll {
		const core: DiscordDiceRollCore = {
			objectType: "DiscordDiceRoll",
			id: randomUuid(),
			discordDice: discordDice.toJSON(),
			rolls: discordDice.diceGroups.map(diceGroup => diceGroup.roll().toJSON())
		};
		return new DiscordDiceRoll(core);
	}
	public static fromCore(core: DiscordDiceRollCore): DiscordDiceRoll {
		return new DiscordDiceRoll(core);
	}
}
