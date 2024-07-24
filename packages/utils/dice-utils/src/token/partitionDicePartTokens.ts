import type { TokenData } from "../internal/tokenize.js";

function isTestOrTarget(token: TokenData): token is TokenData<"target" | "test"> {
	return ["test", "target"].includes(token.key);
}

function shouldStartNewPart(currentPart: TokenData[], currentToken: TokenData): boolean {
	return !currentPart || ["dice", "mod", "test"].includes(currentToken.key);
}

export function partitionDicePartTokens(tokens: TokenData[]): TokenData[][] {
	let currentPart: TokenData[];
	const partedTokens: TokenData[][] = [];
	tokens.forEach(token => {
		if (shouldStartNewPart(currentPart, token)) {
			currentPart = [];
			partedTokens.push(currentPart);
		}
		currentPart.push(token);
		if (isTestOrTarget(token)) {
			currentPart = [];
			partedTokens.push(currentPart);
		}
	});
	return partedTokens.filter(array => array.length);

}