export type ScriptedCharSet = {
	/** "=" */
	equals: string;
	/** "-" */
	minus: string;
	/** ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] */
	numbers: string[];
	/** /-?[0123456789]+(\.[0123456789]+)?/ */
	numberRegex: RegExp;
	/** ["(", ")"] */
	parentheses: string[];
	/** "." */
	period: string;
	/** "+" */
	plus: string;
	/** "sub" | "super" */
	type: "sub" | "super";
}