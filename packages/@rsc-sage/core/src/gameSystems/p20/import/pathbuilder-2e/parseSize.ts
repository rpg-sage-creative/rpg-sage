import { parseEnum } from "@rsc-utils/core-utils";
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
		for (const key in SizeType) {
			// convert key to string because incoming arg was converted
			if (String(key)[0] === letter) {
				// use parse enum to ensure we have the numerical enum value
				const size = parseEnum<SizeType>(SizeType, key)!;
				const sizeName = SizeType[size] as keyof typeof SizeType;
				return { size, sizeName };
			}
		}
	}
	return { size:SizeType.Medium, sizeName:"Medium" };
}