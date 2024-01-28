import { getFromProcess } from "./internal/getFromProcess.js";
import { Server } from "./Server.js";

function isValid(value: string | number | null | undefined): value is string {
	return String(value).includes(".lambda-url.us-west-2.on.aws");
}

function getKey(server: Server): string {
	const prefix = Server[server].toLowerCase();
	return prefix + "AwsEndpointUrl";
}

const _awsEndpointUrls: string[] = [];

export function getAwsEndpointUrl(server: Server): string;
export function getAwsEndpointUrl(server: keyof typeof Server): string;
export function getAwsEndpointUrl(server: Server | keyof typeof Server): string {
	const serverValue = typeof(server) === "number" ? server : Server[server];
	if (!_awsEndpointUrls[serverValue]) {
		const key = getKey(serverValue);
		_awsEndpointUrls[serverValue] = getFromProcess(isValid, key);
	}
	return _awsEndpointUrls[serverValue];
}