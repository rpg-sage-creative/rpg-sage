import { captureProcessExit, enableLogLevels, getPort } from "@rsc-utils/core-utils";
import { PixelsRelayServer } from "./sage-utils/PixelsRelayServer.js";

captureProcessExit();
enableLogLevels("development");
PixelsRelayServer.startServer(getPort("Pixels"));

// node --experimental-modules --es-module-specifier-resolution=node relay.mjs
