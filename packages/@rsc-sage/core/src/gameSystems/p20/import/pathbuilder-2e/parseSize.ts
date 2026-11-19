import { Enum } from "@rsc-utils/type-utils";
import { SizeType } from "../../lib/types.js";

type PathbuilderSizeInfo = {
	size: SizeType;
	sizeName: keyof typeof SizeType
};

/** Allows any type of incoming variable, but compares a number (enum) or a string (letter or word). */
export function parseSize(value: unknown): PathbuilderSizeInfo {
	if (value) {
		// force to string, grab first character (enum: 0, 1, 2; letter: T, S, M)
		const letter = String(value)[0].toUpperCase();
		for (const sizeName of Enum.keys(SizeType)) {
			if (sizeName[0] === letter) {
				const size = SizeType[sizeName];
				return { size, sizeName };
			}
		}
	}
	return { size:SizeType.Medium, sizeName:"Medium" };
}