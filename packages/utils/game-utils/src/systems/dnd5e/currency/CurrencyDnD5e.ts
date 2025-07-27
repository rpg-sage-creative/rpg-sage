import { round } from "@rsc-utils/core-utils";
import { Currency, type CurrencyCore, type CurrencyData } from "../../../currency/Currency.js";

type GameSystemKey = "DnD5e";

type DenominationKeys = "cp" | "sp" | "ep" | "gp" | "pp";

export type Weight = { oz:number; lb:number; };

export type CurrencyCoreDnD5e = CurrencyCore<GameSystemKey, DenominationKeys>;

export type CurrencyDnD5eArg = Omit<CurrencyCoreDnD5e, "objectType" | "gameSystem">;

export class CurrencyDnD5e extends Currency<GameSystemKey, DenominationKeys, CurrencyCoreDnD5e, CurrencyDnD5e> {

	public constructor(core?: Partial<CurrencyDnD5eArg>) {
		super({ ...core, gameSystem:CurrencyDnD5e.GameSystem });
	}

	protected handleUpdates(): void {
		this.gpValue = this.toValue();
		this.weight = CurrencyDnD5e.calculateWeight(this);
	}

	public get cp(): number { return Math.round(this.core.cp); }
	public get ep(): number { return Math.round(this.core.ep); }
	public get gp(): number { return Math.round(this.core.gp); }
	public get pp(): number { return Math.round(this.core.pp); }
	public get sp(): number { return Math.round(this.core.sp); }
	public gpValue!: number;
	public weight!: Weight;

	public static calculateWeight(coins: CurrencyDnD5e): Weight {
		const count = coins.cp + coins.sp + coins.ep + coins.gp + coins.pp;
		const oz = round(count / 3, 1);
		const lb = round(count / 50, 1);
		return { oz, lb };
	}

	public static toGpString(gp: number): string {
		return CurrencyDnD5e.parse(gp).toString("gp");
	}

	public static readonly CurrencyData: CurrencyData = {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Copper Piece", plural:"Copper Pieces", denom:"cp", value:1/100 },
			{ name:"Silver Piece", plural:"Silver Pieces", denom:"sp", value:1/10 },
			{ name:"Electrum Piece", plural:"Electrum Pieces", denom:"ep", value:1/2 },
			{ name:"Gold Piece", plural:"Gold Pieces", denom:"gp", value:1 },
			{ name:"Platinum Piece", plural:"Platinum Pieces", denom:"pp", value:10 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
		]
	};

	public static readonly GameSystem: GameSystemKey = "DnD5e";

}

// Register the currency to enable currency conversions
Currency.registerCurrency<GameSystemKey, DenominationKeys>(CurrencyDnD5e);

export interface CurrencyDnD5e {
	clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrencyDnD5e;
}