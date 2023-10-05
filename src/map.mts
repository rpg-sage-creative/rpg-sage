import { info, setEnv } from "./sage-utils/utils/ConsoleUtils";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

type TBot = "dev" | "beta" | "stable";

const args = process.argv.slice(2),
	botCodeName = ["dev","beta","stable"].find(s => args.includes(s)) as TBot ?? "dev"

setEnv(botCodeName);
RenderableMap.startServer(3000);

info("Map Server Started ...");

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
