import { getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { activate } from "./sage-lib";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

initializeConsoleUtilsByEnvironment();
RenderableMap.startServer(getPort("Map"));
activate();

// node --experimental-modules --es-module-specifier-resolution=node mono.mjs
