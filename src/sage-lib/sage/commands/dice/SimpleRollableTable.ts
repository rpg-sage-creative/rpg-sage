/** Represents a simple rollable table */
export type SimpleRollableTable = {
	/** lowest integer result value */
	min: number;

	/** highest integer result value */
	max: number;

	/** number of items */
	count: number;

	/** items on the table */
	items: SimpleRollableTableItem[];
};

/** Represents a single item in a simple rollable table */
export type SimpleRollableTableItem = {
	/** lowest roll that results in this item */
	min: number;

	/** highest roll that results in this item */
	max: number;

	/** text of the item */
	text: string;

	/** child rolls to be made whent his result is rolled */
	children?: string[];
};
