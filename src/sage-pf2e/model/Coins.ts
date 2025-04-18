import { sortPrimitive, type Comparable, type SortResult } from "@rsc-utils/array-utils";
import { HasCore, type Core } from "@rsc-utils/class-utils";
import { addCommas, round, warn } from "@rsc-utils/core-utils";
import { Bulk } from "./Bulk.js";

type TMoney = number | string | Coins;

//#region helpers

function createCore(pp = 0, gp = 0, sp = 0, cp = 0, neg = false): CoinsCore {
	return { neg: neg, cp: cp, sp: sp, gp: gp, pp: pp, objectType: "Coins" };
}
function bulkCalculator(coins: Coins): Bulk {
	return new Bulk(Math.floor((coins.cp + coins.sp + coins.gp + coins.pp) / 1000));
}
function ensureCoins(value: TMoney): Coins {
	if (value instanceof Coins) {
		return value;
	}
	return Coins.parse(typeof (value) === "string" ? value : value + "sp");
}
function format(pp: number, gp: number, sp: number, cp: number, neg: boolean): string {
	const parts: string[] = [];
	if (pp) {
		parts.push(`${addCommas(pp)} pp`);
	}
	if (gp) {
		parts.push(`${addCommas(gp)} gp`);
	}
	if (sp) {
		parts.push(`${addCommas(sp)} sp`);
	}
	if (cp) {
		parts.push(`${addCommas(cp)} cp`);
	}
	const negOut = neg ? "-" : "";
	const partsOut = parts.filter(part => part).join(", ");
	return `${negOut}${partsOut}`;
}
function updateValues(coins: Coins): void {
	coins.bulk = bulkCalculator(coins);
	coins.spValue = round(coins.pp * 100 + coins.gp * 10 + coins.sp + coins.cp / 10, 1);
	if (coins.neg) {
		coins.spValue *= -1;
	}
}
function zeroOut(coins: CoinsCore): void {
	coins.cp = coins.sp = coins.gp = coins.pp = 0;
	coins.neg = false;
}

//#endregion

export interface CoinsCore extends Core<"Coins"> {
	neg: boolean;
	cp: number;
	sp: number;
	gp: number;
	pp: number;
}

export class Coins extends HasCore<CoinsCore> implements Comparable<Coins> {
	/**************************************************************************************************************************/
	// Constructors

	public constructor();
	public constructor(core: CoinsCore);
	public constructor(pp: number, gp: number, sp: number, cp: number, neg: boolean);
	public constructor(coreOrPp?: CoinsCore | number, gp?: number, sp?: number, cp?: number, neg?: boolean) {
		super(typeof (coreOrPp) === "object" ? coreOrPp : createCore(coreOrPp, gp, sp, cp, neg));
		if (!this.core.cp) {
			this.core.cp = 0;
		}
		if (!this.core.sp) {
			this.core.sp = 0;
		}
		if (!this.core.gp) {
			this.core.gp = 0;
		}
		if (!this.core.pp) {
			this.core.pp = 0;
		}
		if (!this.core.objectType) {
			this.core.objectType = "Coins";
		}
		updateValues(this);
	}

	/**************************************************************************************************************************/
	// Properties

	public bulk!: Bulk;
	public get neg(): boolean { return this.core.neg === true; }
	public get cp(): number { return Math.round(this.core.cp); }
	public get gp(): number { return Math.round(this.core.gp); }
	public get pp(): number { return Math.round(this.core.pp); }
	public get sp(): number { return Math.round(this.core.sp); }
	public spValue!: number;

	/**************************************************************************************************************************/
	// Instance Methods

	private addValues(values: Coins): void {
		this.core.cp += values.cp;
		this.core.sp += values.sp;
		this.core.gp += values.gp;
		this.core.pp += values.pp;
	}
	private _changeForCopper(count: number): void {
		for (let i = 0; i < count; i++) {
			if (this.core.sp > 0) {
				this.core.cp += 10;
				this.core.sp -= 1;
			} else if (this.core.gp > 0) {
				this.core.cp += 10;
				this.core.sp += 9;
				this.core.gp -= 1;
			} else if (this.core.pp > 0) {
				this.core.cp += 10;
				this.core.sp += 9;
				this.core.gp += 9;
				this.core.pp -= 1;
			} else {
				break;
			}
		}
	}
	private _changeForSilver(count: number): void {
		for (let i = 0; i < count; i++) {
			if (this.core.gp > 0) {
				this.core.sp += 10;
				this.core.gp -= 1;
			} else if (this.core.pp > 0) {
				this.core.sp += 10;
				this.core.gp += 9;
				this.core.pp -= 1;
			} else if (this.core.cp >= 10) {
				this.core.cp -= 10;
				this.core.sp += 1;
			} else {
				break;
			}
		}
	}
	private _changeForGold(count: number): void {
		for (let i = 0; i < count; i++) {
			if (this.core.pp > 0) {
				this.core.gp += 10;
				this.core.pp -= 1;
			} else if (this.core.sp >= 10) {
				this.core.sp -= 10;
				this.core.gp += 1;
			} else if (this.core.cp >= 100) {
				this.core.cp -= 100;
				this.core.gp += 1;
			} else {
				break;
			}
		}
	}
	private subtractValues(values: Coins): void {
		const cp = values.cp ?? 0;
		this._changeForCopper(cp - this.cp);
		this.core.cp -= cp;

		const sp = values.sp ?? 0;
		this._changeForSilver(sp - this.sp);
		this.core.sp -= sp;

		const gp = values.gp ?? 0;
		this._changeForGold(gp - this.gp);
		this.core.gp -= gp;

		const pp = values.pp ?? 0;
		this.core.pp -= pp;
	}
	private updateValues(values: Coins, neg?: boolean): void {
		this.core.cp = values.cp;
		this.core.sp = values.sp;
		this.core.gp = values.gp;
		this.core.pp = values.pp;
		if (neg === true || neg === false) {
			this.core.neg = neg;
		}
	}

	public add(coins: Coins): void;
	public add(coins: string): void;
	public add(coinsOrString: Coins | string): void {
		const coins = typeof (coinsOrString) === "string" ? Coins.parse(coinsOrString) : coinsOrString,
			thisValue = this.spValue,
			coinsValue = coins.spValue,
			finalValue = thisValue + coinsValue;

		if (!finalValue) {
			// if values are equal and opposite, zero
			zeroOut(this.core);

		} else if (this.neg === coins.neg) {
			// pos + pos and neg + neg simply increase all values
			this.addValues(coins);

		} else if (coins.neg) {
			// pos + neg
			if (finalValue > 0) {
				// subtract the smaller value
				this.subtractValues(coins);

			} else {
				// invert the neg, subtract the smaller, reset values
				const invertedCoins = coins.clone(true);
				invertedCoins.subtractValues(this);
				this.updateValues(invertedCoins, true);
			}
		} else {
			// neg + pos
			if (finalValue > 0) {
				// clone the bigger, subtract the smaller, reset values
				const clonedCoins = coins.clone();
				clonedCoins.subtractValues(this);
				this.updateValues(clonedCoins, false);
			} else {
				// subtract the smaller, reset values
				this.subtractValues(coins);
			}

		}
		updateValues(this);
	}

	public clone(invertSign?: boolean): Coins {
		const sign = invertSign ? !this.neg : this.neg;
		return new Coins(this.pp, this.gp, this.sp, this.cp, sign);
	}

	public equalTo(coins: Coins): boolean {
		return this.spValue === coins.spValue;
	}

	public greaterThan(coins: Coins): boolean {
		return this.spValue > coins.spValue;
	}

	public lessThan(coins: Coins): boolean {
		return this.spValue < coins.spValue;
	}

	public multiply(times: number): Coins {
		if (times < 0) {
			throw new Error("Not Implemented");
		}
		const coins = new Coins();
		for (let i = times; i--;) {
			coins.add(this);
		}
		return coins;
	}

	public subtract(coins: Coins): void;
	public subtract(coins: string): void;
	public subtract(coinsOrString: Coins | string): void {
		//TODO: Some extra debugging to ensure that this logic is right (it seems to be good so far!)
		// debug(`(${stringify(this)}).subtract(${stringify(coinsOrString)})`)
		const coins = typeof (coinsOrString) === "string" ? Coins.parse(coinsOrString) : coinsOrString,
			thisValue = this.spValue,
			coinsValue = coins.spValue,
			finalValue = thisValue - coinsValue;
		// debug([thisValue, coinsValue, finalValue])

		if (!finalValue) {
			// debug(`zeroOut`)
			// if values are equal and opposite, zero
			zeroOut(this.core);

		} else if (this.neg !== coins.neg) {
			// debug(`this.neg !== coins.neg`)
			// neg - pos and pos - neg simply increase all values
			this.addValues(coins);

		} else if (coins.neg) {
			// debug(`coins.neg`)
			// neg - neg = neg + pos
			if (finalValue < 0) {
				// debug(`finalValue < 0`)
				// subtract the smaller
				this.subtractValues(coins);

			} else {
				// debug(`finalValue < 0::else`)
				// invert the bigger and subtract the smaller, reset values
				const invertedCoins = coins.clone(true);
				invertedCoins.subtractValues(this);
				this.updateValues(invertedCoins, false);
			}
		} else {
			if (finalValue < 0) {
				// clone the bigger and subtract the smaller, reset values
				const clonedCoins = coins.clone();
				clonedCoins.subtractValues(this);
				this.updateValues(clonedCoins, true);

			} else {
				// subtract the smaller, reset values
				this.subtractValues(coins);

			}
		}
		updateValues(this);
	}

	public toCpString(): string {
		return format(0, 0, 0, this.pp * 1000 + this.gp * 100 + this.sp * 10 + this.cp, this.neg);
	}
	public toSpString(): string {
		return format(0, 0, this.pp * 100 + this.gp * 10 + this.sp, this.cp, this.neg);
	}
	public toGpString(): string {
		return format(0, this.pp * 10 + this.gp, this.sp, this.cp, this.neg);
	}
	public toPpString(): string {
		return format(this.pp, this.gp, this.sp, this.cp, this.neg);
	}
	public toString(): string {
		return this.toPpString();
	}

	// #region Comparable<T>
	public compareTo(other: Coins): SortResult {
		return sortPrimitive(this.spValue, other.spValue);
	}
	// #endregion Comparable<T>

	/**************************************************************************************************************************/
	// Static Methods

	public static compare(a: TMoney, b: TMoney): SortResult {
		return ensureCoins(a).compareTo(ensureCoins(b));
	}
	public static parse(coinString: string): Coins {
		const values = (coinString ?? "")
			.replace(/\s|,/g, "")
			.replace(/([pgsc])p?(\d)/gi, "$1p $2")
			.replace(/(\d[pgsc])$/gi, "$1p")
			.match(/(\d+(?:\.\d+)?(?:[csgp]p)?)+/gi)
			?? [],
			core = createCore();
		if (!values.length) {
			warn("Invalid coinString: " + coinString);
		}
		values.forEach(value => {
			if (value === "0") {
				return;
			}
			const match = value.match(/(\d+)(?:\.(\d+))?([csgp]p)?/i)!,
				whole = +match[1],
				partial = +`0.${match[2] || 0}0`,
				denom = (match[3] || "sp").toLowerCase();
			(<any>core)[denom] += whole;
			if (partial) {
				switch (denom) {
					case "cp":
						break;
					case "sp":
						core.cp += Math.floor(partial * 10) % 10;
						break;
					case "gp":
						core.cp += Math.floor(partial * 100) % 10;
						core.sp += Math.floor(partial * 10) % 10;
						break;
					case "pp":
						core.cp += Math.floor(partial * 1000) % 10;
						core.sp += Math.floor(partial * 100) % 10;
						core.gp += Math.floor(partial * 10) % 10;
						break;
				}
			}
		});
		return new Coins(core);
	}
	public static sum(...coins: Coins[]): Coins {
		const sum = new Coins();
		coins.forEach(coin => sum.add(coin));
		return sum;
	}
	public static toGpString(sp: number): string {
		return Coins.parse(sp + "sp").toGpString();
	}
}
