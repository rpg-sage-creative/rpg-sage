type Mat = { mat: string | null; }
		 | { mat: "string" | "null"; };

export type Weapon = {
	name: string;
	qty: number;
	/* proficiency: "martial" */
	prof: string;
	/* "d6" */
	die: string;
	/* potency: +1 */
	pot: number;
	/* Striking, Greater Striking, Major Striking */
	str: "striking" | "greater striking" | "major striking" | "";
	/* material , ex: "Cold Iron (Standard-Grade)"*/
	// mat: string | null;
	/** display name */
	display: string;
	runes: string[];
	/** "B" | "P" */
	damageType: string;
	/** attack bonus ? */
	attack: number;
	damageBonus: number;
	extraDamage: [];
	increasedDice: boolean;
	isInventor: boolean;
} & Mat;