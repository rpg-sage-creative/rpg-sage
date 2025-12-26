import { Currency, type CurrencyCore, type CurrencyData } from "../../../../currency/Currency.js";
import { BulkP20 } from "../../BulkP20.js";

type GameSystemKey = "SF2e";

type DenominationKeys = "credits" | "upbs";

export type CurrencyCoreSf2e = CurrencyCore<GameSystemKey, DenominationKeys>;

export type CurrencySf2eArg = Omit<CurrencyCoreSf2e, "objectType" | "gameSystem">;

export class CurrencySf2e extends Currency<GameSystemKey, DenominationKeys, CurrencyCoreSf2e, CurrencySf2e> {

	public constructor(core?: Partial<CurrencySf2eArg>) {
		super({ ...core, gameSystem:CurrencySf2e.GameSystem });
	}

	protected handleUpdates(): void {
		this.bulk = CurrencySf2e.calculateBulk(this);
		this.creditsValue = this.toValue();
	}

	public bulk!: BulkP20;
	public get credits(): number { return Math.round(this.core.credits); }
	public get upbs(): number { return Math.round(this.core.upbs); }
	public creditsValue!: number;

	public static calculateBulk(curr: CurrencySf2e): BulkP20 {
		// bulk is 1 per 1,000 UPBs
		return new BulkP20(Math.floor(curr.upbs / 1000));
	}

	public static readonly CurrencyData: CurrencyData = {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Credit", plural:"Credits", denom:"credits", value:1 },
			{ name:"Universal Polymer Base", plural:"UPBs", denom:"upbs", value:1 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
			// one Credit is worth one Silver Piece
			{ system:"PF2e", denom:"sp", value:1 },
		]
	};

	public static readonly GameSystem: GameSystemKey = "SF2e";

}

// Register the currency to enable currency conversions
Currency.registerCurrency<GameSystemKey, DenominationKeys>(CurrencySf2e);

export interface CurrencySf2e {
	clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrencySf2e;
}