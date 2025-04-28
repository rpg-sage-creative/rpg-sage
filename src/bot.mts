import { getEndpoint, getPort, initializeConsoleUtilsByEnvironment } from "@rsc-utils/core-utils";
import { activate } from "./sage-lib/index.js";
import { RenderableMap } from "./sage-utils/utils/MapUtils/index.js";

initializeConsoleUtilsByEnvironment();

const services = ["Map"];

/*
	By default, maps are rendered in Sage's primary thread.
	We can run them in separate processes using pm2 and services.config.cjs.
	The --spawnServices flag tells Sage to run those services as child processes of Sage to simplify starting/stopping for testing.
*/
if (process.argv.includes("--spawnServices")) {
	services.forEach(serviceName => {
		RenderableMap.startServer(getPort(serviceName));
	});
}

/*
	Whether we spawn the services or not, we need to set the endpoints
*/
services.forEach(serviceName => {
	RenderableMap.setEndpoint(getEndpoint(serviceName));
});

activate();

// node --experimental-modules --es-module-specifier-resolution=node bot.mjs

