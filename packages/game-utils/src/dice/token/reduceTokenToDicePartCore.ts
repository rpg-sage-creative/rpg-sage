import type { TokenData } from "@rsc-utils/core-utils";
import { appendTestToCore } from "../DiceTest.js";
import type { TDiceBaseCore } from "../dice/DiceBase.js";
import type { DicePartCore } from "../dice/DicePart.js";
import { DiceDropKeep, type DiceDropKeepType } from "../manipulate/DiceDropKeep.js";
import { appendManipulationToCore } from "../manipulate/appendManipulationToCore.js";
import type { DiceOperator } from "../types/DiceOperator.js";

export type ReduceSignToDropKeep = {
	sign: DiceOperator;
	type: DiceDropKeepType;
	value: number;
	alias: string;
	test: (core: DicePartCore, token: TokenData) => boolean;
};

type DiceTokenData = TokenData & { key:"dice"; matches:[string, string, string, string]; };
/**
 * Sets the core's .sign, .count, and .sides values from the tokens .matches
 * If reducePlusMinusToDropKeepData provided, a +2d20/-2d20 roll will be converted to 2d20kh1/2d20kl1 (Fortune/Misfortune; Advantage/Disadvantage)
 * */
function reduceDiceToken<T extends DicePartCore>(core: T, token: TokenData | DiceTokenData, reduceSignToDropKeepData?: ReduceSignToDropKeep[]): boolean {
	if (token.key === "dice") {
		let hasChanges = false;
		if (token.matches) {
			core.sign = token.matches[0] as DiceOperator;
			/** @todo this should filter on valid numbers, not truthy numbers */
			core.fixedRolls = (token.matches[1] ?? "").split(",").map(s => +s.trim()).filter(n => n);
			core.count = +token.matches[2] || 0;
			core.sides = +token.matches[3] || 0;
			/** @todo this should test !token.matches[2]?.length instead of !core.count ... we should accept a 0, but not an empty string/undefined */
			if (!core.count && core.sides) {
				core.count = 1;
			}
			hasChanges = true;
		}
		const dropKeep = reduceSignToDropKeepData?.find(dropKeepData => dropKeepData.test(core, token));
		if (dropKeep) {
			const manipulation = core.manipulation ?? (core.manipulation = []);
			manipulation.push({ dropKeep:new DiceDropKeep(dropKeep) });
			delete core.sign;
			hasChanges = true;
		}
		return hasChanges;
	}
	return false;
}

type ModTokenData = TokenData<"mod"> & { matches:[string, string]; };
function reduceModToken<T extends DicePartCore>(core: T, token: TokenData | ModTokenData): T {
	if (token.key === "mod" && token.matches) {
		core.sign = token.matches[0] as DiceOperator;
		core.modifier = +token.matches[1] || 0;
	}
	return core;
}

/** Appends the token's value to the core's description */
function reduceDescriptionToken<T extends DicePartCore>(core: T, token: TokenData): T {
	core.description = (core.description ?? "") + token.token;
	return core;
}

export type reduceTokenToCore<T extends TDiceBaseCore> = (core: T, token: TokenData, index: number, tokens: TokenData[], reduceSignToDropKeepData?: ReduceSignToDropKeep[]) => T;

export function reduceTokenToDicePartCore<T extends DicePartCore>(core: T, token: TokenData, index: number, tokens: TokenData[], reduceSignToDropKeepData?: ReduceSignToDropKeep[]): T {
	if (reduceDiceToken(core, token, reduceSignToDropKeepData)) {
		return core;
	}
	if (appendManipulationToCore(core, token, index, tokens)) {
		return core;
	}
	if (appendTestToCore(core, token, index, tokens)) {
		return core;
	}
	if (reduceModToken(core, token)) {
		return core;
	}
	/** @todo after doing a test, this needs to become another dicepart */
	return reduceDescriptionToken(core, token);
}