import { getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { activate } from "./sage-lib/index.js";
import { RenderableMap } from "./sage-utils/utils/MapUtils/index.js";

initializeConsoleUtilsByEnvironment();
RenderableMap.startServer(getPort("Map"));
activate();

// node --experimental-modules --es-module-specifier-resolution=node mono.mjs
