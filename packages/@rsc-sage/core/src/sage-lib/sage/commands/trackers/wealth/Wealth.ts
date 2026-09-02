export type Wealth = {
	/** who's wealth */
	name: string;

	/** starfinder (pew pew) = 1 sp */
	credits: number;
	upbs: number;

	/** platinum = 10 gold */
	pp: number;

	/** gold = 2 ep or 10 silver */
	gp: number;

	/** electrum (dnd) = 5 sp */
	ep: number;

	/** silver = 10 cp */
	sp: number;

	/** copper */
	cp: number;

	/** non coin/credit valuables */
	valuables: string[];

	/** pre formatted summary */
	summary: string;
};
