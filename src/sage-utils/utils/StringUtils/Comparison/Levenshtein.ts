export default class LevenshteinComparator {
	// Compute the edit distance between the two given strings
	public static compare(textOne: string, textTwo: string): number {
		if (textOne.length === 0) {
			return textTwo.length;
		}
		if (textTwo.length === 0) {
			return textOne.length;
		}

		const matrix: number[][] = [];

		// increment along the first column of each row
		for (let i = 0; i <= textTwo.length; i++) {
			matrix[i] = [i];
		}

		// increment each column in the first row
		for (let j = 0; j <= textOne.length; j++) {
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for (let i = 1; i <= textTwo.length; i++) {
			for (let j = 1; j <= textOne.length; j++) {
				if (textTwo.charAt(i - 1) === textOne.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
											Math.min(matrix[i][j - 1] + 1, // insertion
													matrix[i - 1][j] + 1)); // deletion
				}
			}
		}

		const distance = matrix[textTwo.length][textOne.length];
		return 1 - distance / Math.max(textOne.length, textTwo.length);
	}
}