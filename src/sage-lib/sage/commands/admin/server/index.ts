import { registerAdmin } from "./admin.js";
import { registerPrefix } from "./prefix.js";
import { registerRole } from "./role.js";
import { registerServer as _registerServer } from "./server.js";

export function registerServer(): void {
	registerAdmin();
	registerPrefix();
	registerRole();
	_registerServer();
}
