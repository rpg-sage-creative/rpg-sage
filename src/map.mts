import { getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/env-utils";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

initializeConsoleUtilsByEnvironment();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
