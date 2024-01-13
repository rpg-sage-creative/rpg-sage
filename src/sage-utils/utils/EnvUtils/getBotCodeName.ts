import { getFromProcess } from "./internal/getFromProcess";

export type TBot = "dev" | "beta" | "stable";

function isValid(value: string | number | null | undefined): value is TBot {
	return ["dev", "beta", "stable"].includes(String(value));
}

let _botCodeName: TBot;
export function getBotCodeName(): TBot {
	if (!_botCodeName) {
		_botCodeName = getFromProcess(isValid, "botCodeName", "NODE_ENV");
	}
	return _botCodeName;
}
