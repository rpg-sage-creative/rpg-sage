import type { Optional, OrNull } from "@rsc-utils/type-utils";
import utils from "../../sage-utils";
import { Dice } from "../dice/base";
import type { TDice } from "../dice/base/types";

const allTables: { [key: string]: Table<TableItem> } = {};

export interface ITable {
	name: string;
	items: ITableItem[];
	next: OrNull<string>;
}

// Table
/**************************************************************************************************/
export class Table<TI extends TableItem> implements ITable {
	public items: TI[];
	public name: string;
	public next: OrNull<string>;

	public constructor(table: ITable);
	public constructor(name: string, items: TI[]);
	public constructor(name: string, items: TI[], next: Optional<string>);
	public constructor(tableOrName: string | ITable, items?: TI[], next?: Optional<string>) {
		if (typeof(tableOrName) === "string") {
			this.name = tableOrName;
			this.items = items ?? [];
			this.next = next ?? null;
		}else {
			this.name = tableOrName.name;
			this.items = (tableOrName.items ?? []).map(this.createTableItem);
			this.next = tableOrName.next ?? null;
		}
		allTables[this.name] = this;
	}

	protected createTableItem(tableItem: ITableItem): TI {
		return <TI>new TableItem(tableItem);
	}
	protected createTableResults(count: number): TableResults<TI> {
		return new TableResults(this, count);
	}
	createTableResultsItem(value: number): TableResultsItem<TI> {
		return new TableResultsItem<TI>(this, value);
	}

	public clone(): Table<TI> {
		return new Table<TI>(this.name, (<any>Object).clone(this.items), this.next);
	}
	public getItemByValue(value: number): OrNull<TI> {
		let spread: number = 1;
		return this.items.find(item => {
				spread += item.spread;
			return value < spread;
		}) ?? null;
	}
	public getTotalSpread(): number {
		return this.items.map(item => item.spread).reduce((sum, value) => sum + value);
	}
	public roll(count = 1): TableResults<TI> {
		return this.createTableResults(count);
	}
	public toString(): string{
		return `[object rpg.Table(${this.name})]`;
	}

	public static getByName(name: string): OrNull<Table<TableItem>>;
	public static getByName<T extends Table<TableItem>>(name: string): OrNull<T>;
	public static getByName<T extends Table<TableItem>>(name: string): OrNull<T> {
		return allTables[name] as T ?? null;
	}

	public static rollByName(name: string): OrNull<TableResults<TableItem>>;
	public static rollByName<T extends TableResults<TableItem>>(name: string): OrNull<T>;
	public static rollByName<T extends TableResults<TableItem>>(name: string): OrNull<T> {
		return allTables[name]?.roll() as T ?? null;
	}
}

export interface ITableItem {
	high: number;
	label: OrNull<string>;
	low: number;
	next: OrNull<string>;
	nextDice: OrNull<string>;
	nextTimes: OrNull<string>;
	spread: number;
	text: OrNull<string>;
	unique: boolean;
}

// TableItem
/**************************************************************************************************/
export class TableItem implements ITableItem {
	public high: number = 0;
	public label: OrNull<string> = null;
	public low: number = 0;
	public next: OrNull<string> = null;
	public nextDice: OrNull<string> = null;
	public nextTimes: OrNull<string> = null;
	public spread: number = 0;
	public text: OrNull<string> = null;
	public unique: boolean = false;

	public constructor();
	public constructor(tableItem: ITableItem);
	public constructor(spread: number, label: Optional<string>);
	public constructor(spread: number, label: Optional<string>, text: Optional<string>);
	public constructor(tableItemOrSpread?: any, label?: Optional<string>, text?: Optional<string>) {
		if (typeof(tableItemOrSpread) === "number") {
			this.spread = tableItemOrSpread;
			this.label = label ?? null;
			this.text = text ?? null;
		}else {
			Object.keys(tableItemOrSpread).forEach(key => (this as any)[key] = tableItemOrSpread[key]);
			if (this.spread === 0) {
				this.spread = 1 + this.high - this.low;
			}
		}
	}

	public clone(): TableItem {
		return new TableItem(this.spread, this.label, this.text);
	}
	public toString(): string {
		const spread = this.spread,
			numbers = this.high > 0 ? `(${this.low}-${this.high})` : ``,
			label = this.label;
		return `${spread} ${numbers} ${label}`;
	}
}

// NextTableInfo
/**************************************************************************************************/
export interface INextTableInfoItem {
	tableName: string;
	dice: TDice;
	times: number;
	descriptor: OrNull<string>;
}
function subtractSecondValue(table: NextTableInfo, neg: boolean): void {
	// Some Items say: 1d4 items, 1d3-1 of which are blah. so you subtract the values and roll on two tables
	const second = table.items[1];
	if ((table.items.length === 2) && neg) {
		table.items[0].times -= second.times;
	}
}
export class NextTableInfo {
	public items: INextTableInfoItem[] = [];

	public constructor(targets: string);
	public constructor(targets: string, dice: Optional<string>);
	public constructor(targets: string, dice: Optional<string>, times: Optional<string>);
	public constructor(targetString: string, diceString?: Optional<string>, timesString?: Optional<string>) {
		const targetsArray = targetString.split("|"),
			diceArray = (diceString ?? "").split("|"),
			timesArray = (timesString ?? "").split("|");

		let neg = false;
		let target: string, dice: string, times: string;
		let parts: string[], desc: Optional<string>;
		let count: number = Math.max(targetsArray.length, diceArray.length, timesArray.length);
		while (count--) {
			target = targetsArray[count] || targetsArray[0];
			dice = diceArray[count] || diceArray[0];
			times = timesArray[count] || timesArray[0] || "1";
			neg = times.startsWith("-");
			if (neg) {
				times = times.substr(1);
			}

			parts = target.split("(");
			target = parts[0].trim();
			desc = parts.length > 1 ? parts[1].split(")")[0].trim() : null;

			this.items[count] = {
				tableName: target,
				dice: Dice.parse(dice),
				times: Dice.roll(times)!,
				descriptor: desc
			};
		}

		// Some Items say: 1d4 items, 1d3-1 of which are blah. so you subtract the values and roll on two tables
		subtractSecondValue(this, neg);
	}

	public roll<TRI extends TableResultsItem<TableItem>>(): TRI[] {
		const nextItems: INextTableInfoItem[] = this.items,
			items: TRI[] = [];
		let nextItem: INextTableInfoItem,
			nextTable: Table<TableItem>,
			nextResults: TRI,
			itemIndex: number = 0,
			spread: number,
			value: number;

		for (let index = nextItems.length; index--;) {
			nextItem = nextItems[index];
			//TODO: Nest the Times roll as a special table to show what was rolled on it
			nextTable = allTables[nextItem.tableName];
			spread = nextTable.getTotalSpread();
			for (let loopIndex = nextItem.times; loopIndex--;) {
				value = utils.RandomUtils.random(spread);
				nextResults = <TRI>nextTable.createTableResultsItem(value);
				nextResults.descriptor = nextItem.descriptor;
				items[itemIndex++] = nextResults;
			}
		}
		return items;
	}

}

// TableResults
/**************************************************************************************************/
export class TableResults<TI extends TableItem> {
	public items: TableResultsItem<TI>[] = [];
	public rolls: number;
	public table: Table<TI>;

	public constructor(table: Table<TI>, rolls: number) {
		this.rolls = rolls;
		this.table = table;

		const totalSpread: number = table.getTotalSpread(),
			items = this.items;
		let counter = rolls,
			value: number;
		while (counter--) {
			value = utils.RandomUtils.random(totalSpread);
			items[counter] = table.createTableResultsItem(value);
		}
	}
	public toString(): string {
		return `[object TableResults(${this.items.length})]`;
	}
}

// TableResultsItem
/**************************************************************************************************/
export class TableResultsItem<TI extends TableItem> {
	public descriptor: OrNull<string> = null;
	public item: OrNull<TI>;
	public items: TableResultsItem<TI>[] = [];

	public constructor(public table: Table<TI>, public value: number) {
		const item = this.item = table.getItemByValue(this.value),
			nextString = item?.next ?? null;

		let nextInfo: NextTableInfo;
		if (nextString !== null) {
			nextInfo = new NextTableInfo(nextString, item?.nextDice ?? null, item?.nextTimes ?? null);
			let hasDuplicates: boolean = false,
				allLabels: string[],
				itemCount: number,
				tries = 0;
			do {
				this.items = nextInfo.roll<TableResultsItem<TI>>();
				itemCount = 1 + this.items.length;
				allLabels = this.getUniqueLabels();
				hasDuplicates = itemCount !== allLabels.length;
				tries++;
				if (tries > 10) {
					break;
				}
			} while (hasDuplicates);
		}

		const next = table.next;
		if (next !== null) {
			nextInfo = new NextTableInfo(next);
			const nextItems = nextInfo.roll<TableResultsItem<TI>>();
			this.items = this.items.concat((nextItems));
		}
	}

	public getUniqueLabels(): string[] {
		let labels: OrNull<string>[] = [this.item?.label ?? null];
		const items = this.items ?? [];
		let itemIndex = items.length;
		if (itemIndex > 0) {
			while (itemIndex--) {
				labels = labels.concat(items[itemIndex].getUniqueLabels());
			}
		}
		return labels.filter(utils.ArrayUtils.Filters.existsAndUnique);
	}
	public toHtmlString(tabLevel: number): string {
		let html = "<div class='Result'><table><tr>";

		for (let tabIndex = tabLevel; tabIndex--;) {
			html += `<td class='Tab'>${tabIndex > 0 ? "" : "&#8627;"}</td>`;
		}

		const descriptor = this.descriptor ? `<br/>(${this.descriptor})` : ``;
		html += `<td class='Label'>${this.table.name}${descriptor}</td>`;
		// TODO: why was this here? html += "<td class='Value'>(" + this.Value + ")</td>";

		const item = this.item!;
		html += "<td class='Text'>" + item.label;
		if (item.text !== null) {
			html += "<br/>" + item.text;
		}
		html += "</td>";

		html += "</tr></table></div>";

		if (this.items.length > 0) {
			const newTabLevel = tabLevel + 1;
			html += this.items.map(child => child.toHtmlString(newTabLevel)).join("");
		}
		return html;
	}
	public toString(): string {
		const additionalItems = this.items.length,
			additionalItemsText = additionalItems > 0 ? ` (+${additionalItems})` : "";
		return `${this.value}: ${this.item!.label}${additionalItemsText}`;
	}
}
