import { register as registerAdmin } from "./admin";
import { register as registerPrefix } from "./prefix";
import { register as registerRole } from "./role";
import { register as registerServer } from "./server";

export function register(): void {
	registerAdmin();
	registerPrefix();
	registerRole();
	registerServer();
}
