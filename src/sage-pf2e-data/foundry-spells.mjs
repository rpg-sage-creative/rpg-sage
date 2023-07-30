import { readFileSync, readdirSync, writeFileSync } from "fs";

const sageSources = [];
function readSageSources() {
	if (!sageSources.length) {
		sageSources.push(...JSON.parse(readFileSync("/Users/randaltmeyer/rpg-sage/data/pf2e/src/source-list.json").toString()));
		sageSources.forEach(src => {
			if (src.apNumber) {
				src.fName = `Pathfinder #${src.apNumber}: ${src.name}`;
			}else if (src.productLine === "Adventure Paths") {
				src.fName = `Pathfinder: ${src.name}`;
			}else if (src.productLine === "Pathfinder Adventures") {
				src.fName = `Pathfinder Adventure: ${src.name}`;
			}else {
				src.fName = `Pathfinder ${src.name}`;
			}
		});
	}
	return sageSources;
}

const FoundryPacksDir = "/Users/randaltmeyer/git/pf2e/packs";

const spells = [];
/**
 * @returns {[]}
 */
function readSpells() {
	if (!spells.length) {
		const spellsRootDir = FoundryPacksDir + "/spells";
		const spellsFileList = readdirSync(spellsRootDir);
		const spellsJsonFileList = spellsFileList.filter(fileName => fileName.endsWith(".json"));
		const spellsBufferList = spellsJsonFileList.map(fileName => readFileSync(`${spellsRootDir}/${fileName}`));
		const spellsJsonList = spellsBufferList.map(buffer => JSON.parse(buffer.toString()));
		spells.push(...spellsJsonList);
	}
	return spells;
}

/**
 * @param {[]} items
 * @returns {string[]}
 */
function readKeys(items) {
	const set = new Set();
	items.forEach(item => Object.keys(item).forEach(key => set.add(key)));
	return Array.from(set).sort();
}
function readValues(items, mapper) {
	return Array.from(new Set(items.map(item => mapper(item.system)))).sort();
}

function checkSpellKeys() {
	const spells = readSpells();
	// const rootKeys = readKeys(spells);
	const systemKeys = readKeys(spells.map(spell => spell.system));
	// const areatypeValues = readValues(spells, sp => sp.areatype?.value);
	// const costValues = readValues(spells, sp => sp.cost?.value);
	// const durationValues = readValues(spells, sp => sp.duration?.value);
	// const materialsValues = readValues(spells, sp => sp.materials?.value);
	// const rarityValues = readValues(spells, sp => sp.rarity?.value);
	// const saveValues = readValues(spells, sp => JSON.stringify(sp.save));
	const sourceValues = readValues(spells, sp => sp.source?.value);
	const sageSources = readSageSources();
	const newSources = sourceValues.filter(srcName => !sageSources.find(src => src.fName === srcName));
	console.log({
		// rootKeys,
		systemKeys,
		// areatypeValues,
		// costValues,
		// durationValues,
		// materialsValues,
		// rarityValues,
		// saveValues,
		// sourceValues,
		newSources
	});
}

function isFoundryValue(prop, type, optional, expected) {
	if (optional) {
		if (prop === undefined || prop === null) return true;
		if (prop.value === null || prop.value === "") return true;
	}
	if (prop === undefined || prop === null) return false;
	const keys = Object.keys(prop);
	if (keys.length !== 1 || !keys.includes("value")) return false;
	if (Array.isArray(expected)) return expected.includes(prop.value);
	if (expected) return prop.value === expected;
	return typeof(prop.value) === type;
}
function assertFoundryValue(spell, key, type, optional, expected) {
	const value = spell.system[key];
	const json = value === null || value === undefined ? value : JSON.stringify(value);
	console.assert(isFoundryValue(value, type, optional, expected), `("${spell.name}").${key} = ${json}`);
}

function assertFoundryValueSpellArea(spellRoot) {
	const area = spellRoot.system?.area;
	if (area !== null && area !== undefined) {
		if ("details" in area) {
			console.assert(typeof(area.details) === "string", `("${spellRoot.name}").area.details = ${JSON.stringify(area.details)}`);
		}
		console.assert(["burst","cone","cube","emanation","line","square"].includes(area.type), `("${spellRoot.name}").area.type = ${JSON.stringify(area.type)}`);
		console.assert(typeof(area.value) === "number", `("${spellRoot.name}").area.value = ${JSON.stringify(area.value)}`);
	}
}
function assertFoundryValueSpellSave(spellRoot) {
	const save = spellRoot.system?.save;
	if (save !== null && save !== undefined) {
		console.assert(["","basic"].includes(save.basic), `("${spellRoot.name}").save.basic = ${JSON.stringify(save.basic)}`);
		console.assert(["","fortitude","reflex","will"].includes(save.value), `("${spellRoot.name}").save.value = ${JSON.stringify(save.value)}`);
	}
}

function stringOr(value, or) {
	return value ? value : or;
}

function validateSpells() {
	const spells = readSpells();
	const sageSpells = spells.map(spellRoot => {
		const name = spellRoot.name;
		const spell = spellRoot.system;
		assertFoundryValue(spellRoot, "ability", "string", true);
		assertFoundryValueSpellArea(spellRoot);
		// areatype
		assertFoundryValue(spellRoot, "category", "string", false, ["focus","ritual","spell"]);
		console.assert((typeof(spell.components.focus) === "boolean" || !("focus" in spell.components)) && typeof(spell.components.material) === "boolean" && typeof(spell.components.somatic) === "boolean" && typeof(spell.components.verbal) === "boolean", `("${name}").components = ${JSON.stringify(spell.components)}`);
		assertFoundryValue(spellRoot, "cost", "string");
		// damage
		// damagetype
		assertFoundryValue(spellRoot, "description", "string");
		assertFoundryValue(spellRoot, "duration", "string");
		assertFoundryValue(spellRoot, "hasCounteractCheck", "boolean", true);
		// heightening
		assertFoundryValue(spellRoot, "level", "number");
		assertFoundryValue(spellRoot, "materials", "string");
		// overlays
		assertFoundryValue(spellRoot, "prepared", "boolean", true);
		assertFoundryValue(spellRoot, "primarycheck", "string", true);
		assertFoundryValue(spellRoot, "range", "string");
		// rarity
		// rules
		assertFoundryValueSpellSave(spellRoot);
		// secondarycasters
		// secondarycheck
		// source
		// spellCategorie
		// spellType
		// sustained
		// target
		// time
		// traditions
		// traits
		// usage

		return {
			id: spellRoot._id,
			name: spellRoot.name,
			area: stringOr(spell.area?.details, spell.area ? `${spell.area?.value} ft. ${spell.area?.type}` : undefined),
			duration: stringOr(spell.duration?.value),
			level: spell.level.value,
			range: stringOr(spell.range?.value),
		};
	});
	sageSpells.forEach(spell => {
		Object.keys(spell).forEach(key => {
			if (spell[key] === undefined || spell[key] === null) {
				delete spell[key];
			}
		});
	});
	writeFileSync("./foundry-spells-all.json", JSON.stringify(sageSpells, (_,value)=>value, "\t"));
	// const summary = {
	// 	count: spells.length,
	// 	missingCategory: spells.filter(spell => !("category" in spell.system)).length,
	// }
	// console.log(summary);
}

checkSpellKeys();
validateSpells();