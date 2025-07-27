/**
 * Returns the file extension of the file the url points to.
 * If the url doesn't end with a file name, undefined is returned.
 */
export function urlToFileExt(url: string): string | undefined;

/**
 * Returns the file extension of the file the url points to.
 * If the url doesn't end with a file name, the defaultExt is returned.
 */
export function urlToFileExt(url: string, defaultExt: string): string;

export function urlToFileExt(url: string, defaultExt?: string): string | undefined {
	const path = url.split("?")[0];
	const fileName = path.split("/").pop();
	if (fileName?.includes(".")) {
		return fileName.split(".").pop() ?? defaultExt;
	}
	return defaultExt;
}