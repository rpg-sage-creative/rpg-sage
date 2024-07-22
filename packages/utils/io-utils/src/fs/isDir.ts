import { stat, Stats } from "fs";

export function isDir(filePath: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		stat(filePath, (error: NodeJS.ErrnoException | null, stats: Stats) => {
			if (error) {
				reject(error);
			}else {
				resolve(stats.isDirectory());
			}
		});
	});
}