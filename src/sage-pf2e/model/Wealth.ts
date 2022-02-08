import utils, { Core } from "../../sage-utils";
import type { CoinsCore } from "./Coins";
import Coins from "./Coins";

export interface IValuable {
	bulk: string;
	description: string;
	name: string;
	objectType: "Valuable";
	value: string;
}

export interface IStartingWealth {
	level: number;
	permanentItems: number[];
	currency: string;
}

export interface IWealth extends Core {
	coins: CoinsCore;
	valuables: IValuable[];
}

export default class Wealth extends utils.ClassUtils.HasCore<IWealth> {

	public constructor(core: IWealth = <any>{}) {
		super(core);
		if (!core.coins) {
			core.coins = <any>{};
		}
		if (!core.objectType) {
			core.objectType = "Wealth";
		}
		if (!core.valuables) {
			core.valuables = [];
		}
		this.coins = new Coins(core.coins);
	}

	public coins: Coins;

	public get valuables(): IValuable[] { return this.core.valuables; }

	public get spValue(): number {
		const coins = this.coins.clone();
		this.valuables.forEach(v => coins.add(v.value));
		return coins.spValue;
	}

	public static getStartingWealth(level: number): IStartingWealth {
		const currencies = ["", "15 gp", "15 gp", "20 gp", "30 gp", "50 gp", "80 gp", "125 gp", "180 gp", "250 gp", "350 gp", "500 gp", "700 gp", "1,000 gp", "1,500 gp", "2,250 gp", "3,250 gp", "5,000 gp", "7,500 gp", "12,000 gp", "20,000 gp"];
		const currency = currencies[level];
		const permanentItems: number[] = [];
		let itemLevel = level;
		if (--itemLevel > 0) {
			permanentItems.push(itemLevel);
		}
		if (--itemLevel > 0) {
			permanentItems.push(itemLevel, itemLevel);
		}
		if (--itemLevel > 0) {
			permanentItems.push(itemLevel);
		}
		if (--itemLevel > 0) {
			permanentItems.push(itemLevel, itemLevel);
		}
		return { level, permanentItems, currency };
	}

}
