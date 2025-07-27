export type Familiar = {
	type: "Familiar";
	/** type === "Familiar" && specific === "Faerie Dragon"  >>  Faerie Dragon (name) */
	name: string;
	/** "Faerie Dragon" */
	specific: string;
	abilities: string[];
};