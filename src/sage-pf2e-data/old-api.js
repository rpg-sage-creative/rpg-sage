const fs = require("fs");
const http = require("http");

//#region Utils
var utils;
(function (utils) {
	//#region UuidUtils
    let UuidUtils;
    (function (UuidUtils) {
        UuidUtils.NIL = "00000000-0000-0000-0000-000000000000";
        function isNil(uuid) {
            return uuid === UuidUtils.NIL;
        }
        UuidUtils.isNil = isNil;
        const CHARS = '0123456789abcdef'.split('');
        function generate() {
            const uuid = [];
            let i, r, c;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    c = (i === 19) ? (r & 0x3) | 0x8 : r;
                    uuid[i] = CHARS[c];
                }
            }
            return uuid.join('');
        }
        UuidUtils.generate = generate;
        const uuidRegex = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
        function isNotValid(uuid) {
            return typeof uuid !== "string" || !uuidRegex.test(uuid);
        }
        UuidUtils.isNotValid = isNotValid;
        function isValid(uuid) {
            return typeof uuid === "string" && uuidRegex.test(uuid);
        }
        UuidUtils.isValid = isValid;
        function isNotNormalized(uuid) {
            return uuid !== normalize(uuid);
        }
        UuidUtils.isNotNormalized = isNotNormalized;
        function isNormalized(uuid) {
            return uuid === normalize(uuid);
        }
        UuidUtils.isNormalized = isNormalized;
        function normalize(uuid) {
            return isValid(uuid) ? uuid.toLowerCase() : UuidUtils.NIL;
        }
        UuidUtils.normalize = normalize;
        function equals(a, b) {
            return isValid(a) && isValid(b) && a.toLowerCase() === b.toLowerCase();
        }
        UuidUtils.equals = equals;
    })(UuidUtils = utils.UuidUtils || (utils.UuidUtils = {}));
	//#endregion
})(utils || (utils = {}));
//#endregion

function isNullOrUndefined(value) { return value === null || value === undefined; }
function isBlankString(value) { return isNullOrUndefined(value) || value.trim() === ""; }
function toArray(value) { return isBlankString(value) ? [] : Array.isArray(value) ? value : String(value).split(","); }
function excludeProps(value, props) { Array.isArray(value) ? excludePropsFromAll(value, props) : excludePropsFromOne(value, props); }
function excludePropsFromAll(data, props) { if (data.length && props.length) data.forEach(json => excludePropsFromOne(json, props)); }
function excludePropsFromOne(json, props) { if (json && props.length) props.forEach(prop => delete json[prop]); }

function setHeaders(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Request-Method", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
	res.setHeader("Access-Control-Max-Age", 2592000);
	res.setHeader("Access-Control-Allow-Headers", "*");
}

//#region logging
function now() { return String(new Date()); }
function log(...args) { console.log(...args); fs.appendFileSync(DATA_PATH.log, `LOG(${now()}): ${args}\n`); }
function debug(...args) { console.debug(...args); fs.appendFileSync(DATA_PATH.log, `DEBUG(${now()}): ${args}\n`); }
function warn(...args) { console.warn(...args); fs.appendFileSync(DATA_PATH.log, `WARN(${now()}): ${args}\n`); }
function error(...args) { console.error(...args); fs.appendFileSync(DATA_PATH.log, `ERROR(${now()}): ${args}\n`); }
//#endregion

//#region cache

let IGNORE_CACHE = false;

const cacheMap = new Map();

function readCache(action) {
	if (IGNORE_CACHE || action.isSimpleRead) return null;
	const uuid = cacheMap.get(action.cacheUrl);
	if (uuid) {
		// log(`Reading cache for "${action.cacheUrl}" from ${uuid}.json`);
		return readJsonFile(`${DATA_PATH.cache}/${uuid}.json`);
	}
	return null;
}

function writeCache(action, data) {
	if (IGNORE_CACHE || action.isSimpleRead || !data) return;
	let uuid = cacheMap.get(action.cacheUrl);
	if (!uuid) {
		uuid = utils.UuidUtils.generate();
		cacheMap.set(action.cacheUrl, uuid);
		// log(`Creating cache for "${action.cacheUrl}" to ${uuid}.json`);
	}else {
		// log(`Updating cache for "${action.cacheUrl}" to ${uuid}.json`);
	}
	fs.writeFileSync(`${DATA_PATH.cache}/${uuid}.json`, JSON.stringify(data || {}));
}

//#endregion

//#region parseAction

/*
expected url
/read|write/objectType|all/uuid|all/
*/

const READ = "read", WRITE = "write", ALL = "all", SOME = "some", JSONP = "jsonp";

function reducePair(map, pair) {
	const key = pair.split("=")[0];
	const value = pair.slice(key.length + 1);
	if (map.has(key)) {
		const existing = map.get(key);
		if (!Array.isArray(existing)) {
			map.set(key, [existing]);
		}
		map.get(key).push(value);
	}else {
		map.set(key, value);
	}
	return map;
}
function toCacheUrl(url) {
	url = url.replace(/ts=\d+/ig, "");
	url = url.replace(/(\?|\&)$/, "");
	return url;
}
function parseAction(req, json) {
	const url = req.url;
	const path = url.split("?")[0];
	const queryString = url.slice(path.length);
	const query = queryString.slice(1).split("&").reduce(reducePair, new Map());

	const action = {
		path: path.toLowerCase(),
		query: query,
		queryString: queryString.toLowerCase(),
		cacheUrl: toCacheUrl(url),
		url: url
	};

	const parts = action.path.split("/").slice(1);

	const readWrite = parts.shift();
	if (readWrite) {
		action.isRead = readWrite === READ;
		action.isWrite = readWrite === WRITE;
		action.action = action.isRead ? READ : action.isWrite ? WRITE : undefined;
	}
	if (!action.action) {
		return action;
	}

	const objectType = parts.shift();
	if (objectType) {
		action.isAllTypes = objectType === ALL;
		action.isSomeTypes = objectType === SOME;
		action.objectType = action.isAllTypes ? ALL : action.isSomeTypes ? SOME : normalizeObjectType(objectType);
	}
	if (!action.objectType) {
		return action;
	}

	const uuidOrJsonp = parts.shift();
	if (uuidOrJsonp === ALL || utils.UuidUtils.isValid(uuidOrJsonp)) {
		action.isAllObjects = uuidOrJsonp === ALL;
		action.uuid = action.isAllObjects ? ALL : !utils.UuidUtils.isNil(uuidOrJsonp) ? uuidOrJsonp : undefined;
	}
	if (!action.uuid) {
		return action;
	}

	const jsonp = parts.shift();
	if (jsonp === JSONP) {
		action.isJsonP = true;
	}

	action.isSimpleRead = action.isRead
		&& ![ALL, SOME].includes(action.objectType)
		&& action.uuid !== ALL
		&& !action.isJsonP;

	return action;
}

//#endregion

//#region data path

const DATA_PATH = {
	local: `../data/dist`,
	remote: `../bot/data/pf2e/dist`,
	cache: `./tmp/cache`,
	log: `./tmp/api.log`
};
function getDataPath(...args) {
	if (!DATA_PATH.active) {
		try {
			if (fs.readdirSync(DATA_PATH.remote).includes("Source")) {
				DATA_PATH.active = DATA_PATH.remote;
			}
		}catch(ex) {
			DATA_PATH.active = DATA_PATH.local;
		}
	}
	return [DATA_PATH.active].concat(args).join("/");
}

//#endregion

//#region Read/Write JSON

function readJsonFile(path, encoding) {
	try {
		const buffer = fs.readFileSync(path, { encoding:encoding || "utf8" });
		if (Buffer.isBuffer(buffer)) {
			return JSON.parse(buffer.toString(encoding));
		}else if (typeof(buffer) === "string") {
			return JSON.parse(buffer);
		}else {
			// warn("readFileSync not returning Buffer nor String");
		}
	}catch(ex) {
		error(ex);
	}
	return null;
}

//#endregion

//#region object types

const OBJECT_TYPES = [];
function getObjectTypes() {
	if (!OBJECT_TYPES.length) {
		OBJECT_TYPES.push(...fs.readdirSync(getDataPath()).filter(s => !s.includes(".")));
	}
	return OBJECT_TYPES;
}

function normalizeObjectType(objectType) {
	return getObjectTypes().find(ot => ot.toLowerCase() === objectType.toLowerCase());
}

//#endregion

//#region read data

function readAll() {
	const data = [];
	getObjectTypes().forEach(objectType => {
		data.push(...readAllOf(objectType));
	});
	return data;
}
function readAllOf(objectType) {
	return fs.readdirSync(getDataPath(objectType))
		.filter(s => s.endsWith(".json"))
		.map(file => readOne(objectType, file.slice(0, -5)));
}
function readOne(objectType, uuid) {
	return readJsonFile(`${getDataPath(objectType)}/${uuid}.json`);
}

//#endregion

function handleGet(req, res) {
	if (req.method !== "GET") return;
	const action = parseAction(req);
	if (action.isRead) {
		try {
			let data = readCache(action);
			if (!data) {
				if (action.isAllTypes) {
					data = readAll();

				}else if (action.isSomeTypes && action.query.has("types")) {
					const byType = toArray(action.query.get("types")).map(normalizeObjectType).filter(t => t).map(readAllOf);
					data = byType.reduce((array, typeArray) => { array.push(...typeArray); return array; }, []);

				}else if (action.isAllObjects) {
					data = readAllOf(action.objectType);

				}else if (action.uuid) {
					data = readOne(action.objectType, action.uuid);
				}

				excludeProps(data, toArray(action.query.get("excludeProps")));

				writeCache(action, data);
			}

			let output = JSON.stringify(data || { error:"Invalid Action!" });
			if (action.isJsonP) {
				output = `api_rpgsage_io(${output})`;
			}else {
				// res.setHeader("Content-Type", "application/json");
			}
			res.writeHead(200);
			res.end(output);
		}catch(ex) {
			error("handleGet", ex);
			res.writeHead(200);
			res.end(JSON.stringify(ex));
		}
		return true;
	}
}
function handlePost(req, res) {
	if (req.method !== "POST") return;
	res.setHeader("Content-Type", "application/json");
	res.writeHead(200);
	res.end(JSON.stringify({ error:"Invalid Action!" }));
	return true;
}
function handleOptions(req, res) {
	if (req.method !== "OPTIONS") return;
	res.writeHead(204);
	res.end();
	return true;
}
const server = http.createServer((req, res) => {
	setHeaders(req, res);
	if (handleGet(req, res)) return;
	if (handlePost(req, res)) return;
	if (handleOptions(req, res)) return;

	res.writeHead(405);
	res.end(`${req.method} is not allowed for the request.`);
});
server.listen();