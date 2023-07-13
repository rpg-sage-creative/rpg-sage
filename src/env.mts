
type TBot = "dev" | "beta" | "stable";
let _botCodeName: TBot;
export function getBotCodeName(): TBot {
	if (!_botCodeName) {
		_botCodeName = process.env["botCodeName"] as TBot ?? "dev";
	}
	return _botCodeName;
}

let _pf2DataPath: string;
export function getPf2DataPath(): string {
	if (!_pf2DataPath) {
		_pf2DataPath = process.env["pf2DataPath"] ?? "./data/pf2e";
	}
	return _pf2DataPath;
}
