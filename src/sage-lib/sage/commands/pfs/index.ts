import { registerPfs } from "./pfs";
import { registerS101 } from "./pfs.s1-01";

export function registerPfsCommands(): void {
	registerPfs();
	registerS101();
}
