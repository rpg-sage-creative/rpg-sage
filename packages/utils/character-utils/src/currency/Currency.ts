import { applyChanges, debug, deepFreeze, HasCore, sortPrimitive, toLiteral, type Comparable, type Constructable, type Core, type Optional, type SortResult } from "@rsc-utils/core-utils";
import type { GameSystemCode, GameSystem as GameSystemObj } from "./internal/GameSystemCode.js";
import { addValues } from "./internal/addValues.js";
import { convertCurrency } from "./internal/convertCurrency.js";
import { coreFrom } from "./internal/coreFrom.js";
import { formatCurrency } from "./internal/formatCurrency.js";
import { getDenominations } from "./internal/getDenominations.js";
import { parseCurrency } from "./internal/parseCurrency.js";
import { simplifyCurrency } from "./internal/simplifyCurrency.js";
import { subtractValues } from "./internal/subtractValues.js";

/** Creates a simple key/value map that has typed keys for denominations that only return numbers. */
export type DenominationsCore<Keys extends string> = Record<Keys, number>;

/** Combines Core with Currency specific properties *AND* the Denomination type. */
export type CurrencyCore<GameSystemCode, Denominations extends string> =
Core<"Currency">
& DenominationsCore<Denominations>
& {
	/** Is the Currency negative / does the Currency represent a debt? */
	neg: boolean;
	/** What Game System is this Currency for? ex: PF2e, DnD5e */
	gameSystem: GameSystemCode;
};


/** The information for a given Denomination of a Currency. */
export type Denomination<T extends DenominationsCore<any> = DenominationsCore<any>> = {
	/** The name of the denomination, ex: Gold Piece */
	name: string;
	/** The plural name of the denomination, ex: Gold Pieces */
	plural: string;
	/** The abbreviation of the denomination, ex: gp */
	denom: keyof T;
	/**
	 * The value of the denomination in relation to the default denomination.
	 * The default Denomination of any Currency has value = 1.
	 * Example: If a dime is value 1, a penny would have value 1/10 and a dollar would have value 10.
	 */
	value: number;
};

/**
 * Allows currency to be swapped between game systems.
 * Example: PF2e and SF2e have 1 credit = 1 silver piece.
 * Thus Pathfinder2e Currency should have an exhange rate: { system:"SF2E", denom:"credit", value:1 }
 * And Starfinder2e Currency should have an exhange rate: { system:"PF2E", denom:"sp", value:1 }
 * NOTE: This is meant for games that you can mix/match, NOT for converting PF1e to PF2e.
 */
export type ExchangeRate = {
	/** The other game system this currency can exchange with. */
	system: GameSystemCode;
	/** The default denomination of the other system (for human reference; code finds it programatically). */
	denom: string;
	/** The multiplier to convert this currency's default value to the target currency's default value. */
	value: number;
};

/** This contains denominations and exhange rates for a Currency. */
export type CurrencyData<Denominations extends string = string> = {
	denominations: Denomination<DenominationsCore<Denominations>>[];
	exchangeRates: ExchangeRate[];
};



/** Ensures that each denomination has a value in the given core, setting to 0 if the value is missing. */
function ensureDenominations<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>
>(currency: CurrClass): void {
	const core = currency.toJSON() as DenominationsCore<DenomKeys>;
	getDenominations<GameSystem, DenomKeys>(currency).forEach(({ denom }) => {
		if (!core[denom]) {
			core[denom] = 0;
		}
	});
}

export type AnyCurrency = Currency<any, any, any>;

export type ParsableCurrency = AnyCurrency | DenominationsCore<any> | string | number;

export type CurrencyInstance<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>
> = Currency<GameSystem, DenomKeys, Core> & DenominationsCore<DenomKeys>;

export type CurrencyConstructor<T extends AnyCurrency, U extends string = string> = Constructable<T> & {
	CurrencyData: CurrencyData<U>;
	GameSystem: GameSystemCode;
	compare(a: ParsableCurrency, b: ParsableCurrency): SortResult;
	from(currency: AnyCurrency): T;
	parse(parsableCurrency: ParsableCurrency): T;
	sum(...parsableCurrencies: ParsableCurrency[]): T;
};

/**
 * This base Currency class contains all the reusable logic for storing and managing currency.
 * It uses generics and child class statics to get the meta data for a given currency.
 */
export abstract class Currency<
	GameSystem extends GameSystemCode,
	DenomKeys extends string,
	Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
	CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core, any>
>
extends HasCore<Core>
implements Comparable<AnyCurrency> {

	private readonly values = {} as DenominationsCore<DenomKeys>;

	/** The basic constructor that optionally accepts a core. A new core is *always* created when creating Currency. */
	public constructor(core?: Partial<Core>) {
		super(coreFrom(core));
		ensureDenominations(this);
		this.updateValues();
	}

	public get denominationKeys(): DenomKeys[] {
		return getDenominations<GameSystem, DenomKeys>(this).map(({ denom }) => denom);
	}

	/** Typed code for the Game System. */
	public get gameSystem(): GameSystemCode {
		return this.core.gameSystem;
	}

	/** Returns true if any denomination has a value > 0. */
	public get isEmpty(): boolean {
		const denominations = getDenominations<GameSystem, DenomKeys>(this);
		for (const { denom } of denominations) {
			if (this.core[denom] > 0) {
				return false;
			}
		}
		return true;
	}

	/** Does this Currency represent a negative value (debt). */
	public get neg(): boolean {
		return this.core.neg === true;
	}

	/**
	 * Adds the given value to the current Currency.
	 * Strings and numbers are parsed into Currency before attempting math.
	 * This checks various factors to ensure that we add/subtract the individual values correctly and have the correct negative flag.
	 * Because of the presence of denominations and the need to make change during .subtractValues, we need to be careful about how we perform addition/subtraction.
	 * Uses .zeroOut and .setValues, which call this.updateValues();
	 */
	public add(currency: ParsableCurrency): this;
	public add(value: number, denom: DenomKeys): this;
	public add(parsableOrValue: ParsableCurrency, denom?: DenomKeys): this {
		const parsable = denom ? `${parsableOrValue} ${denom}` : parsableOrValue;
		const other = (this.constructor as CurrencyConstructor<CurrClass>).parse(parsable);
		const thisValue = this.toValue();
		const otherValue = other.toValue();
		const finalValue = thisValue + otherValue;

		if (!finalValue) {
			// if values are equal and opposite, zero
			this.zeroOut();

		} else if (this.neg === other.neg) {
			// pos + pos and neg + neg simply increase all values
			const values = addValues<GameSystem, DenomKeys>(this, other);
			this.setValues(values, this.neg);

		}else if (Math.abs(thisValue) < Math.abs(otherValue)) {
			const values = subtractValues<GameSystem, DenomKeys>(other, this);
			this.setValues(values, other.neg);

		}else {
			// thisValue > otherValue
			const values = subtractValues<GameSystem, DenomKeys>(this, other);
			this.setValues(values, this.neg);

		}
		return this;
	}

	/** Creates a duplicate instance of this Currency. */
	public clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrClass {
		const child = this.constructor as CurrencyConstructor<CurrClass>;
		let neg = this.core.neg;
		if (opts) {
			if ("neg" in opts && opts.neg !== undefined) {
				neg = opts.neg;
			}
			if ("invert" in opts && opts.invert) {
				neg = !neg;
			}
		}
		return new child({ ...this.core, neg });
	}

	/**
	 * Compares this Currency to the given Currency.
	 * Returns -1 if this Currency is less than the other Currency.
	 * Returns +1 if this Currency is greater than the other Currency.
	 * Returns 0 is they are the same.
	 * Empty Currency is always treated as a value of 0.
	 * If the other Currency isn't compatible, then it is always considered less than this Currency.
	 */
	public compareTo(other: AnyCurrency): SortResult {
		const child = this.constructor as CurrencyConstructor<CurrClass>;

		// the Currency is the same, compare them.
		if (other instanceof child) {
			return sortPrimitive(this.toValue(), other.toValue());
		}

		// if the other is empty, regardless of type of currency, treat it as zero
		if (other.isEmpty) {
			return sortPrimitive(this.toValue(), 0);
		}

		// convert the currency
		const convertedOther = child.from(other);

		// if the converted currency is empty, then the types are incompatible; treat this currency as greater than
		if (convertedOther.isEmpty) {
			return +1;
		}

		// compare this currency to the converted currency
		return sortPrimitive(this.toValue(), other.toValue());
	}

	public equalTo(currency: ParsableCurrency): boolean {
		const other = (this.constructor as CurrencyConstructor<CurrClass>).parse(currency);
		return this.compareTo(other) === 0;
	}

	public greaterThan(currency: ParsableCurrency): boolean {
		const other = (this.constructor as CurrencyConstructor<CurrClass>).parse(currency);
		return this.compareTo(other) > 0;
	}

	/** This enables child classes to process any logic that needs to happen after a function of Currency modifies the values of the core. */
	protected abstract handleUpdates(): void;

	public hasDenomination(denom: string): denom is DenomKeys {
		return getDenominations<GameSystem, DenomKeys>(this).some(d => d.denom === denom);
	}

	public lessThan(currency: ParsableCurrency): boolean {
		const other = (this.constructor as CurrencyConstructor<CurrClass>).parse(currency);
		return this.compareTo(other) < 0;
	}

	public math(operator: "+" | "-", value: number, denom: DenomKeys): this;
	public math(operator: "*", value: number): this;
	public math(operator: "+" | "-" | "*", value: number, denom?: DenomKeys): this {
		switch(operator) {
			case "+": return this.add(value, denom!);
			case "-": return this.subtract(value, denom!);
			case "*": return this.multiply(value);
			default: debug(`Not Yet Implemented: Currency.math("${operator}", ${value}, ${denom})`);
		}
		return this;
	}

	/**
	 * Multiplies this Currency by adding the current sum multiple times.
	 * By calling .add, this uses .zeroOut and .setValues, which call this.updateValues();
	 */
	public multiply(times: number): this {
		if (times === 0) {
			return this.zeroOut();
		}

		let iterations = Math.abs(times) - 1;
		if (iterations > 0) {
			// clone this so that we add the same amount each time
			const clone = this.clone();

			// add while we still have iterations
			while (iterations--) {
				this.add(clone);
			};

			// invert the negative sign if we multiple by a negative
			if (times < 0) {
				this.core.neg = !this.core.neg;
			}
		}
		return this;
	}

	/**
	 * This sets the values of this Currency with the values from the other Currency.
	 * The negative flag is left alone unless neg is given.
	 * Calls this.updateValues();
	 */
	protected setValues(values: DenominationsCore<DenomKeys>, neg: boolean): this {
		applyChanges<DenominationsCore<DenomKeys>>(this.core, values);
		this.core.neg = neg === true;
		return this.updateValues();
	}

	/**
	 * Rolls values up such that each denomination has less than the amount needed to round it up to the next.
	 * Example: Converts 11 sp to 1 gp, 1 sp.
	 */
	public simplify(denomKey?: DenomKeys): this {
		if (!denomKey) {
			const denominations = getDenominations<GameSystem, DenomKeys>(this);
			denomKey = denominations[denominations.length - 1].denom;
		}
		simplifyCurrency(this, denomKey);
		return this.updateValues();
	}

	/**
	 * Subtracts the given value from the current Currency.
	 * Strings and numbers are parsed into Currency before attempting math.
	 * This checks various factors to ensure that we add/subtract the individual values correctly and have the correct negative flag.
	 * Because of the presence of denominations and the need to make change during .subtractValues, we need to be careful about how we perform addition/subtraction.
	 * Uses .zeroOut and .setValues, which call this.updateValues();
	 */
	public subtract(currency: ParsableCurrency): this;
	public subtract(value: number, denom: DenomKeys): this;
	public subtract(parsableOrValue: ParsableCurrency, denom?: DenomKeys): this {
		const parsable = denom ? `${parsableOrValue} ${denom}` : parsableOrValue;
		const other = (this.constructor as CurrencyConstructor<CurrClass>).parse(parsable);
		const thisValue = this.toValue();
		const otherValue = other.toValue();
		const finalValue = thisValue - otherValue;

		if (!finalValue) {
			// if values are equal and opposite, zero
			this.zeroOut();

		} else if (this.neg !== other.neg) {
			// neg - pos and pos - neg simply increase all values
			const values = addValues<GameSystem, DenomKeys>(this, other);
			this.setValues(values, this.neg);

		}else if (Math.abs(thisValue) > Math.abs(otherValue)) {
			// -5 - -1 = -4 >> this.subtractValues(other)
			// +5 - +1 = +4 >> this.subtractValues(other)
			const values = subtractValues<GameSystem, DenomKeys>(this, other);
			this.setValues(values, this.neg);

		}else {
			// -1 - -5 = +4 >> other.subtractValues(this)
			// +1 - +5 = -4 >> other.subtractValues(this)
			const values = subtractValues<GameSystem, DenomKeys>(other, this);
			this.setValues(values, !this.neg);

		}
		return this;
	}

	/** Formats the currency using each denonination with a value greater than zero. */
	public toString(denomKey?: DenomKeys): string {
		return formatCurrency(this, denomKey);
	}

	/** Returns the total value in the given denomination, or the default denomination if one isn't given. */
	public toValue(denomKey?: DenomKeys): number {
		if (!denomKey) {
			denomKey = getDenominations<GameSystem, DenomKeys>(this).find(denom => denom.value === 1)!.denom;
		}
		return this.values[denomKey];
	}

	/**
	 * Calculates the currency's total value for each of the denominations so that compares/sorts don't need to do the math per call.
	 * Also notifies child classes that values have changed so that they can adjust other values accordingly, such as Bulk.
	 */
	private updateValues(): this {
		// get denominations once
		const denominations = getDenominations<GameSystem, DenomKeys>(this);

		// update values for each denomination
		denominations.forEach(denomination => {
			let total = 0;
			let denomDivisor = 1;
			const denomKey = denomination.denom;
			denominations.forEach(({ denom, value }) => {
				total += this.core[denom] * value;
				if (denom === denomKey) {
					denomDivisor = value;
				}
			});
			const neg = this.core.neg ? -1 : 1;
			this.values[denomKey] = neg * total / denomDivisor;
		});

		// notify children
		this.handleUpdates();

		return this;
	}

	/**
	 * Resets value to 0 by setting all denomination values to 0 and neg to false.
	 * Calls this.updateValues();
	 */
	public zeroOut(): this {
		const thisCore = this.core as DenominationsCore<DenomKeys>;
		getDenominations<GameSystem, DenomKeys>(this).forEach(({ denom }) => {
			thisCore[denom] = 0;
		});
		this.core.neg = false;
		return this.updateValues();
	}

	public static compare(a: ParsableCurrency, b: ParsableCurrency): SortResult {
		throw Error(`Not Implemented: Currency.compare(${toLiteral(a)}, ${toLiteral(b)})`);
	}

	/** Expects a clone or converted instance of the Currency. */
	public static from(currency?: AnyCurrency): AnyCurrency {
		throw Error(`Not Implemented: Currency.from(${toLiteral(currency)})`);
	}

	public static parse(currency: ParsableCurrency, decimal?: "," | "."): AnyCurrency {
		throw Error(`Not Implemented: Currency.parse(${toLiteral(currency)}, ${toLiteral(decimal)})`);
	}

	public static sum(...currencies: ParsableCurrency[]): AnyCurrency {
		throw Error(`Not Implemented: Currency.sum(${toLiteral(currencies)})`);
	}

	/** Child classes should set this with deepFreeze(). */
	public static readonly CurrencyData: CurrencyData;

	public static readonly GameSystem: GameSystemCode = "None";

	public static createCurrency<
		GameSystem extends GameSystemCode,
		DenomKeys extends string,
		Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
		CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>,
		CurrConstructor extends CurrencyConstructor<CurrClass, DenomKeys> = CurrencyConstructor<CurrClass, DenomKeys>
	>(gameSystem: GameSystem, currencyData: CurrencyData): CurrConstructor {

		const sub = class extends Currency<GameSystem, DenomKeys, CurrencyCore<GameSystem, DenomKeys>> {
			constructor(core?: Partial<Omit<Core, "objectType" | "gameSystem">>) { super({ ...core, gameSystem } as Partial<Core>); }
			handleUpdates() { /*do nothing*/ }
			static readonly CurrencyData = currencyData;
			static readonly GameSystem = gameSystem;
		};

		Currency.registerCurrency(sub);

		return sub as unknown as CurrConstructor;
	}

	public static registerCurrency<
		GameSystem extends GameSystemCode,
		DenomKeys extends string,
		Core extends CurrencyCore<GameSystem, DenomKeys> = CurrencyCore<GameSystem, DenomKeys>,
		CurrClass extends Currency<GameSystem, DenomKeys, Core> = Currency<GameSystem, DenomKeys, Core>,
		CurrConstructor extends CurrencyConstructor<CurrClass, DenomKeys> = CurrencyConstructor<CurrClass, DenomKeys>
	>(currency: typeof Currency<any, any, any> & CurrConstructor): void {

		if (currencies.has(currency.GameSystem)) {
			throw new Error(`Currency Already Registered: ${currency.GameSystem}`);
		}

		currency.compare = (a: AnyCurrency, b: AnyCurrency) => currency.parse(a).compareTo(currency.parse(b));

		currency.from = (arg?: AnyCurrency) => convertCurrency(arg, currency);

		currency.parse = (arg?: ParsableCurrency, decimal?: "," | ".") => {
			if (arg) {
				if (typeof(arg) === "string" || typeof(arg) === "number") {
					return parseCurrency(currency, arg, decimal);
				}else if (arg instanceof Currency) {
					return (currency as CurrConstructor).from(arg);
				}
				return new (currency as CurrConstructor)(arg);
			}
			return new (currency as CurrConstructor)();
		};

		currency.sum = (...args: ParsableCurrency[]) => {
			const curr = new (currency as CurrConstructor)();
			args.forEach(arg => curr.add(arg));
			return curr;
		};

		deepFreeze(currency.CurrencyData);

		currencies.set(currency.GameSystem, currency);
	}

	/** Creates a new instance of Currency for the given GameSystemCode, if it is registered. Returns undefined otherwise. */
	public static new<T extends AnyCurrency>(gameSystemCode?: GameSystemCode): T | undefined {
		// if we have an explicit game system that has currency, use it
		if (gameSystemCode && currencies.has(gameSystemCode)) {
			const constr = currencies.get(gameSystemCode) as unknown as new (...args: any[]) => T;
			return new constr();
		}
		return undefined;
	}

	public static isDenominationKey(gameSystem: Optional<GameSystemObj>, denomLower: Lowercase<string>): boolean {
		if (!gameSystem) return false;
		for (const [_gameSystem, currency] of currencies.entries()) {
			if (_gameSystem === gameSystem.code) {
				return currency.CurrencyData.denominations.some(({ denom }) => denom.toLowerCase() === denomLower);
			}
		}
		return false;
	}
}
const currencies = new Map<GameSystemCode, typeof Currency<any, any, any>>();