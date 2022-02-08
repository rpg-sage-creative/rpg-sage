import registerPfs from "./pfs";
import registerS101 from "./pfs.s1-01";

export default function register(): void {
	registerPfs();
	registerS101();
}
