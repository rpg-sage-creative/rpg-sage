import { captureProcessExit } from "@rsc-utils/console-utils";
import { getPort } from "./sage-utils/utils/EnvUtils";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

captureProcessExit();
RenderableMap.startServer(getPort("Map"));

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
