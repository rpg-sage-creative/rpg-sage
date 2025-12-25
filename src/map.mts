import { getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { RenderableMap } from "@rsc-utils/game-utils";

initializeConsoleUtilsByEnvironment();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
