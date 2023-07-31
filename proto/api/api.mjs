import { createServer } from "http";
import { existsSync, readFileSync, readdirSync } from "fs";

const PATH = `/Users/randaltmeyer/rpg-sage/dist/data/sage`;

function toRegex(uuid, did) {
	return new RegExp(`"${did && uuid ? `(${did}|${uuid})` : did ?? uuid}"`);
}

function fileOrNull(file, regex) {
	try {
		if (existsSync(file)) {
			const raw = readFileSync(file).toString();
			if (regex.test(raw)) {
				return JSON.parse(raw);
			}
		}
	}catch(exParse) {
		console.error(exParse);
	}
	return null;
}

function findFile(path, uuid, did) {
	if (uuid || did) {
		try {
			const regex = toRegex(uuid, did);
			const uuidFile = fileOrNull(`${path}/${uuid}.json`, regex);
			if (uuidFile) return uuidFile;
			const didFile = fileOrNull(`${path}/${did}.json`, regex);
			if (didFile) return didFile;
			const files = readdirSync(path);
			for (const name of files) {
				const file = fileOrNull(`${path}/${name}`, regex);
				if (file) return file;
			}
		}catch(ex) {
			console.error(ex);
		}
	}
	return null;
}

function findFiles(path, uuid, did) {
	if (uuid || did) {
		try {
			const regex = toRegex(uuid, did);
			const files = readdirSync(path);
			return files.map(file => fileOrNull(`${path}/${file}`, regex)).filter(json => json);
		}catch(ex) {
			console.error(ex);
		}
	}
	return [];
}

function readUser(uuid, did) {
	return findFile(`${PATH}/users`, uuid, did);
}

function readGames(uuid, did) {
	return findFiles(`${PATH}/games`, uuid, did);
}

function readMaps(uuid, did) {
	return findFiles(`${PATH}/maps`, uuid, did);
}

function readMessages(uuid, did) {
	return findFiles(`${PATH}/messages`, uuid, did);
}

function readE20Characters(uuid, did) {
	return findFiles(`${PATH}/e20`, uuid, did);
}

function readPb2eCharacters(uuid, did) {
	return findFiles(`${PATH}/pb2e`, uuid, did);
}

function readAll(uuid, did) {
	if (uuid || did) {
		const user = readUser(uuid, did);
		if (!uuid && user?.id) uuid = user.id;
		if (!did && user?.did) did = user.did;
		const games = readGames(uuid, did);
		const maps = readMaps(uuid, did);
		const messages = readMessages(uuid, did);
		const e20Chars = readE20Characters(uuid, did);
		const pb2eChars = readPb2eCharacters(uuid, did);
		return {
			uuid,
			did,
			user,
			games,
			maps,
			messages,
			e20Chars,
			pb2eChars
		};
	}
	return null;
}

function endJson(res, code, json) {
	res.writeHead(code, { 'Content-type':'application/json' });
	res.end(JSON.stringify(json));
}

createServer(async function (req, res) {
	console.log(req.url);
	if (req.method === "POST") {
		const chunks = [];
		req.on("data", chunk => {
			chunks.push(chunk);
		});
		req.once("end", async () => {
			try {
				const post = Buffer.concat(chunks).toString();
				try {
					const json = JSON.parse(post);
					const data = readAll(json.uuid ?? json.id, json.did);
					endJson(res, 200, data);
				}catch(exParse) {
					endJson(res, 500, { error: "Error parsing POST!", post });
				}
			}catch(exConcat) {
				endJson(res, 500, { error: "Error reading POST!", post });
			}
		});
	}else if (req.method === "GET") {
		if (req.url?.includes("api.css")) {
			res.writeHead(200, { 'Content-type':'text/css' });
			res.end(readFileSync(`./api.css`).toString());
		}else if (req.url?.includes("api.js")) {
			res.writeHead(200, { 'Content-type':'text/javascript' });
			res.end(readFileSync(`./api.js`).toString());
		}else if (req.url?.includes("themePicker.js")) {
			res.writeHead(200, { 'Content-type':'text/javascript' });
			res.end(readFileSync(`./themePicker.js`).toString());
		}else {
			res.writeHead(200, { 'Content-type':'text/html' });
			res.end(readFileSync(`./api.html`).toString());
		}
	}else {
		endJson(res, 405, { error: "Method not allowed!", method:req.method });
	}
}).listen(3000);
console.log("Listening on 3000 ...");