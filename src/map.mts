import { setEnv } from "./sage-utils/utils/ConsoleUtils";
import { captureProcessExit } from "./sage-utils/utils/ConsoleUtils/process";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev"

captureProcessExit();
setEnv(botCodeName);
RenderableMap.startServer(3000);

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
