export type CardBase = {
	/** Generally the index in a "new deck order" */
	id: number;
	name: string;
	code: string;
	emoji?: string;
};