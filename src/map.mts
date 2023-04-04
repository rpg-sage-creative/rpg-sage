import { createServer } from "http";
import { tMapToBuffer } from "./sage-utils/MapUtils";
import type { TMap } from "./sage-utils/MapUtils";

createServer(async function (req, res) {
	if (req.method === "POST") {
		const chunks: Buffer[] = [];
		req.on("data", (chunk: Buffer) => {
			chunks.push(chunk);
		});
		req.once("end", async () => {
			const mapJSON = JSON.parse(Buffer.concat(chunks).toString()) as TMap;
			const buffer = await tMapToBuffer(mapJSON);
			if (buffer) {
				res.writeHead(200, { 'Content-type':'image/png' });
				res.end(buffer);
			}else {
				res.writeHead(500, { 'Content-type':'application/json' });
				res.end(JSON.stringify({ error: "Error creating map!" }));
			}
		});
	}else {
		res.writeHead(405, { 'Content-type':'application/json' });
		res.write(JSON.stringify({ error: "Method not allowed!" }));
		res.end();
	}
}).listen(3000);
console.log("Started ...");

// node --experimental-modules --es-module-specifier-resolution=node map.mjs
