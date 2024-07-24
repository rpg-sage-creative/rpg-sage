import { getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { RenderableMap } from "./sage-utils/utils/MapUtils/index.js";

initializeConsoleUtilsByEnvironment();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
