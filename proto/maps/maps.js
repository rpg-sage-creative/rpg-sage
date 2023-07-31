//#region Map Save/Load

let map = null;
const maps = [];
let mapIndex = 0;

function saveMaps() {
	// remove old
	let oldLength = +localStorage.getItem("maps.length") || 0;
	while (oldLength--) localStorage.removeItem(`maps.${oldLength}`);
	localStorage.removeItem("maps.length");
	localStorage.removeItem("maps.index");

	// set current
	localStorage.setItem("maps.length", maps.length);
	maps.forEach((map, index) => localStorage.setItem(`maps.${index}`, JSON.stringify(map)));
	localStorage.setItem("maps.index", mapIndex);
}

function loadMaps() {
	maps.length = 0;
	const length = +localStorage.getItem("maps.length") || 0;
	for (let index = 0; index < length; index++) {
		maps.push(JSON.parse(localStorage.getItem(`maps.${index}`)));
	}
	mapIndex = +localStorage.getItem("maps.index") || 0;
	loadMap(mapIndex);
}

function saveMap(_mapIndex = mapIndex, _map = map) {
	console.log(`saveMap(${_mapIndex}, ${_map})`)
	localStorage.setItem(`maps.${_mapIndex}`, JSON.stringify(_map));
	localStorage.setItem("maps.index", _mapIndex);
	localStorage.setItem("maps.length", maps.length);
}

function loadMap(_mapIndex = mapIndex) {
	mapIndex = _mapIndex;
	localStorage.setItem("maps.index", _mapIndex);
	map = maps[_mapIndex] ?? (maps[_mapIndex] = { name:"", background:{url:""}, grid:[0,0], spawn:[0,0], layers:[] });
	renderMap();
}

function renderMap() {
	renderMeta();
	renderTerrain();
	renderAuras();
	renderTokens();
	renderPayloads();
	renderPreview();
}

$(() => {
	loadMaps();
});

//#endregion

//#region Map Tab

function onMapValueChange() {
	map.name = $("#mapName").val();
	map.background = { url: $("#backroundImageUrl").val() };
	map.grid = [+$("#gridCols").val(), +$("#gridRows").val()];
	map.spawn = [+$("#spawnCol").val(), +$("#spawnRow").val()];

	saveMap();
	renderMap();
}

function renderMeta() {
	$("#mapName").val(map?.name ?? "");
	$("#backroundImageUrl").val(map?.background?.url ?? "");
	$("#gridCols").val(map?.grid?.[0] ?? "");
	$("#gridRows").val(map?.grid?.[1] ?? "");
	$("#spawnCol").val(map?.spawn?.[0] ?? "");
	$("#spawnRow").val(map?.spawn?.[1] ?? "");
}

$(() => {
	$("#map-tab-pane input").on("change", onMapValueChange);
});

//#endregion

//#region Terrain Tab

function terrainAddClick() {
	const terrain = {
		name: $("#terrainName").val(),
		url: $("#terrainImageUrl").val(),
		size: [+$("#terrainSizeCols").val(), +$("#terrainSizeRows").val()],
		gridOffset: [+$("#terrainPositionCol").val(), +$("#terrainPositionRow").val()]
	};

	const layers = map.layers ?? (map.layers = []);
	const layer = layers[0] ?? (layers[0] = { images:[] });
	layer.images.push(terrain);

	saveMap();
	renderMap();
}

function renderTerrain() {
	$("table#tableTerrain").find("tbody").html(
		(map?.layers?.[0]?.images ?? []).map((img, i) => `
			<tr>
				<td>${img.name}
				<td>${img.size[0]}x${img.size[1]}
				<td>${img.gridOffset[0]},${img.gridOffset[1]}
				<td class="text-end">
					<img src="${img.url}" style="height:25px;" onerror="onImgError(event)"/>
					<button type="button" class="btn btn-sm btn-danger p-0 ps-1 pe-1" onclick="onImageRemove(0, ${i});">X</button>
		`).join("")
	);
}

$(() => {
	$("#btnTerrainAdd").on("click", terrainAddClick);
});

//#endregion

//#region Auras Tab

function auraAddClick() {
	const aura = {
		name: $("#auraName").val(),
		anchor: $("#auraAnchor").val(),
		opacity: $("#auraOpacity").val(),
		url: $("#auraImageUrl").val(),
		size: [+$("#auraSizeCols").val(), +$("#auraSizeRows").val()],
		gridOffset: [+$("#auraPositionCol").val(), +$("#auraPositionRow").val()]
	};

	const layers = map.layers ?? (map.layers = []);
	const layer = layers[1] ?? (layers[1] = { images:[] });
	layer.images.push(aura);

	saveMap();
	renderMap();
}

function renderAuras() {
	$("table#tableAuras").find("tbody").html(
		(map?.layers?.[1]?.images ?? []).map((img, i) => `
			<tr>
				<td>${img.name}
				<td>${img.anchor}
				<td>${img.opacity}
				<td>${img.size[0]}x${img.size[1]}
				<td>${img.gridOffset[0]},${img.gridOffset[1]}
				<td class="text-end">
					<img src="${img.url}" style="height:25px;" onerror="onImgError(event)"/>
					<button type="button" class="btn btn-sm btn-danger p-0 ps-1 pe-1" onclick="onImageRemove(1, ${i});">X</button>
		`).join("")
	);
}

$(() => {
	$("#btnAuraAdd").on("click", auraAddClick);
});
//#endregion

//#region Tokens Tab

function tokenAddClick() {
	const token = {
		name: $("#tokenName").val(),
		url: $("#tokenImageUrl").val(),
		size: [+$("#tokenSizeCols").val(), +$("#tokenSizeRows").val()],
		gridOffset: [+$("#tokenPositionCol").val(), +$("#tokenPositionRow").val()],
		user: $("#tokenUser").val()
	};

	const layers = map.layers ?? (map.layers = []);
	const layer = layers[2] ?? (layers[2] = { images:[] });
	layer.images.push(token);

	saveMap();
	renderMap();
}

function shortenUrl(url) {
	if (!url) return url;
	const parts = url.split("/");
	return `${parts[0]}//${parts[2]}/.../${parts.pop()}`;
}

function renderTokens() {
	$("table#tableTokens").find("tbody").html(
		(map?.layers?.[2]?.images ?? []).map((img, i) => `
			<tr>
				<td>${img.name}
				<td>${img.size[0]}x${img.size[1]}
				<td>${img.gridOffset[0]},${img.gridOffset[1]}
				<td>${img.user}
				<td class="text-end">
					<img src="${img.url}" style="height:25px;" onerror="onImgError(event)"/>
					<button type="button" class="btn btn-sm btn-danger p-0 ps-1 pe-1" onclick="onImageRemove(2, ${i});">X</button>
		`).join("")
	);
}

$(() => {
	$("#btnTokenAdd").on("click", tokenAddClick);
});
//#endregion

//#region Payload Tab

//#region payload/parsing

/** Facilitate parsing a json payload. */
function jsonToText(json) {
	try {
		const lines = [];

		lines.push(`[map]`);
		lines.push(json.background?.url ?? "");
		lines.push(`name=${json.name ?? ""}`);
		lines.push(`grid=${json.grid[0]}x${json.grid[1]}`);
		lines.push(`spawn=${json.spawn[0]},${json.spawn[1]}`);

		const terrainImages = json.layers?.[0]?.images ?? [];
		terrainImages.forEach(terrain => {
			lines.push(``);
			lines.push(`[terrain]`);
			lines.push(terrain.url ?? "");
			lines.push(`name=${terrain.name ?? ""}`);
			lines.push(`size=${terrain.size[0]}x${terrain.size[1]}`);
			lines.push(`position=${terrain.gridOffset[0]},${terrain.gridOffset[1]}`);
		});

		const auraImages = json.layers?.[1]?.images ?? [];
		auraImages.forEach(aura => {
			lines.push(``);
			lines.push(`[aura]`);
			lines.push(aura.url ?? "");
			lines.push(`name=${aura.name ?? ""}`);
			lines.push(`anchor=${aura.anchor ?? ""}`);
			lines.push(`opacity=${aura.opacity ?? ""}`);
			lines.push(`size=${aura.size[0]}x${aura.size[1]}`);
			lines.push(`position=${aura.gridOffset[0]},${aura.gridOffset[1]}`);
		});

		const tokenImages = json.layers?.[2]?.images ?? [];
		tokenImages.forEach(token => {
			lines.push(``);
			lines.push(`[token]`);
			lines.push(token.url ?? "");
			lines.push(`name=${token.name ?? ""}`);
			lines.push(`size=${token.size[0]}x${token.size[1]}`);
			lines.push(`position=${token.gridOffset[0]},${token.gridOffset[1]}`);
			lines.push(`user=${token.user ?? ""}`);
		});

		return lines.join("\n");
	}catch(ex) {
		console.error(ex);
		return `[error]\nmessage=${ex.message}`;
	}
}

/** Facilitate parsing a text payload. */
function textToJson(text) {

}

//#endregion

function renderPayloads() {
	const json = map;
	$("#jsonPayload").val(JSON.stringify(json));
	const text = jsonToText(json);
	$("#txtPayload").val(text);
}

//#endregion

//#region Preview

function showPreviewAlert(which) {
	const parent = $("#imgPreview").parent().addClass("d-none").closest(".col");
	parent.find(".alert").addClass("d-none");
	parent.find(`.${which}`).removeClass("d-none");
}

function showPreview() {
	$("#imgPreview").parent().removeClass("d-none").closest(".col").find(".alert").addClass("d-none");
}

let canvasWidth, canvasHeight = 0;
let pxPerCol, pxPerRow = 0;
function reset(w = 0, h = 0) {
	const canvas = document.getElementById("canvasPreview");
	canvasWidth = canvas.width = w;
	canvasHeight = canvas.height = h;
	pxPerCol = Math.floor(canvasWidth / map.grid[0]);
	pxPerRow = Math.floor(canvasHeight / map.grid[1]);
}
function draw(meta, dCol = 0, dRow = 0, opacity) {
	if (!meta?.url) return Promise.reject("Invalid Url.");
	return new Promise((res, rej) => {
		const image = $("<img/>")[0];
		image.onload = ev => {
			const x = 0, y = 0, imgWidth = image.width, imgHeight = image.height;
			if (!canvasWidth || !canvasHeight) {
				reset(imgWidth, imgHeight);
			}

			const col = ((meta.gridOffset?.[0] ?? 1) - 1);
			const pX = (col + dCol) * pxPerCol;
			const row = ((meta.gridOffset?.[1] ?? 1) - 1);
			const pY = (row + dRow) * pxPerRow;
			const pxWidth = ((meta.size?.[0] ?? 0) * pxPerCol) || canvasWidth;
			const pxHeight = ((meta.size?.[1] ?? 0) * pxPerRow) || canvasHeight;

			const canvas = document.getElementById("canvasPreview");
			const ctx = canvas.getContext("2d");
			ctx.globalAlpha = opacity ?? 1;
			ctx.drawImage(image, x, y, imgWidth, imgHeight, pX, pY, pxWidth, pxHeight);
			res();
		};
		image.onerror = (...args) => {
			console.error(...args);
			rej();
		};
		image.src = meta.url;
	});
}

async function renderPreview() {
	reset();
	await draw({ url:map?.background?.url });
	for (const layer of map.layers) {
		for (const image of layer.images) {
			let dCol = 0;
			let dRow = 0;
			if (image.anchor) {
				const anchor = map.layers[0]?.images?.find(img => img.name === image.anchor)
					?? map.layers[2]?.images?.find(img => img.name === image.anchor);
				if (anchor) {
					[dCol, dRow] = anchor.gridOffset ?? [];
				}
			}
			const opacity = image.opacity ? image.opacity.endsWith("%") ? (+image.opacity.match(/\d+/)[0] / 100) : +image.opacity : undefined;
			await draw(image, dCol, dRow, opacity);
		}
	}
}

//#endregion

function onImgError(ev) {
	$(ev.target).replaceWith(`<div class="alert alert-danger m-0 p-0 ps-1 pe-1 text-center">!</div>`);
}

function onImageRemove(layerIndex, imageIndex) {
	const layer = map.layers[layerIndex];
	const [image] = layer.images.splice(imageIndex, 1);
	if (image && layerIndex === 2) {
		const auraLayer = map.layers[1];
		auraLayer.images = (auraLayer.images ?? []).filter(img => img.anchor !== image.name);
	}
	saveMap();
	renderMap();
}

function onDownloadClick() {
	const el = document.createElement("a");
	const cleanMapName = (map?.name ?? "Untitled Map").replace(/[^a-zA-Z0-9]+/g, "");
	const fileName = cleanMapName + ".map.txt";
	const content = jsonToText(map);
	const blob = new Blob([content], { type:"plain/text" });
	const fileUrl = URL.createObjectURL(blob);
	el.setAttribute("href", fileUrl);
	el.setAttribute("download", fileName);
	el.style.display = "none";
	el.click();
	document.body.removeChild(el);
}