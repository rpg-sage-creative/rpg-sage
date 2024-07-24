import { rollDie } from "@rsc-utils/dice-utils";
import { shuffle } from "@rsc-utils/dice-utils";
import type { RenderableContent } from "@rsc-utils/render-utils";
import { BULLET } from "@rsc-utils/string-utils";
import type { SageMessage } from "../../model/SageMessage";
import { addScenario, createPfsRenderableContent, type TPfsFaction, type TTierInfo } from "./pfs";

type TMission = "Flotsam Graveyard" | "Petals District" | "Precipice Quarter" | "Westgate";
type TFactionLeader = {
	name: string;

	faction: TPfsFaction;
	envoysAlliance?: boolean;
	grandArchive?: boolean;
	horizonHunters?: boolean;
	vigilantSeal?: boolean;

	missions: TMission[];
	mission: string;

	attendee: string;

	additionalAidOptions: string[];
	additionalAid: string;
};
const AllAttendees = ["Aaqir al-Hakam", "Ambrus Valsin", "Gloriana Morilla", "Kreighton Shane", "Sorrina Westyr", "Tamrin Credence", "Urwal", "Valais Durant", "Zarta Dralneen"];
function s0101(tierInfo: TTierInfo): Map<string, TFactionLeader> {
	let randomAttendees = shuffle(AllAttendees).slice(0, 4);
	let factionLeaders = <TFactionLeader[]>[
		{ name: "Calisro Benarry", faction: "Horizon Hunters", horizonHunters: true, missions: ["Flotsam Graveyard", "Precipice Quarter", "Westgate"], mission: "", attendee: "", additionalAidOptions: ["minor healing potion", "lesser healing potion"], additionalAid: "" },
		{ name: "Eando Kline", faction: "Vigilant Seal", vigilantSeal: true, missions: ["Flotsam Graveyard", "Petals District", "Westgate"], mission: "", attendee: "", additionalAidOptions: ["", ""], additionalAid: "" },
		{ name: "Fola Barun", faction: "Envoys' Alliance", envoysAlliance: true, missions: ["Petals District", "Precipice Quarter", "Westgate"], mission: "", attendee: "", additionalAidOptions: ["lesser silvertongue mutagen", "moderate silvertongue mutagen"], additionalAid: "" },
		{ name: "Gorm Greathammer", faction: "Grand Archive", grandArchive: true, missions: ["Flotsam Graveyard", "Petals District", "Precipice Quarter"], mission: "", attendee: "", additionalAidOptions: ["disrupting weapons, heal, or magic missile", "false life, sound burst, or web"], additionalAid: "" }
	];
	let factionLeadersByMission = new Map<TMission, TFactionLeader>();
	for (let i = factionLeaders.length; i--;) {
		let mission: TMission;
		do {
			let result = rollDie(3);
			mission = factionLeaders[i].missions[result - 1];
		} while (factionLeadersByMission.has(mission));
		factionLeaders[i].mission = mission;
		factionLeadersByMission.set(mission, factionLeaders[i]);
		factionLeaders[i].attendee = randomAttendees[i];
		factionLeaders[i].additionalAid = factionLeaders[i].additionalAidOptions[tierInfo.lowTier ? 0 : 1] ?? null;
	}
	return factionLeadersByMission;
}
const FleshforgeTemperament = ["",
	`<b>Temperament</b> Hoarding <b>Behavior</b> The creature has stashed a small hoard of shiny objects scavenged from the ship in the remnants of its crate. It breaks o its attack and retreats to its hoard if the PCs oer it something suitably shiny (such as a few coins, a weapon, or a similar item).`,
	`<b>Temperament</b> Loneliness <b>Behavior</b> A crude replica of the creature has been assembled next to the remnants of its crate. A PC who succeeds at a Diplomacy check to Make an Impression on the creature can relate peaceful intentions; the creature then quietly tags along with the party for the rest of their time on the ship.`,
	`<b>Temperament</b> Curiosity <b>Behavior</b> The walls of the cargo hold have been inartistically scratched to resemble views of the Absalom skyline. A PC who succeeds at a Society or Absalom Lore check can relate enough information about the city to satiate the creature’s interests.`,
	`<b>Temperament</b> Hunger <b>Behavior</b> Gnawed bones of sea birds lie in a heap in one corner. PCs can distract the creature by offering it a day’s worth of food in any form (such as trail rations, the bodies of other creatures, or fish caught from the deck).`,
	`<b>Temperament</b> Boredom <b>Behavior</b> The ship has obviously been searched repeatedly, and all similar items are stacked neatly where they were found. The creature can be entertained with a successful check to Perform, by any PC giving it any written texts, or through the use of any visual illusions to create an interesting scene.`,
	`<b>Temperament</b> Rage <b>Behavior</b> The furniture and crates in the cargo hold have all been smashed. The creature cannot be pacified through nonviolent means.`
];
const FleshForgeAbilitiesLowTier = ["",
	`<b>Breath Weapon</b> [A][A] (arcane, evocation, fire) The fleshforge dreg breathes flames that deal 4d6 fire damage to all creatures in a 15-foot cone (DC 15 basic Re!ex save). The fleshforge dreg can’t use its breath weapon again for 1d4 rounds.`,
	`<b>Ranged</b> acid spit [A] +11 (range 30 feet), <b>Damage</b> 3d6 acid`,
	`The fleshforge dreg’s tentacle Strikes gain reach 10 feet and Grab.`,
	`The fleshforge dreg’s large arm can be used as a shield (Hardness 3, HP 20, BT 10) and it gains the Shield Block reaction. The prototype’s AC is 21 with its shield raised. If the shield is destroyed, it can no longer use its fist attack.`,
	`<b>Roots</b> [A] The fleshforge dreg roots into the surface it is standing on. It gains fast healing 5 until it leaves that space.`,
	`<b>Leaping Charge</b> [A] The fleshforge prototype Strides up to 10 feet, ignoring difficult terrain as it leaps over obstacles. It then makes a fist Strike, gaining a +1 circumstance bonus to its attack roll.`
];
const FleshForgeAbilitiesHighTier = ["",
	`<b>Breath Weapon</b> [A][A] (arcane, evocation, fire) The fleshforge prototype breathes flames that deal 6d6 fire damage to all creatures in a 15-foot cone (DC 22 basic Reflex save). The fleshforge prototype can’t use its breath weapon again for 1d4 rounds.`,
	`<b>Ranged</b> acid spit [A] +13 (range 30 feet), <b>Damage</b> 4d6 acid`,
	`The fleshforge prototype's tentacle Strikes gain reach 10 feet and Grab.`,
	`The fleshforge prototype’s large arm can be used as a shield (Hardness 5, HP 20, BT 10) and it gains the Shield Block reaction. The prototype’s AC is 24 with its shield raised. If the shield is destroyed, it can no longer use its fist attack.`,
	`<b>Roots</b> [A] The fleshforge prototype roots into the surface it is standing on. It gains fast healing 5 until it leaves that space.`,
	`<b>Leaping Charge</b> [A] The fleshforge prototype Strides up to 10 feet, ignoring difficult terrain as it leaps over obstacles. It then makes a fist Strike, gaining a +1 circumstance bonus to its attack roll.`
];
function s0101A(sageMessage: SageMessage, tierInfo: TTierInfo, faction: TPfsFaction): RenderableContent {
	let renderableContent = createPfsRenderableContent(sageMessage);
	renderableContent.appendTitledSection(`<b>A: Flotsam Graveyard - Surfaced Wreck (${faction})</b>`, `<b>A2 - Cargo Hold</b>`);
	renderableContent.append(`<b>Fleshforge ${tierInfo.lowTier ? "Dreg" : "Prototype"}</b>`, `<blockquote>${FleshforgeTemperament[rollDie(6)]}</blockquote>`);
	let fleshforgeRolls = [rollDie(6)];
	if (tierInfo.pcCount > 4) {
		let result: number;
		while (fleshforgeRolls.includes(result = rollDie(6))) { }
		fleshforgeRolls.push(result);
	}
	let additionalAbilites = fleshforgeRolls.map(fleshforgeRoll =>
		`<b>${BULLET}</b> ${tierInfo.lowTier ? FleshForgeAbilitiesLowTier[fleshforgeRoll] : FleshForgeAbilitiesHighTier[fleshforgeRoll]}`
	).join("\n");
	renderableContent.append(`<blockquote><i>Additional Abilities</i>\n${additionalAbilites}</blockquote>`);
	if (faction === "Vigilant Seal") {
		renderableContent.append(`> <b>Vigilant Seal</b> Don't need to fight fleshforge to succeed.`);
	}
	if (faction === "Grand Archive") {
		renderableContent.append(`> <b>Grand Archive</b> Books in false bottoms.`);
	}
	if (faction === "Grand Archive" || faction === "Horizon Hunters") {
		renderableContent.append(`<b>A4 - Map Room</b>`);
		if (faction === "Grand Archive") {
			renderableContent.append(`> <b>Grand Archive</b> Find documents.`);
		}
		if (faction === "Horizon Hunters") {
			renderableContent.append(`> <b>Horizon Hunters</b> Use Coat of Arms and Lantern to identify ship.`);
		}
	}
	return renderableContent;
}
function s0101B(sageMessage: SageMessage, tierInfo: TTierInfo, faction: TPfsFaction): RenderableContent {
	let renderableContent = createPfsRenderableContent(sageMessage);
	renderableContent.appendTitledSection(`<b>B: Petals District - Blakros Museum (${faction})</b>`, `<b>B5 - Third Floor</b>`);
	renderableContent.append(`<b>${tierInfo.lowTier ? "" : "Deeply "}Flawed Ritual (${tierInfo.lowTier ? "" : "Greater "}Shadow Wisp)</b>`);
	let flawRoll = rollDie(4),
		totalFlaws = 7 + (tierInfo.pcCount > 4 ? tierInfo.pcCount - 4 : 0);
	renderableContent.append(`> <b>Ritual Flaws</b> ${totalFlaws} (3 initially contained); <b>DCs</b> Occultism ${tierInfo.lowTier ? 22 : 24}, Flaw Skill ${tierInfo.lowTier ? 18 : 20}`);
	switch (flawRoll) {
		case 1: renderableContent.append(`> <b>Harried</b> a “publish or perish” culture at the College of Mystery led to Tavvar cutting corners in the ritual’s execution, so some runes aren’t drawn quite right (Arcana or Thievery)`); break;
		case 2: renderableContent.append(`> <b>Misplaced Affection</b> Tavvar is from Nidal and subconsciously hopes the ritual will show that there is some good in her homeland; she included some Shadowtongue in the runes and it’s enhancing the energy (Society or Religion)`); break;
		case 3: renderableContent.append(`> <b>Cloistered</b> Tavvar hasn’t done much field work and made a dangerous mistake in which mushrooms she used in the ink for the runes (Crafting or Nature)`); break;
		case 4: renderableContent.append(`> <b>Restrained</b> Tavvar’s own hesitation and self-doubt has led to the ritual slipping out of her control (Deception or Diplomacy)`); break;
	}
	if (faction === "Envoys' Alliance" || faction === "Grand Archive" || faction === "Vigilant Seal") {
		if (faction === "Envoys' Alliance") {
			renderableContent.append(`> <b>Envoys' Alliance</b> Attempt to recruit Tavvar.`);
		}
		if (faction === "Grand Archive") {
			renderableContent.append(`> <b>Grand Archive</b> Get copy of text.`);
		}
		if (faction === "Vigilant Seal") {
			renderableContent.append(`> <b>Vigilant Seal</b> Can let ritual fail or convince Tavvar to hide research.`);
		}
	}
	return renderableContent;
}
function s0101C(sageMessage: SageMessage, tierInfo: TTierInfo, faction: TPfsFaction): RenderableContent {
	let renderableContent = createPfsRenderableContent(sageMessage);
	renderableContent.appendTitledSection(`<b>C: Precipice Quarter - Mavedarus Manor (${faction})</b>`, `<b>Haunted Past</b>`);
	let hauntRoll = rollDie(6);
	switch (hauntRoll) {
		case 1:
			renderableContent.append(`> <b>Owner Practices</b> Archdevil worshippers sacrificing innocents`);
			renderableContent.append(`> <b>Nature of the Haunt</b> Scent of brimstone and sound of chanting in Infernal (a PC who understands Infernal or succeeds at a DC 10 Religion, Hell Lore, or Mephistopheles Lore check recognizes the chanting as a prayer to Mephistopheles).`);
			break;
		case 2:
			renderableContent.append(`> <b>Owner Practices</b> Soulbound dollmakers`);
			renderableContent.append(`> <b>Nature of the Haunt</b> Flesh flaking off the rotting hands reveals smooth porcelain underneath (a PC who succeeds at a DC 10 Crafting or Occultism check recognizes the craftsmanship as that of soulbound dolls)`);
			break;
		case 3:
			renderableContent.append(`> <b>Owner Practices</b> Alchemical experimenters trying to create an elixir of youth`);
			renderableContent.append(`> <b>Nature of the Haunt</b> A chemical scent overpowers the rot, and precise surgical cuts can be seen on the arms (a PC who succeeds at a DC 10 Crafting or Medicine check realizes both are medical but unnecessary).`);
			break;
		case 4:
			renderableContent.append(`> <b>Owner Practices</b> Slavers storing their “merchandise”`);
			renderableContent.append(`> <b>Nature of the Haunt</b> The hands still wear heavy manacles around the wrists.`);
			break;
		case 5:
			renderableContent.append(`> <b>Owner Practices</b> Crime lords disposing of bodies`);
			renderableContent.append(`> <b>Nature of the Haunt</b> The hands are tattooed and some are cleanly missing fingers (a PC who succeeds at a DC 10 Society or Underworld Lore check recognizes these as marks of gangs active before the earthquake).`);
			break;
		case 6:
			renderableContent.append(`> <b>Owner Practices</b> Misguided Pharasmins storing the unquiet dead until they can be buried properly`);
			renderableContent.append(`> <b>Nature of the Haunt</b> A scent of incense lingers as the haunt vanishes (a PC who succeeds at a DC 10 Religion or Pharasma Lore check recognizes the scent from Pharasmin funerals).`);
			break;
	}
	renderableContent.append(`<b>C2 - Decrepit Hall</b>\n> ${tierInfo.lowTier ? "Scrabbling Hands" : "Rending Hands"}`);
	switch (hauntRoll) {
		case 1: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Religious text for the archdevil Mephistopheles (entitled Three Lies), over!owing with notations.`); break;
		case 2: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Labeled schematics for a soulbound doll`); break;
		case 3: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Partial recipes that include pieces of sapient creatures as ingredients`); break;
		case 4: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Lists of slaves and transactions`); break;
		case 5: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Locations of criminal enterprises they owned (now long out of date)`); break;
		case 6: renderableContent.append(`<b>C3 - Drawing Room</b>\n> Hidden Writings; Prayer books for quieting the restless dead, along with a list of locations of known undead sightings`); break;
	}
	switch (hauntRoll) {
		case 1: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Desperate praise of Mephistopheles (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
		case 2: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Pleading “don’t make me go in the doll again” (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
		case 3: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Frantic claims of not wanting to live forever anymore (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
		case 4: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Begging to be allowed to be released in multiple languages (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
		case 5: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Promising not to mess with the family again (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
		case 6: renderableContent.append(`<b>C4 - Study</b>\n> Murmurs of the Lost; Sighing desires to be put to rest (${tierInfo.lowTier ? "Whispering Spirits" : "Whispering Souls"})`); break;
	}
	renderableContent.append(`<b>C7 - Parlor</b>\n> ${tierInfo.lowTier ? "Crumbling Floor" : "Collapsing Floor"}`);
	if (faction === "Envoys' Alliance") {
		renderableContent.append(`> <b>Envoys' Alliance</b> Body at the bottom of the pit.`);
	}
	let zombieCount = 2;
	if (tierInfo.pcCount > 4) zombieCount += tierInfo.pcCount - 4;
	if (tierInfo.lowTier) {
		renderableContent.append(`<b>Event: Zombies!</b> Plague Zombie, Zombie Shamblers (${zombieCount})`);
	} else {
		renderableContent.append(`<b>Event: Zombies!</b> Plague Zombies (${zombieCount}), Unkillable Zombie Brute`);
	}
	return renderableContent;
}
function s0101D(sageMessage: SageMessage, tierInfo: TTierInfo, faction: TPfsFaction): RenderableContent {
	let renderableContent = createPfsRenderableContent(sageMessage);
	let leaderCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0],
		totalLeaders = 3 + (tierInfo.pcCount > 4 ? tierInfo.pcCount - 4 : 0);
	for (let i = totalLeaders; i--;) {
		leaderCounts[rollDie(8)]++;
	}
	renderableContent.appendTitledSection(`<b>D: Westgate - Statue Street (${faction})</b>`, `<b>Crowd ${tierInfo.lowTier ? "Leaders" : "Agitators"}</b> ${totalLeaders}`);
	leaderCounts.forEach((leaderCount, leaderIndex) => {
		if (leaderCount)
			switch (leaderIndex) {
				case 1: renderableContent.append(`> <b>Barrister (${leaderCount})</b> Diplomacy or Legal Lore`); break;
				case 2: renderableContent.append(`> <b>Drunk (${leaderCount})</b> Deception or Alcohol Lore`); break;
				case 3: renderableContent.append(`> <b>Socialite (${leaderCount})</b> Society or Absalom Lore`); break;
				case 4: renderableContent.append(`> <b>Charlatan (${leaderCount})</b> Thievery or Underworld Lore`); break;
				case 5: renderableContent.append(`> <b>Smith (${leaderCount})</b> Crafting or Guild Lore`); break;
				case 6: renderableContent.append(`> <b>Acolyte (${leaderCount})</b> Religion or Lore corresponding to a specific deity`); break;
				case 7: renderableContent.append(`> <b>Actor (${leaderCount})</b> Performance or Theater Lore`); break;
				case 8: renderableContent.append(`> <b>Herbalist (${leaderCount})</b> Nature or Herbalism Lore`); break;
			}
	});
	if (faction === "Horizon Hunters") {
		renderableContent.append(`> <i>The DC of any check to negotiate with the crowd’s leaders is increased by 5. Enemies and hazards in this encounter gain a +2 status bonus to attack rolls, damage rolls, and saves against fear effects.</i>`)
	}
	if (faction === "Envoys' Alliance") {
		renderableContent.append(`<b>Envoy's Alliance: Rescuing the Pathfinder</b>`);
		if (tierInfo.lowTier) {
			if (tierInfo.pcCount === 7) {
				renderableContent.append(`> Cacodaemons (3; each consumes a soul gem)`);
			} else if (tierInfo.pcCount === 6) {
				renderableContent.append(`> Cacodaemons (3)`);
			} else if (tierInfo.pcCount === 5) {
				renderableContent.append(`> Cacodaemons (2; each consumes a soul gem)`);
			} else {
				renderableContent.append(`> Cacodaemons (2)`);
			}
		} else {
			let cacodaemons = tierInfo.pcCount > 4 ? `Cacodaemons (${tierInfo.pcCount - 4}), ` : ``;
			renderableContent.append(`> ${cacodaemons}Ceustodaemon`);
		}
	}
	if (faction === "Vigilant Seal") {
		renderableContent.append(`<b>Vigilant Seal: Rescuing the Whistleblower</b>`);
		if (tierInfo.lowTier) {
			renderableContent.append(`> Goblin Pyro (1), Goblin Warrior (${tierInfo.pcCount > 4 ? 2 + tierInfo.pcCount - 4 : 2})`);
		} else {
			renderableContent.append(`> Goblin Commando (${tierInfo.pcCount > 4 ? 3 + tierInfo.pcCount - 4 : 3}), Goblin Pyro (1)`);
		}
	}
	return renderableContent;
}

function randomize(sageMessage: SageMessage, tierInfo: TTierInfo): RenderableContent {
	let renderableContent = createPfsRenderableContent(sageMessage);
	renderableContent.setTitle(`<b>PFS2e Scenario 1-01</b>`);
	renderableContent.append(`<b>Tier</b> ${tierInfo.tier}`);
	renderableContent.append(`<b>PCs</b> ${tierInfo.pcCount}; <b>Levels</b> ${tierInfo.pcLevels.join(", ")}`);
	renderableContent.append(`<b>PC Level Points</b> ${tierInfo.pcLevelPoints.join(", ")}; <b>Total Points</b> ${tierInfo.totalPoints}`);
	renderableContent.append(`<b>SubTier</b> ${tierInfo.subtier}; ${tierInfo.subtierText}`);

	let factionLeadersByMission = s0101(tierInfo);
	renderableContent.appendTitledSection(`<b>Party - Faction Leader Encounters</b>`);
	factionLeadersByMission.forEach(factionLeader =>
		renderableContent.append(`<b>${factionLeader.name}</b> (${factionLeader.faction})\n> <b>Other Attendee</b> ${factionLeader.attendee} <b>Mission</b> ${factionLeader.mission}`)
	);

	renderableContent.appendSections(...s0101A(sageMessage, tierInfo, factionLeadersByMission.get("Flotsam Graveyard")!.faction).sections);
	renderableContent.appendSections(...s0101B(sageMessage, tierInfo, factionLeadersByMission.get("Petals District")!.faction).sections);
	renderableContent.appendSections(...s0101C(sageMessage, tierInfo, factionLeadersByMission.get("Precipice Quarter")!.faction).sections);
	renderableContent.appendSections(...s0101D(sageMessage, tierInfo, factionLeadersByMission.get("Westgate")!.faction).sections);

	return renderableContent;
}

export function registerS101(): void {
	addScenario("S1-01", "1-4", randomize);
}
