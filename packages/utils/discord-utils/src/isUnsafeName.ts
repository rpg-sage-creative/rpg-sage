import type { Optional } from "@rsc-utils/core-utils";

/** Checks to see if the name contains something that Discord won't allow. */
export function isUnsafeName(name: Optional<string>): "discord" | false {
	if (name) {
		if (/d[il1][s5]c[o0]rd/i.test(name)) {
			return "discord";
		}
	}
	return false;
}