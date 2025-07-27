type Mat = { mat: string | null; }
		 | { mat: "string" | "null"; };

export type Armor = {
	name: string;
	qty: number;
	/** "light" */
	prof: string;
	/** potency: +1 */
	pot: number;
	/** Resilient, Greater Resilient, Major Resilient */
	res: "resilient" | "greater resilient" | "major resilient" | "" | 0;
	/** material */
	// mat: string;
	display: string;
	worn: boolean;
	runes: string[];
} & Mat;