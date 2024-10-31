import { readJsonFiles, writeFileSync } from "@rsc-utils/io-utils";
import { capitalize } from "@rsc-utils/string-utils";

const SRC_PATH = "/Users/randaltmeyer/git/pf2e/packs/equipment";
const DST_PATH = "/Users/randaltmeyer/git/rpg-sage-legacy-data/foundry";

/*
{
    "objectType": "Weapon",
    "type": "Melee",
    "category": "Martial",
    "name": "Rapier",
    "price": "2 gp",
    "damage": "1d6 P",
    "bulk": "1",
    "hands": "1",
    "group": "Sword",
    "traits": [
        "Deadly d8",
        "Disarm",
        "Finesse"
    ],
    "details": [
        "The rapier is a long and thin piercing blade with a basket hilt. It is prized among many as a dueling weapon."
    ],
    "source": "PZO2101",
    "id": "0a0dcbee-a849-4b12-8a5d-b9c748959df6",
    "aonId": 36,
}
*/

//#region price
const prices = new Set();
function doPrice({ value }) {
	const parts = [];
	const coins = ["pp", "gp", "sp", "cp"];
	coins.forEach(key => {
		if (value[key]) parts.push(`${value[key]} ${key}`);
	});
	Object.keys(value).filter(key => !coins.includes(key)).forEach(key => prices.add(key));
	return parts.join(", ");
}
//#endregion

//#region bulk
const bulks = new Set();
function doBulk({ value }) {
	bulks.add(value);
	if (value >= 1) return String(value);
	if (value === 0.1) return "L";
	return "-";
}
//#endregion

//#region hands
const hands = new Set();
function doHands({ value }) {
	if (value === "held-in-one-hand") return "1";
	if (value === "held-in-one-plus-hands") return "1+";
	if (value === "held-in-two-hands") return "2";
	hands.add(value);
	return value;
}
//#endregion

//#region details
function doDetails({ value }) {
	const lines = value.split(/\n/);
	const hr = lines.findIndex(line => /^<hr/.test(line));
	if (hr < 0) return lines;
	return lines.slice(0, hr);
}
//#endregion

//#region traits
const traits = new Set();
function doTraits({ rarity, value }) {
	rarity = capitalize(rarity);
	const others = value?.map(trait => {
		const thrownVolleyScatter = /^(?<type>thrown|volley|scatter)-(?<ft>\d+)$/.exec(trait)?.groups;
		if (thrownVolleyScatter) return `${capitalize(thrownVolleyScatter.type)} ${thrownVolleyScatter.ft} ft.`;

		const versatile = /^versatile-(?<type>[a-z]+)$/.exec(trait)?.groups;
		if (versatile) return `Versatile ${capitalize(versatile.type)}`;

		const fatalDeadlyJousting = /^(?<type>fatal(?:-aim)?|deadly|jousting)-(?<die>d\d+)$/.exec(trait)?.groups;
		if (fatalDeadlyJousting) return `${capitalize(fatalDeadlyJousting.type.replace(/-aim/, "Aim"))} ${fatalDeadlyJousting.die}`;

		const twoHand = /^two-hand-(?<die>d\d+)$/.exec(trait)?.groups;
		if (twoHand) return `Two-hand ${twoHand.die}`;

		const capacity = /^capacity-(?<count>\d+)$/.exec(trait)?.groups;
		if (capacity) return `Capacity ${capacity.count}`;

		if (trait === "free-hand") return "Free-hand";

		if (/\s\-/.test(trait)) traits.add(trait);

		return trait.split("-").map(s => /^(to|or)$/.test(s) ? s : capitalize(s)).join(" ");


		return capitalize(trait);
	}) ?? [];
	return rarity ? [rarity].concat(others) : others;
}
//#endregion

//#region type
function doType({ group }) {
	switch(group) {
		case "axe":
		case "brawling":
		case "club":
		case "flail":
		case "hammer":
		case "knife":
		case "pick":
		case "polearm":
		case "shield":
		case "spear":
		case "sword":
				return "Melee";
		case "bomb":
		case "bow":
		case "crossbow":
		case "dart":
		case "firearm":
		case "sling":
				return "Ranged";
		default:
			groups.add(group);
			return group;
	}
}
//#endregion

//#region source
function doSource({ license, remaster, title }) {

}

const weapons = [];
const groups = new Set();
async function processWeapon({ name, system }) {
	const objectType = "Weapon";
	const type = doType(system); // Melee
	const category = capitalize(system.category); // Martial
	const price = doPrice(system.price);
	const damage = `${system.damage.dice}${system.damage.die} ${capitalize(system.damage.damageType ?? "")?.[0]}`.trim();
	const bulk = doBulk(system.bulk);
	const hands = doHands(system.usage);
	const group = capitalize(system.group); // Sword
	const traits = doTraits(system.traits);
	const details = doDetails(system.description);
	const source = doSource(system.publication); // code that matches Source entry
	const id = ""; // UUID
	const aonId = 0; // id for archives

	const json = { objectType, name, type, category, price, damage, bulk, hands, group, traits, details, source, id, aonId };
	weapons.push(json);
}

async function main() {
	const list = await readJsonFiles(SRC_PATH);
	for (const json of list) {
		switch(json.type) {
			case "weapon": await processWeapon(json); break;
		}
	}
	console.log({prices:[...prices]});
	console.log({bulk:[...bulks]});
	console.log({hands:[...hands]});
	console.log({groups:[...groups]});
	console.log({traits:[...traits]});
	writeFileSync(`${DST_PATH}/sage-weapons.json`, weapons, false, true);
}
main();