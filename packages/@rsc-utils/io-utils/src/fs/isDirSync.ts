import { statSync } from "node:fs";

export function isDirSync(filePath: string): boolean {
	const stats = statSync(filePath, { throwIfNoEntry:false });
	return stats?.isDirectory() === true;
}