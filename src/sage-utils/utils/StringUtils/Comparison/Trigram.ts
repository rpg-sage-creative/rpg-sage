import { unique } from "../../ArrayUtils/Filters";

function toTriGrams(text: string, ignoreCase: boolean): string[] {
	const triGrams: string[] = [];
	let paddedText = `  ${(text || "").trim()}  `;
	if (ignoreCase) {
		paddedText = paddedText.toLowerCase();
	}
	for (let i = paddedText.length - 3; i >= 0; i = i - 1) {
		triGrams.push(paddedText.slice(i, i + 3));
	}
	return triGrams;
}

export default class SimpleTriGramComparator {
	private baseTriGrams: string[];
	public constructor(public baseText: string, public ignoreCase = false) {
		this.baseTriGrams = toTriGrams(this.baseText, this.ignoreCase);
	}
	public compare(inputText: string): number {
		const inputTriGrams = toTriGrams(inputText, this.ignoreCase);
		const matchingTriGrams = this.baseTriGrams.filter((triGram, index) => inputTriGrams[index] === triGram);
		const matchingTriGramCount = matchingTriGrams.length;
		const uniqueTriGrams = this.baseTriGrams.concat(inputTriGrams).filter(unique);
		const uniqueTriGramCount = uniqueTriGrams.length;
		return matchingTriGramCount / uniqueTriGramCount;
	}
	public static compare(textOne: string, textTwo: string, ignoreCase?: boolean): number {
		return new SimpleTriGramComparator(textOne, ignoreCase).compare(textTwo);
	}
}
