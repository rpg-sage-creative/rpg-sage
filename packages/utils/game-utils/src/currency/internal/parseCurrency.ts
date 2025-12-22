import { regex } from "regex";
import type { GameSystemCode } from "../../systems/GameSystem.js";
import type { Currency, CurrencyConstructor, CurrencyCore, Denomination, DenominationsCore } from "../Currency.js";
import { createDenomCore } from "./createDenomCore.js";
import { OptionalHorizontalWhitespaceRegExp } from "@rsc-utils/core-utils";

const RegExpMap: Record<string, RegExp> = {};

/**
 * Creates a regex for matching the denominations.
 */
function createRegex<Keys extends string>(denominations: Keys[]): RegExp {
	const denoms = denominations.join("|");
	return RegExpMap[denoms] ??= regex("gi")`
		(?<sign> [+-] )?
		${OptionalHorizontalWhitespaceRegExp}
		(?<value> \d+ ([\ ,.]\d+)* )
		${OptionalHorizontalWhitespaceRegExp}
		(?<denom> ${denoms} )
	`;
}

const CommaSeparatorRegExp = /[\s,]/g;
const PeriodSeparatorRegExp = /[\s.]/g;

/**
 * Converts a string into a number by removing spaces and thousands separators and converting , decimal separator into . separator.
 */
function parseNumber(value: string, decimal: "," | "." = "."): number {
	const separatorRegex = decimal === "." ? CommaSeparatorRegExp : PeriodSeparatorRegExp;
	return +value.replace(separatorRegex, "").replace(",", ".");
}

/**
 * The value of a denomination that's been parsed.
 */
type MatchData<Keys> = {
	denom: Keys;
	// pos: boolean;
	// neg: boolean;
	sign?: "+"|"-";
	value: number;
};

/**
 * Uses regex to parse the denominations from the given value.
 */
function matchString<Keys extends string>(value: string, denominations: Keys[], decimal: "," | "." = "."): MatchData<Keys>[] {
	const data: MatchData<Keys>[] = [];
	const regexp = createRegex(denominations);
	const matches = value.matchAll(regexp);
	for (const match of matches) {
		if (match?.groups) {
			data.push({
				denom: match.groups.denom as Keys,
				// pos: match.groups.sign === "+",
				// neg: match.groups.sign === "-",
				sign: match.groups.sign as "+"|"-",
				value: parseNumber(match.groups.value, decimal),
			});
		}
	}
	return data;
}

/** Creates a match data from the given number for the default denomnnination. */
function matchNumber<DenomKeys extends string>(value: number, denominations: Denomination<DenominationsCore<DenomKeys>>[]): MatchData<DenomKeys>[] {
	// get default denomination
	const defaultDenomKey = denominations.find(denom => denom.value === 1)!.denom;

	// store value as a match
	return [{
		denom: defaultDenomKey,
		// neg: value < 0,
		// pos: value > 0,
		sign: value < 0 ? "-" : "+",
		value: Math.abs(value),
	}];
}

/**
 * Used to find the denomination that is a 1/10 fraction of the given denomination.
 * Ex: If we find 2.1 gp, we need to find the sp denomination for the .1
 */
function getTenthDenom<
	DenomKeys extends string,
	Denom extends Denomination<DenominationsCore<DenomKeys>> = Denomination<DenominationsCore<DenomKeys>>
>(denominations: Denom[], denom: DenomKeys): Denom | undefined {
	const parent = denominations.find(denomination => denomination.denom === denom);
	if (parent) {
		return denominations.find(denomination => denomination.value === parent.value / 10);
	}
	return undefined;
}

/**
 * @internal
 * Uses the given Currency to parse the given string.
 * Optional decimal value allows for parsing euro formatted numbers.
 */
export function parseCurrency<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>,
	CurrConstructor extends CurrencyConstructor<CurrClass, DenomKeys> = CurrencyConstructor<CurrClass, DenomKeys>
>(currencyClass: CurrConstructor, valueToParse: string | number, decimal: "," | "." = "."): CurrClass {

	// get denominations from Currency
	const { denominations } = currencyClass.CurrencyData;

	// get denomination keys
	const denomKeys = denominations.map(({ denom }) => denom);

	// create a new currency instance to add all parsed values to and return
	const total = new currencyClass();

	// get all matches from string value
	const values = typeof(valueToParse) === "string"
		? matchString(valueToParse, denomKeys, decimal)
		: matchNumber(valueToParse, denominations);

	let neg = false;
	values.forEach(({ sign, value, denom }) => {
		if (value) {
			const core = createDenomCore(denomKeys);

			// split value into whole and decimal parts
			const parts = String(value).split(".");

			// add whole value
			core[denom] = +parts[0];

			// add each fractional value
			const partial = +`0.${parts[1] ?? 0}0`;
			/** @todo consider how to handle partials that are like a 50 cent piece (or electrum); partialMultiplier would need a *2 and "getTenth" would need to accept the fraction ... */
			let partialMultiplier = 10;
			let childDenom = getTenthDenom(denominations, denom);
			while (childDenom) {
				core[childDenom.denom] = (Math.floor(partial * partialMultiplier) % 10);
				partialMultiplier *= 10;
				childDenom = getTenthDenom(denominations, childDenom.denom);
			}

			// toggle negative only if a sign is found, otherwise we keep using the previous sign
			if (sign) {
				neg = sign === "-";
			}

			// subtract the value if negative, otherwise add it
			neg ? total.subtract(core) : total.add(core);
		}
	});

	return total;
}
