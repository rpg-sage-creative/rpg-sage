import { numberOrUndefined } from "@rsc-utils/core-utils";

const ValidBulkRegex = /^\s*\d+\s*L?\s*$/;
const ValidLightBulkRegex = /^\s*(\d+)\s*L\s*$/;

export class BulkP20 {
	public constructor(bulk?: number | string) {
		this.isNegligible = false;
		this.isLight= false;
		this.lightBulk = BulkP20.toLightBulk(bulk!);
		this.wholeBulk = BulkP20.toWholeBulk(bulk!);
		this.numberValue = 0;
		this.stringValue = "";
		this.updateValues();
	}

	private updateValues(): void {
		const stringParts: string[] = [];
		if (this.wholeBulk) {
			stringParts.push(`${this.wholeBulk} Bulk`);
		}
		if (this.lightBulk) {
			if (this.wholeBulk) {
				stringParts.push(`${this.lightBulk} light`);
			}else if (this.lightBulk > 1) {
				stringParts.push(`${this.lightBulk}L`);
			}else {
				stringParts.push("L");
			}
		}
		this.isNegligible = this.wholeBulk === 0 && this.lightBulk === 0;
		this.isLight = this.wholeBulk === 0 && this.lightBulk === 1;
		/*
		// this.lightBulk = this.lightBulk;
		// this.wholeBulk = this.wholeBulk;
		*/
		this.numberValue = this.wholeBulk + this.lightBulk * 0.1;
		this.stringValue = stringParts.join(", ") || "—"; // emdash
	}

	/**************************************************************************************************************************/
	// Properties

	public isNegligible: boolean;
	public isLight: boolean;
	public lightBulk: number;
	public wholeBulk: number;
	public numberValue: number;
	public stringValue: string;

	/**************************************************************************************************************************/
	//#region Instance Methods

	public add(...bulks: BulkP20[]): void;
	public add(bulk: BulkP20, count: number): void;
	public add(...args: (BulkP20 | number)[]): void {
		if (typeof (args[1]) === "number" && args[0] instanceof BulkP20) {
			const bulk = args[0],
				count = args[1];
			this.lightBulk += bulk.lightBulk * count;
			this.wholeBulk += bulk.wholeBulk * count;
			this.updateValues();
		} else {
			args.forEach(bulk => {
				if (BulkP20.isBulk(bulk)) {
					this.lightBulk += bulk.lightBulk;
					this.wholeBulk += bulk.wholeBulk;
				}
			});
			this.updateValues();
		}
	}

	public clone(): BulkP20 {
		return this.multiply(1);
	}

	public multiply(count: number): BulkP20 {
		const bulk = new BulkP20();
		for (let i = count; i--;) {
			bulk.add(this);
		}
		return bulk;
	}

	public toString(): string {
		return this.stringValue;
	}

	//#endregion

	/**************************************************************************************************************************/
	//#region Static Methods

	public static from(...bulks: BulkP20[]): BulkP20 {
		const bulk = new BulkP20();
		bulk.add(...bulks.filter(BulkP20.isBulk));
		return bulk;
	}

	public static isBulk(bulk: any): bulk is BulkP20 {
		return bulk instanceof BulkP20;
	}

	public static isLight(bulk: number | string): boolean {
		return bulk === "L" || bulk === 0.1;
	}

	public static isNegligible(bulk: number | string): boolean {
		return bulk === "-" // dash
			|| bulk === "—" // emdash
			|| bulk === 0;
	}

	public static isValidBulk(bulk: number | string): boolean {
		return BulkP20.isLight(bulk)
			|| BulkP20.isNegligible(bulk)
			|| ValidBulkRegex.test(String(bulk));
	}

	public static toLightBulk(bulk: number | string): number {
		if (BulkP20.isLight(bulk)) {
			return 1;
		}
		const match = ValidLightBulkRegex.exec(String(bulk));
		return numberOrUndefined(match?.[1]) ?? 0;
	}

	public static toWholeBulk(bulk: number | string): number {
		if (BulkP20.isNegligible(bulk) || BulkP20.isLight(bulk)) {
			return 0;
		}
		return +bulk || 0;
	}

	public static toString(bulk: number | string): string {
		if (BulkP20.isNegligible(bulk)) {
			return "—"; // emdash
		}
		const light = BulkP20.toLightBulk(bulk);
		if (light) {
			return light > 1 ? `${light}L` : "L";
		}
		return String(BulkP20.toWholeBulk(bulk));
	}

	//#endregion

}
