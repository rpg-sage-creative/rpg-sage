import { registerPfs } from "./pfs.js";
import { registerS101 } from "./pfs.s1-01.js";

export function registerPfsCommands(): void {
	registerPfs();
	registerS101();
}
