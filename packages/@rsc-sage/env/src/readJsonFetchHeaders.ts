import { readJsonFile } from "@rsc-utils/fs-utils";
import { errorReturnUndefined } from "@rsc-utils/logger-utils";
import { join } from "node:path";

let jsonFetchHeaders: Record<string, string> | undefined;

/**
 * Some external tools require custom headers when fetching json.
 * This retrieves and caches those headers on first use.
 */
export async function readJsonFetchHeaders(): Promise<Record<string, string>> {
	if (!jsonFetchHeaders) {
		const configDirPath = "./config";
		const jsonFetchHeadersFilePath = join(configDirPath, "json-fetch-headers.json");
		jsonFetchHeaders = await readJsonFile<Record<string, string>>(jsonFetchHeadersFilePath).catch(errorReturnUndefined) ?? {};
	}
	return jsonFetchHeaders;
}