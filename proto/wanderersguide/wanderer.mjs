import utils from "../dist/sage-utils"

const clientId = "3671-29553-6647-54";
const apiKey = "ecc10059-49a7-4b7d-a55c-e241077d0b96";
const urlRoot = `https://wanderersguide.app`;

const generalEndpoints = ["feat", "item", "spell", "class", "archetype", "ancestry", "heritage", "v-heritage", "background", "condition", "trait"];

function createAuthHeader(token) {
	if (token) {
		return { "Authorization": `Bearer ${token}` };
	}
	return { "Authorization": `Apikey ${apiKey}` };
}
function createBearerHeader() {
	return {
		...createAuthHeader(),
		"Content-Type": "application/json",
		"Accept": "application/json",
		"Cache-Control": "no-cache",
		"Host": "wanderersguide.app"
	};
}
function createBearerUrl() {
	return `https://wanderersguide.app/api/oauth2/token?code=${apiKey}&client_id=${clientId}`;

}
function createCharacterUrl(id) {
	return `${urlRoot}/api/char/${id}`;
}
function createGeneralUrl(what, value) {
	if (!generalEndpoints.includes(what)) {
		return null;
	}
	const root = `${urlRoot}/api/${what}`;
	if (typeof(value) === "number") {
		return `${root}?id=${value}`;
	}
	if (typeof(value) === "string" && value !== "all") {
		return `${root}?name=${value}`;
	}
	return `${root}/all`;
}

//#region Fetch Bearer

/*
POST wanderersguide.app/api/oauth2/token?code=xxxxx&client_id=xxxxx
HTTP/1.1
Host: wanderersguide.app
Authorization: Apikey xxxxx
Content-Type: application/json
Accept: application/json
Cache-Control: no-cache
*/
function fetchBearerToken() {
	return new Promise(async (resolve, reject) => {
		try {
			const url = createBearerUrl();
			const auth = createBearerHeader();
			const postData = utils.HttpsUtils.NULL_POST_DATA;
			const raw = await utils.HttpsUtils.getText(url, postData, auth).catch(reject);
			let json;
			try {
				json = JSON.parse(raw);
				if (json) {
					utils.FsUtils.writeFileSync(`./data/wanderersguide/wanderersguide-token.json`, json);
				}
			}catch(_ex) {
				utils.FsUtils.writeFileSync(`./data/wanderersguide/wanderersguide-token.txt`, raw);
			}
			if (json) {
				resolve(json);
			}else {
				reject(JSON.stringify(json));
			}
		} catch (ex) {
			reject(ex);
		}
	});
}
fetchBearerToken().then(console.log, console.error)

//#endregion

//#region General End Points

function fetchGeneral(what, value) {
	return new Promise(async (resolve, reject) => {
		try {
			const url = createGeneralUrl(what, value);
			const auth = createAuthHeader();
			const json = await utils.HttpsUtils.getJson(url, undefined, auth).catch(reject);
utils.FsUtils.writeFileSync(`./data/wanderersguide/wanderersguide-${what}-${value ?? "all"}.json`, json, true, true);
			if (json?.success) {
				resolve(json);
			}else {
				reject(JSON.stringify(json));
			}
		} catch (ex) {
			reject(ex);
		}
	});
}

async function fetchAllGeneral() {
	for (const what of generalEndpoints) {
		await fetchGeneral(what).catch(() => {});
	}
}

//#endregion

function fetchCore(id) {
	return new Promise(async (resolve, reject) => {
		try {
			const url = createCharacterUrl(id);
			const token = await fetchBearerToken();
			const auth = createAuthHeader(token);
			const json = await utils.HttpsUtils.getJson(url, undefined, auth).catch(reject);
utils.FsUtils.writeFileSync(`./data/wanderersguide/wanderersguide-${id}.json`, json);
			if (json?.success) {
				resolve(json.build);
			}else {
				reject(JSON.stringify(json));
			}
		} catch (ex) {
			reject(ex);
		}
	});
}

// node --experimental-modules --es-module-specifier-resolution=node wanderer.mjs

// fetchAllGeneral();
// fetchGeneral("ancestry", 155)
// NOTE: the keys for top level ancestry data fields aren't the same when pulled as a singlet vs all