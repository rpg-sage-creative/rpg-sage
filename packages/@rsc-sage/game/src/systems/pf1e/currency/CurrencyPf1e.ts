import { Currency, type CurrencyCore, type CurrencyData } from "../../../currency/Currency.js";

type GameSystemKey = "PF1e";

type DenominationKeys = "cp" | "sp" | "gp" | "pp";

type Weight = { oz:number; lb:number; };

export type CurrencyCorePf1e = CurrencyCore<GameSystemKey, DenominationKeys>;

export type CurrencyPf1eArg = Omit<CurrencyCorePf1e, "objectType" | "gameSystem">;

export class CurrencyPf1e extends Currency<GameSystemKey, DenominationKeys, CurrencyCorePf1e, CurrencyPf1e> {

	public constructor(core?: Partial<CurrencyPf1eArg>) {
		super({ ...core, gameSystem:CurrencyPf1e.GameSystem });
	}

	protected handleUpdates(): void {
		this.gpValue = this.toValue();
		this.weight = CurrencyPf1e.calculateWeight(this);
	}

	public get cp(): number { return Math.round(this.core.cp); }
	public get gp(): number { return Math.round(this.core.gp); }
	public get pp(): number { return Math.round(this.core.pp); }
	public get sp(): number { return Math.round(this.core.sp); }
	public gpValue!: number;
	public weight!: Weight;

	public static calculateWeight(coins: CurrencyPf1e): Weight {
		const count = coins.cp + coins.sp + coins.gp + coins.pp;
		const pounds = count / 50;
		const lb = Math.floor(pounds);
		const oz = Math.floor(16 * (pounds - lb));
		return { oz, lb };
	}

	public static toGpString(gp: number): string {
		return CurrencyPf1e.parse(gp).toString("gp");
	}

	public static override readonly CurrencyData: CurrencyData = {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Copper Piece", plural:"Copper Pieces", denom:"cp", value:1/100 },
			{ name:"Silver Piece", plural:"Silver Pieces", denom:"sp", value:1/10 },
			{ name:"Gold Piece", plural:"Gold Pieces", denom:"gp", value:1 },
			{ name:"Platinum Piece", plural:"Platinum Pieces", denom:"pp", value:10 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
		]
	};

	public static override readonly GameSystem: GameSystemKey = "PF1e";

}

// Register the currency to enable currency conversions
Currency.registerCurrency<GameSystemKey, DenominationKeys>(CurrencyPf1e);

export interface CurrencyPf1e {
	clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrencyPf1e;
}