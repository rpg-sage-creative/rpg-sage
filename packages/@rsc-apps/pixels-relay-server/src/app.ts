import { captureProcessExit, enableLogLevels, getPort } from "@rsc-utils/core-utils";
import { PixelsRelayServer } from "@rsc-sage/core";

captureProcessExit();
enableLogLevels("development");
PixelsRelayServer.startServer(getPort("Pixels"));

// node --experimental-modules --es-module-specifier-resolution=node relay.mjs
