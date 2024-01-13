import { captureProcessExit } from "@rsc-utils/console-utils";
import { activate } from "./sage-lib";
import { getPort } from "./sage-utils/utils/EnvUtils";
import { RenderableMap } from "./sage-utils/utils/MapUtils";

captureProcessExit();
RenderableMap.startServer(getPort("Map"));
activate();

// node --experimental-modules --es-module-specifier-resolution=node mono.mjs
