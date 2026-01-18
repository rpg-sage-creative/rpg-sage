import { globalizeRegex, type Optional } from "@rsc-utils/core-utils";
import { regex } from "regex";

const BasicDiceRegExp = regex("i")`
	\[
	[^\]]*
	(\d|\b)  # dieCount or word break
	d        # XdY separator
	\d+      # dieSize
	[^\]]*
	\]
`;

const BasicDiceRegExpG = globalizeRegex(BasicDiceRegExp);

export function matchBasicDice(content: Optional<string>): `[${string}]`[] {
	return content?.match(BasicDiceRegExpG) as `[${string}]`[] ?? [];
}

export function matchesBasicDice(content: Optional<string>): content is `[${string}]` {
	return content ? BasicDiceRegExp.test(content) : false;
}
