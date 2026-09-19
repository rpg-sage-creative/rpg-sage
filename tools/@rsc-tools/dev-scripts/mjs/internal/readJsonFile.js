import { readFile } from "node:fs";
export function readJsonFile(path) {
    return new Promise((resolve, reject) => {
        readFile(path, (err, data) => {
            try {
                err ? reject(err) : resolve(JSON.parse(data.toString("utf8")));
            }
            catch (ex) {
                reject(ex);
            }
        });
    });
}
