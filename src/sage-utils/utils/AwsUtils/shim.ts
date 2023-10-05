
import { debug } from "../ConsoleUtils";
import { errorReturnEmptyArray } from "../ConsoleUtils/Catchers";
import { listFiles } from "../FsUtils";
import type { UUID } from "../types";

/*
// declare var DynamoDbClient: DynamoDBClient;
*/
export type TAwsConfiguration = {
	shimDbPathRoot: string;
};

let _awsConfig: TAwsConfiguration;
export function configure(awsConfig: TAwsConfiguration): void {
	_awsConfig = awsConfig;
}

export async function listObjects(partition: string): Promise<UUID[]> {
	if (_awsConfig?.shimDbPathRoot) {
		return listObjectsShim(partition);
	}
	return [];
}

/*
// export async function getObjects<T>(partition: string): Promise<T[]> {
// 	return [];
// }
// export async function getObject<T>(partition: string, uuid: string): Promise<T | null> {
// 	return null;
// }
*/

export async function listObjectsShim(parition: string): Promise<UUID[]> {
	const files = await listFiles(`${_awsConfig.shimDbPathRoot}/${parition}`)
		.catch(errorReturnEmptyArray);
	const uuids: UUID[] = [];
	files.forEach(file => {
		if (file.endsWith(".json")) {
			uuids.push(file.slice(0, -5));
		}
	});
	debug(files);
	return uuids;
}
