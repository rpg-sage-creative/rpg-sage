import { Currency, type CurrencyCore, type CurrencyData } from "../../../currency/Currency.js";
// import { Bulk } from "./Bulk.js";

type GameSystemKey = "SF1e";

type DenominationKeys = "credits" | "upbs";

export type CurrencyCoreSF1e = CurrencyCore<GameSystemKey, DenominationKeys>;

export type CurrencySF1eArg = Omit<CurrencyCoreSF1e, "objectType" | "gameSystem">;

export class CurrencySF1e extends Currency<GameSystemKey, DenominationKeys, CurrencyCoreSF1e, CurrencySF1e> {

	public constructor(core?: Partial<CurrencySF1eArg>) {
		super({ ...core, gameSystem:CurrencySF1e.GameSystem });
	}

	protected handleUpdates(): void {
		// this.bulk = CurrencySF1e.calculateBulk(this);
		this.creditsValue = this.toValue();
	}

	// public bulk!: Bulk;
	public get credits(): number { return Math.round(this.core.credits); }
	public get upbs(): number { return Math.round(this.core.upbs); }
	public creditsValue!: number;

	// public static calculateBulk(curr: CurrencySF1e): Bulk {
	// 	// bulk is 1 per 1,000 UPBs
	// 	return new Bulk(Math.floor(curr.upbs / 1000));
	// }

	public static override readonly CurrencyData: CurrencyData = {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Credit", plural:"Credits", denom:"credits", value:1 },
			{ name:"Universal Polymer Base", plural:"UPBs", denom:"upbs", value:1 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
		]
	};

	public static override readonly GameSystem: GameSystemKey = "SF1e";

}

// Register the currency to enable currency conversions
Currency.registerCurrency<GameSystemKey, DenominationKeys>(CurrencySF1e);

export interface CurrencySF1e {
	clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrencySF1e;
}