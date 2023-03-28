import { SuperClass } from "../../sage-utils/utils/ClassUtils";
import { DASH, LIGHT_BULK, MDASH } from "../common";

export default class Bulk extends SuperClass {
	public constructor();
	public constructor(bulk: number);
	public constructor(bulk: string);
	public constructor(bulk?: number | string) {
		super();
		this.isNegligible = false;
		this.isLight= false;
		this.lightBulk = Bulk.toLightBulk(bulk!);
		this.wholeBulk = Bulk.toWholeBulk(bulk!);
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
				stringParts.push(LIGHT_BULK);
			}
		}
		this.isNegligible = this.wholeBulk === 0 && this.lightBulk === 0;
		this.isLight = this.wholeBulk === 0 && this.lightBulk === 1;
		/*
		// this.lightBulk = this.lightBulk;
		// this.wholeBulk = this.wholeBulk;
		*/
		this.numberValue = this.wholeBulk + this.lightBulk * 0.1;
		this.stringValue = stringParts.join(", ") || MDASH;
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
	// Instance Methods

	public add(...bulks: Bulk[]): void;
	public add(bulk: Bulk, count: number): void;
	public add(...args: (Bulk | number)[]): void {
		if (typeof (args[1]) === "number" && Bulk.instanceOf(args[0])) {
			const bulk = args[0],
				count = args[1];
			this.lightBulk += bulk.lightBulk * count;
			this.wholeBulk += bulk.wholeBulk * count;
			this.updateValues();
		} else {
			args.forEach(bulk => {
				if (Bulk.isBulk(bulk)) {
					this.lightBulk += bulk.lightBulk;
					this.wholeBulk += bulk.wholeBulk;
				}
			});
			this.updateValues();
		}
	}
	public clone(): Bulk {
		return this.multiply(1);
	}
	public multiply(count: number): Bulk {
		const bulk = new Bulk();
		for (let i = count; i--;) {
			bulk.add(this);
		}
		return bulk;
	}
	public toString(): string {
		return this.stringValue;
	}

	/**************************************************************************************************************************/
	// Static Methods

	public static from(...bulks: Bulk[]): Bulk {
		const bulk = new Bulk();
		bulk.add(...bulks.filter(Bulk.isBulk));
		return bulk;
	}
	public static isBulk(bulk: any): bulk is Bulk {
		return Bulk.instanceOf(bulk);
	}
	public static isLight(bulk: number | string): boolean {
		return bulk === LIGHT_BULK || bulk === 0.1;
	}
	public static isNegligible(bulk: number | string): boolean {
		return bulk === DASH || bulk === MDASH || bulk === 0;
	}
	public static isValidBulk(bulk: number | string): boolean {
		return Bulk.isLight(bulk) || Bulk.isNegligible(bulk) || String(bulk).match(/^\s*\d+\s*L?\s*$/) !== null;
	}
	public static toLightBulk(bulk: number | string): number {
		if (Bulk.isLight(bulk)) {
			return 1;
		}
		const match = String(bulk).match(/^\s*(\d+)\s*L\s*$/);
		return match && +match[1] || 0;
	}
	public static toWholeBulk(bulk: number | string): number {
		if (Bulk.isNegligible(bulk) || Bulk.isLight(bulk)) {
			return 0;
		}
		return +bulk || 0;
	}
	public static toString(bulk: number | string): string {
		if (Bulk.isNegligible(bulk)) {
			return MDASH;
		}
		const light = Bulk.toLightBulk(bulk);
		if (light) {
			return light > 1 ? `${light}L` : LIGHT_BULK;
		}
		return String(Bulk.toWholeBulk(bulk));
	}
}
