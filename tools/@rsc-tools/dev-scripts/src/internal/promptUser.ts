import { createInterface } from 'node:readline/promises';

type PromptOptions = { prompt:string; values:string[]; defValue?:string; };

/**
 * Function to prompt user via CLI with options
 */
export async function promptUser({ prompt, values, defValue }: PromptOptions): Promise<string | undefined> {
	return new Promise<string | undefined>(async resolve => {
		const readline = createInterface({
			input: process.stdin,
			output: process.stdout
		});

		// Create question text
		let promptText = prompt;
		values.forEach((value, index) => {
			promptText += `${index ? ", " : " "}${index + 1}. ${value}${value === defValue ? " (def)" : ""}`;
		});
		promptText += ": ";

		// get user input
		const _answer = await readline.question(promptText).catch(() => process.exit(1));
		const answer = _answer?.toLowerCase().trim();

		// if no input was given and we have a default value
		if (!answer && defValue) {
			readline.close();
			resolve(defValue);
			return;
		}

		// exit if desired
		if (["quit","q","exit","x"].includes(answer)) {
			console.log("Exiting...");
			process.exit(1);
		}

		// convert user input to value index
		const index = values.includes(answer)
			// indexOf value
			? values.indexOf(answer)
			// number - 1
			: +answer - 1;

		// get value (or undefined) by index
		const value = values[index];

		// warn or invalid answers
		if (answer && !value) {
			console.warn("\tInvalid value: " + answer);
			process.exit(1);
		}

		readline.close();
		resolve(value);
	});
}