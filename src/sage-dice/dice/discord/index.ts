import { debug, HasCore, parseEnum, randomSnowflake, type IdCore, type OrNull, type OrUndefined } from "@rsc-utils/core-utils";
import { DiceCriticalMethodType, DiceOutputType, DiceSecretMethodType, GameSystemType, getGameSystems, parseGameSystem } from "@rsc-utils/game-utils";
import type { TDiceOutput } from "../../common.js";
import { getBasicDiceRegex } from "../../getBasicDiceRegex.js";
import type { Dice as baseDice, DiceGroup as baseDiceGroup, DiceGroupRoll as baseDiceGroupRoll, DicePart as baseDicePart } from "../base/index.js";
import type { DiceCore as baseDiceCore, DiceGroupCore as baseDiceGroupCore, DiceGroupRollCore as baseDiceGroupRollCore, DicePartCore as baseDicePartCore, TDice as baseTDice, TDiceGroup as baseTDiceGroup, TDiceGroupRoll as baseTDiceGroupRoll, TDicePart as baseTDicePart } from "../base/types.js";

type DiceSystem = { DiceGroup:typeof baseDiceGroup; DiceGroupRoll:typeof baseDiceGroupRoll; };
const diceSystems = new Map<GameSystemType, DiceSystem>();

// load all the dice systems
for (const gameSystem of getGameSystems()) {
	const diceCode = gameSystem.type ? gameSystem.dice.toLowerCase() : "base";
	const { DiceGroup, DiceGroupRoll } = await import(`../${diceCode}/index.js`) as DiceSystem;
	diceSystems.set(gameSystem.type, { DiceGroup, DiceGroupRoll });
}

type DiceGroupParser<T extends baseTDiceGroup = baseTDiceGroup> = (diceString: string, diceOutputType?: DiceOutputType, diceSecretMethodType?: DiceSecretMethodType, critMethodType?: DiceCriticalMethodType) => T;

function getDiceSystem(gameType?: GameSystemType): DiceSystem {
	let diceSystem = diceSystems.get(gameType ?? GameSystemType.None);
	if (!diceSystem) {
		let gameSystem = parseGameSystem(gameType);
		if (!gameSystem || gameSystem.dice !== gameSystem.code) {
			gameSystem = parseGameSystem(gameSystem?.dice);
		}
		diceSystem = diceSystems.get(gameSystem?.type ?? GameSystemType.None);
	}
	if (!diceSystem) {
		diceSystem = diceSystems.get(GameSystemType.None);
	}
	if (!diceSystem?.DiceGroup || !diceSystem.DiceGroupRoll) {
		debug({gameType,diceSystem});
	}
	return diceSystem!;
}

function cloneDicePart<T extends baseDicePartCore, U extends baseTDicePart>(clss: typeof baseDicePart, core: T): U {
	return <U>clss.fromCore({
		count: core.count,
		description: core.description,
		dropKeep: core.dropKeep ? { ...core.dropKeep } : undefined,
		fixedRolls: core.fixedRolls,
		gameType: core.gameType,
		id: randomSnowflake(),
		modifier: core.modifier,
		noSort: core.noSort,
		objectType: core.objectType,
		sides: core.sides,
		sign: core.sign,
		test: core.test,
		target: core.target
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
			id: randomSnowflake(),
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
				// const newTestCore = <baseDicePartCore>{ count:0, description:"", dropKeep:null, gameType:gameType, id:randomSnowflake(), modifier:0, noSort:false, objectType:"DicePart", sides:0, sign:"+", test:testCore.test };
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
		id: randomSnowflake(),
		objectType: <"Dice">core.objectType
	});
}

function cloneDiceGroup<T extends baseDiceGroupCore, U extends baseTDiceGroup>(core: T, map: number): U {
	const clss = getDiceSystem(core.gameType).DiceGroup;
	return <U>clss.fromCore({
		critMethodType: core.critMethodType,
		dice: core.dice.map(diceCore => cloneDice(clss.Part, diceCore, map).toJSON()),
		diceOutputType: core.diceOutputType,
		diceSecretMethodType: core.diceSecretMethodType,
		gameType: core.gameType,
		id: randomSnowflake(),
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
				return getDiceSystem(core.gameType).DiceGroup.fromCore(core);
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
			id: randomSnowflake(),
			diceGroups: diceGroups.map<baseDiceGroupCore>(DiscordDice.toJSON)
		};
		return new DiscordDice(core);
	}
	public static fromCore(core: DiscordDiceCore): DiscordDice {
		return new DiscordDice(core);
	}
	public static parse({
		diceString,
		defaultGameType = GameSystemType.None,
		defaultDiceOutputType,
		defaultCritMethodType = DiceCriticalMethodType.Unknown,
		defaultDiceSecretMethodType = DiceSecretMethodType.Ignore
	}: {
		diceString: string;
		defaultGameType?: GameSystemType;
		defaultDiceOutputType?: DiceOutputType;
		defaultCritMethodType?: DiceCriticalMethodType;
		defaultDiceSecretMethodType?: DiceSecretMethodType;
	}): OrNull<DiscordDice> {
		const matchArray = diceString.match(getBasicDiceRegex());
		if (!matchArray) {
			return null;
		}

		const diceGroups: baseTDiceGroup[] = [];
		matchArray.map(match => match.slice(1, -1)).forEach(match => {
			let gameType: OrUndefined<GameSystemType>;
			[match, gameType] = matchGameType(match, defaultGameType);

			let diceOutputType: OrUndefined<DiceOutputType>;
			[match, diceOutputType] = matchDiceOutputType(match, defaultDiceOutputType);

			let critMethodType: OrUndefined<DiceCriticalMethodType>;
			[match, critMethodType] = matchCritMethodType(match, gameType, defaultCritMethodType);

			let count: number, map: number;
			[match, count, map] = matchCountAndMap(match);

			if (gameType !== GameSystemType.PF2e && gameType !== GameSystemType.SF2e) {
				map = 0;
			}


			// const diceGroup = parseDice(match, gameType, diceOutputType, defaultDiceSecretMethodType, critMethodType);
			const parser = getDiceSystem(gameType).DiceGroup.parse as DiceGroupParser;
			const diceGroup = parser(match, diceOutputType, defaultDiceSecretMethodType, critMethodType);
			diceGroups.push(diceGroup);
			if (count > 1) {
				const diceGroupCore = diceGroup.toJSON();
				for (let i = 1; i < count; i++) {
					diceGroups.push(cloneDiceGroup(diceGroupCore, map * Math.min(i, 2)));
				}
			}

			//TODO: change a 'check' (+1 perception) to a 1d20+mod format
		});
		return DiscordDice.create(diceGroups);
	}
}

/** Returns the GameType at the beginning of the match along with the rest of the match. */
function matchGameType(match: string, defaultGameType: OrUndefined<GameSystemType>): [string, OrUndefined<GameSystemType>] {
	const gameCodes = getGameSystems().filter(game => game.type).map(game => game.code).join("|");
	const GAME_CHECK = new RegExp(`^(?:(${gameCodes})\b)?`, "i");
	const gameMatch = match.match(GAME_CHECK);
	if (gameMatch) {
		const gameTypeString = gameMatch[0];
		return [
			match.slice(gameTypeString.length).trim(),
			parseGameSystem(gameTypeString)?.type ?? defaultGameType
		];
	}
	return [match, defaultGameType];
}

/** Returns the DiceOutputType at the beginning of the match along with the rest of the match. */
function matchDiceOutputType(match: string, defaultDiceOutputType: OrUndefined<DiceOutputType>): [string, OrUndefined<DiceOutputType>] {
	const DICE_OUTPUT_CHECK = /^(?:(xxs|xs|s|m|xxl|xl|l|rollem)\b)?/i;
	const diceOutputMatch = match.match(DICE_OUTPUT_CHECK);
	if (diceOutputMatch) {
		const diceOutputTypeString = diceOutputMatch[0];
		const diceOutputType = parseEnum(DiceOutputType, diceOutputTypeString, defaultDiceOutputType);
		return [
			match.slice(diceOutputTypeString.length).trim(),
			diceOutputType
		];
	}
	return [match, defaultDiceOutputType];
}

/** Returns the CritMethodType at the beginning of the match along with the rest of the match. */
function matchCritMethodType(match: string, gameType: OrUndefined<GameSystemType>, defaultCritMethodType: OrUndefined<DiceCriticalMethodType>): [string, OrUndefined<DiceCriticalMethodType>] {
	const gameSystem = parseGameSystem(gameType);
	if (gameSystem?.diceCritMethodType) {
		const CRIT_METHOD_CHECK = /^(timestwo|rolltwice|addmax)?/i;
		const critMethodMatch = match.match(CRIT_METHOD_CHECK);
		if (critMethodMatch) {
			const critMethodTypeString = critMethodMatch[0];
			const critMethodType = parseEnum(GameSystemType, critMethodTypeString, defaultCritMethodType);
			return [
				match.slice(critMethodTypeString.length).trim(),
				critMethodType
			];
		}
	}
	return [match, defaultCritMethodType];
}

/** Returns the Count and MAP at the beginning of the match along with the rest of the match. */
function matchCountAndMap(match: string): [string, number, number] {
	const COUNT_CHECK = /^(\d+)(map-\d+|map|agile)?#/i;
	const countMatch = match.match(COUNT_CHECK);
	if (countMatch) {
		const [matchString, countString, mapString] = countMatch;

		const matchWithoutCount = match.slice(matchString.length).trim();

		const count = +countString;

		let map = 0;
		if (mapString) {
			if (/agile/i.test(mapString)) {
				map = -4;
			}else if (/map-\d+/i.test(mapString)) {
				map = +countMatch[2].slice(3);
			}else {
				map = -5;
			}
		}


		return [matchWithoutCount, count, map];
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
				return getDiceSystem(core.gameType).DiceGroupRoll.fromCore(core);
			});
		}
		return this._rolls;
	}

	public get hasSecret(): boolean { return !!this.rolls.find(roll => roll.hasSecret); }

	public toString(outputType?: DiceOutputType, joiner = "\n"): string {
		if (this.rolls[0].gameType === GameSystemType.Quest) {
			joiner = ", ";
		}
		return this.rolls.map(roll => {
			if ((roll.dice.diceOutputType ?? outputType) === DiceOutputType.XXL) {
				return `${roll.dice.toString()}\n${roll.toString(outputType)}`;
			}
			return roll.toString(outputType);
		}).join(joiner);
	}
	public toStrings(outputType?: DiceOutputType, diceSort?: "sort" | "noSort"): TDiceOutput[] {
		return this.rolls.map(roll => {
			const output = (roll.dice.diceOutputType ?? outputType) === DiceOutputType.XXL
				? `${roll.dice.toString()}\n${roll.toString(outputType, diceSort)}`
				: roll.toString(outputType, diceSort);
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
			id: randomSnowflake(),
			discordDice: discordDice.toJSON(),
			rolls: discordDice.diceGroups.map(diceGroup => diceGroup.roll().toJSON())
		};
		return new DiscordDiceRoll(core);
	}
	public static fromCore(core: DiscordDiceRollCore): DiscordDiceRoll {
		return new DiscordDiceRoll(core);
	}
}
