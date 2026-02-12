import { Currency, type CurrencyCore, type CurrencyData } from "../../../../currency/Currency.js";
import { BulkP20 } from "../../BulkP20.js";

type GameSystemKey = "PF2e";

type DenominationKeys = "cp" | "sp" | "gp" | "pp";

export type CurrencyCorePf2e = CurrencyCore<GameSystemKey, DenominationKeys>;

export type CurrencyPf2eArg = Omit<CurrencyCorePf2e, "objectType" | "gameSystem">;

export class CurrencyPf2e extends Currency<GameSystemKey, DenominationKeys, CurrencyCorePf2e, CurrencyPf2e> {

	public constructor(core?: Partial<CurrencyPf2eArg>) {
		super({ ...core, gameSystem:CurrencyPf2e.GameSystem });
	}

	protected handleUpdates(): void {
		this.bulk = CurrencyPf2e.calculateBulk(this);
		this.spValue = this.toValue();
	}

	public bulk!: BulkP20;
	public get cp(): number { return Math.round(this.core.cp); }
	public get gp(): number { return Math.round(this.core.gp); }
	public get pp(): number { return Math.round(this.core.pp); }
	public get sp(): number { return Math.round(this.core.sp); }
	public spValue!: number;

	public static calculateBulk(curr: CurrencyPf2e): BulkP20 {
		// bulk is 1 per 1,000 coins
		return new BulkP20(Math.floor((curr.cp + curr.sp + curr.gp + curr.pp) / 1000));
	}

	public static toGpString(sp: number): string {
		return CurrencyPf2e.parse(sp).toString("gp");
	}

	public static override readonly CurrencyData: CurrencyData = {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Copper Piece", plural:"Copper Pieces", denom:"cp", value:1/10 },
			{ name:"Silver Piece", plural:"Silver Pieces", denom:"sp", value:1 },
			{ name:"Gold Piece", plural:"Gold Pieces", denom:"gp", value:10 },
			{ name:"Platinum Piece", plural:"Platinum Pieces", denom:"pp", value:100 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
			// one Silver Piece is worth one credit
			{ system:"SF2e", denom:"credit", value:1 },
		]
	};

	public static override readonly GameSystem: GameSystemKey = "PF2e";

}

// Register the currency to enable currency conversions
Currency.registerCurrency<GameSystemKey, DenominationKeys>(CurrencyPf2e);

export interface CurrencyPf2e {
	clone(opts?: { neg?:boolean; } | { invert?:boolean; }): CurrencyPf2e;
}