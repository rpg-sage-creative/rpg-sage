import { registerPfs } from "./pfs";
import { registerS101 } from "./pfs.s1-01";

export function register(): void {
	registerPfs();
	registerS101();
}
