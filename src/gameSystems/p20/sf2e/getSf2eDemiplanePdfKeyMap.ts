export type PdfKeyMapItem = { sageKey: string; checked?: boolean; };
export type DemiplanePdfKey = string;
export type DemiplanePdfKeyMap = Map<DemiplanePdfKey, PdfKeyMapItem>

export function getSf2eDemiplanePdfKeyMap(): DemiplanePdfKeyMap {
	return new Map([
		// PDF Page 1

		// Character Basics
		["character_name", { sageKey: "name" }],
		["ancestry", { sageKey: "ancestry" }],
		["background", { sageKey: "background" }],
		["class", { sageKey: "class" }],
		["heritage", { sageKey: "heritage" }],
		["size", { sageKey: "size" }],
		["level", { sageKey: "level" }],
		["resistances", { sageKey: "resistances" }],
		["languages", { sageKey: "languages" }],
		["senses_notes", { sageKey: "senses" }],
		["speed", { sageKey: "speed" }],
		["armor_class", { sageKey: "ac" }],

		// Character Health and Hero Points
		["hp_max", { sageKey: "maxHp" }],
		["current_hp", { sageKey: "hp" }],
		["wounded", { sageKey: "wounded" }],
		["temporary_hp", { sageKey: "tempHp" }],
		["hero_point_0", { sageKey: "heroPoint1", checked: true }],
		["hero_point_1", { sageKey: "heroPoint2", checked: true }],
		["hero_point_2", { sageKey: "heroPoint3", checked: true }],

		// Attributes
		["strength", { sageKey: "strMod" }],
		["dexterity", { sageKey: "dexMod" }],
		["constitution", { sageKey: "conMod" }],
		["intelligence", { sageKey: "intMod" }],
		["wisdom", { sageKey: "wisMod" }],
		["charisma", { sageKey: "chaMod" }],

		// Saves
		["will", { sageKey: "willMod" }],
		["will_prof_bonus", { sageKey: "willProfMod" }],
		["will_item_bonus", { sageKey: "willItemMod" }],
		["will_wis_bonus", { sageKey: "willWisMod" }],
		["will_prof_trained", { sageKey: "willTrained", checked: true }],
		["will_prof_expert", { sageKey: "willExpert", checked: true }],
		["will_prof_master", { sageKey: "willMaster", checked: true }],
		["will_prof_legendary", { sageKey: "willLegendary", checked: true }],

		["reflex", { sageKey: "reflexMod" }],
		["ref_dex_bonus", { sageKey: "reflexDexMod" }],
		["ref_prof_bonus", { sageKey: "reflexProfMod" }],
		["ref_item_bonus", { sageKey: "reflexItemMod" }],
		["ref_prof_trained", { sageKey: "reflexTrained", checked: true }],
		["ref_prof_expert", { sageKey: "reflexExpert", checked: true }],
		["ref_prof_master", { sageKey: "reflexMaster", checked: true }],
		["ref_prof_legendary", { sageKey: "reflexLegendary", checked: true }],

		["fortitude", { sageKey: "fortitudeMod" }],
		["fort_con_bonus", { sageKey: "fortitudeConMod" }],
		["fort_prof_bonus", { sageKey: "fortitudeProfMod" }],
		["fort_item_bonus", { sageKey: "fortitudeItemMod" }],
		["fort_prof_trained", { sageKey: "fortitudeTrained", checked: true }],
		["fort_prof_expert", { sageKey: "fortitudeExpert", checked: true }],
		["fort_prof_master", { sageKey: "fortitudeMaster", checked: true }],
		["fort_prof_legendary", { sageKey: "fortitudeLegendary", checked: true }],

		// Armor and Shields
		["shield_bonus", { sageKey: "shieldMod" }],
		["ac_dex_bonus", { sageKey: "acDexMod" }],
		["ac_prof_bonus", { sageKey: "acProfMod" }],
		["ac_item_bonus", { sageKey: "acItemMod" }],
		["shield_hardness", { sageKey: "shieldHardness" }],
		["shield_max_hp", { sageKey: "shieldMaxHp" }],
		["shield_broken_threshold", { sageKey: "shieldBreakThreshold" }],
		["shield_hp", { sageKey: "shieldHp" }],

		// Armor Proficiencies:
		["ac_unarmored_trained", { sageKey: "unarmoredTrained", checked: true }],
		["ac_unarmored_expert", { sageKey: "unarmoredExpert", checked: true }],
		["ac_unarmored_master", { sageKey: "unarmoredMaster", checked: true }],
		["ac_unarmored_legendary", { sageKey: "unarmoredLegendary", checked: true }],

		["ac_light_trained", { sageKey: "lightArmorTrained", checked: true }],
		["ac_light_expert", { sageKey: "lightArmorExpert", checked: true }],
		["ac_light_master", { sageKey: "lightArmorMaster", checked: true }],
		["ac_light_legendary", { sageKey: "lightArmorLegendary", checked: true }],

		["ac_medium_trained", { sageKey: "mediumArmorTrained", checked: true }],
		["ac_medium_expert", { sageKey: "mediumArmorExpert", checked: true }],
		["ac_medium_master", { sageKey: "mediumArmorMaster", checked: true }],
		["ac_medium_legendary", { sageKey: "mediumArmorLegendary", checked: true }],

		["ac_heavy_trained", { sageKey: "heavyArmorTrained", checked: true }],
		["ac_heavy_expert", { sageKey: "heavyArmorExpert", checked: true }],
		["ac_heavy_master", { sageKey: "heavyArmorMaster", checked: true }],
		["ac_heavy_legendary", { sageKey: "heavyArmorLegendary", checked: true }],

		// Skills, Perception, and DCs
		["class_dc", { sageKey: "classDc" }],
		["class_dc_key_bonus", { sageKey: "classDcAbilityMod" }],
		["class_dc_prof_bonus", { sageKey: "classDcProfMod" }],
		["class_dc_item_bonus", { sageKey: "classDcItemMod" }],

		["acrobatics", { sageKey: "acrobaticsMod" }],
		["acrobatics_prof_bonus", { sageKey: "acrobaticsProfMod" }],
		["acrobatics_item_bonus", { sageKey: "acrobaticsItemMod" }],
		["acrobatics_armor_mod", { sageKey: "acrobaticsArmorMod" }],
		["acrobatics_dex_bonus", { sageKey: "acrobaticsDexMod" }],

		["acrobatics_prof_trained", { sageKey: "acrobaticsTrained", checked: true }],
		["acrobatics_prof_expert", { sageKey: "acrobaticsExpert", checked: true }],
		["acrobatics_prof_master", { sageKey: "acrobaticsMaster", checked: true }],
		["acrobatics_prof_legendary", { sageKey: "acrobaticsLegendary", checked: true }],

		["arcana", { sageKey: "arcanaMod" }],
		["arcana_int_bonus", { sageKey: "arcanaIntMod" }],
		["arcana_prof_bonus", { sageKey: "arcanaProfMod" }],
		["arcana_item_bonus", { sageKey: "arcanaItemMod" }],
		["arcana_prof_trained", { sageKey: "arcanaTrained", checked: true }],
		["arcana_prof_expert", { sageKey: "arcanaExpert", checked: true }],
		["arcana_prof_master", { sageKey: "arcanaMaster", checked: true }],
		["arcana_prof_legendary", { sageKey: "arcanaLegendary", checked: true }],

		["athletics", { sageKey: "athleticsMod" }],
		["athletics_str_bonus", { sageKey: "athleticsStrMod" }],
		["athletics_prof_bonus", { sageKey: "athleticsProfMod" }],
		["athletics_item_bonus", { sageKey: "athleticsItemMod" }],
		["athletics_armor_mod", { sageKey: "athleticsArmorMod" }],
		["athletics_prof_trained", { sageKey: "athleticsTrained", checked: true }],
		["athletics_prof_expert", { sageKey: "athleticsExpert", checked: true }],
		["athletics_prof_master", { sageKey: "athleticsMaster", checked: true }],
		["athletics_prof_legendary", { sageKey: "athleticsLegendary", checked: true }],

		["computers", { sageKey: "computersMod" }],
		["computers_int_bonus", { sageKey: "computersIntMod" }],
		["computers_prof_bonus", { sageKey: "computersProfMod" }],
		["computers_item_bonus", { sageKey: "computersItemMod" }],
		["computers_prof_trained", { sageKey: "computersTrained", checked: true }],
		["computers_prof_expert", { sageKey: "computersExpert", checked: true }],
		["computers_prof_master", { sageKey: "computersMaster", checked: true }],
		["computers_prof_legendary", { sageKey: "computersLegendary", checked: true }],

		["crafting", { sageKey: "craftingMod" }],
		["crafting_int_bonus", { sageKey: "craftingIntMod" }],
		["crafting_prof_bonus", { sageKey: "craftingProfMod" }],
		["crafting_item_bonus", { sageKey: "craftingItemMod" }],
		["crafting_prof_trained", { sageKey: "craftingTrained", checked: true }],
		["crafting_prof_expert", { sageKey: "craftingExpert", checked: true }],
		["crafting_prof_master", { sageKey: "craftingMaster", checked: true }],
		["crafting_prof_legendary", { sageKey: "craftingLegendary", checked: true }],

		["deception", { sageKey: "deceptionMod" }],
		["deception_cha_bonus", { sageKey: "deceptionChaMod" }],
		["deception_prof_bonus", { sageKey: "deceptionProfMod" }],
		["deception_item_bonus", { sageKey: "deceptionItemMod" }],
		["deception_prof_trained", { sageKey: "deceptionTrained", checked: true }],
		["deception_prof_expert", { sageKey: "deceptionExpert", checked: true }],
		["deception_prof_master", { sageKey: "deceptionMaster", checked: true }],
		["deception_prof_legendary", { sageKey: "deceptionLegendary", checked: true }],

		["diplomacy", { sageKey: "diplomacyMod" }],
		["diplomacy_cha_bonus", { sageKey: "diplomacyChaMod" }],
		["diplomacy_prof_bonus", { sageKey: "diplomacyProfMod" }],
		["diplomacy_item_bonus", { sageKey: "diplomacyItemMod" }],
		["diplomacy_prof_trained", { sageKey: "diplomacyTrained", checked: true }],
		["diplomacy_prof_expert", { sageKey: "diplomacyExpert", checked: true }],
		["diplomacy_prof_master", { sageKey: "diplomacyMaster", checked: true }],
		["diplomacy_prof_legendary", { sageKey: "diplomacyLegendary", checked: true }],

		["intimidation", { sageKey: "intimidationMod" }],
		["intimidation_cha_bonus", { sageKey: "intimidationChaMod" }],
		["intimidation_prof_bonus", { sageKey: "intimidationProfMod" }],
		["intimidation_item_bonus", { sageKey: "intimidationItemMod" }],
		["intimidation_prof_trained", { sageKey: "intimidationTrained", checked: true }],
		["intimidation_prof_expert", { sageKey: "intimidationExpert", checked: true }],
		["intimidation_prof_master", { sageKey: "intimidationMaster", checked: true }],
		["intimidation_prof_legendary", { sageKey: "intimidationLegendary", checked: true }],

		["lore_skill_1", { sageKey: "lore1Name" }],
		["lore_1", { sageKey: "lore1Mod" }],
		["lore_int_bonus_1", { sageKey: "lore1IntMod" }],
		["lore_prof_bonus_1", { sageKey: "lore1ProfMod" }],
		["lore_item_bonus_1", { sageKey: "lore1ItemMod" }],
		["lore_1_prof_trained", { sageKey: "lore1Trained", checked: true }],
		["lore_1_prof_expert", { sageKey: "lore1Expert", checked: true }],
		["lore_1_prof_master", { sageKey: "lore1Master", checked: true }],
		["lore_1_prof_legendary", { sageKey: "lore1Legendary", checked: true }],

		["lore_skill_2", { sageKey: "lore2Name" }],
		["lore_2", { sageKey: "lore2Mod" }],
		["lore_int_bonus_2", { sageKey: "lore2IntMod" }],
		["lore_prof_bonus_2", { sageKey: "lore2ProfMod" }],
		["lore_item_bonus_2", { sageKey: "lore2ItemMod" }],
		["lore_2_prof_trained", { sageKey: "lore2Trained", checked: true }],
		["lore_2_prof_expert", { sageKey: "lore2Expert", checked: true }],
		["lore_2_prof_master", { sageKey: "lore2Master", checked: true }],
		["lore_2_prof_legendary", { sageKey: "lore2Legendary", checked: true }],

		["medicine", { sageKey: "medicineMod" }],
		["medicine_wis_bonus", { sageKey: "medicineWisMod" }],
		["medicine_prof_bonus", { sageKey: "medicineProfMod" }],
		["medicine_item_bonus", { sageKey: "medicineItemMod" }],
		["medicine_prof_trained", { sageKey: "medicineTrained", checked: true }],
		["medicine_prof_expert", { sageKey: "medicineExpert", checked: true }],
		["medicine_prof_master", { sageKey: "medicineMaster", checked: true }],
		["medicine_prof_legendary", { sageKey: "medicineLegendary", checked: true }],

		["nature", { sageKey: "natureMod" }],
		["nature_wis_bonus", { sageKey: "natureWisMod" }],
		["nature_prof_bonus", { sageKey: "natureProfMod" }],
		["nature_item_bonus", { sageKey: "natureItemMod" }],
		["nature_prof_trained", { sageKey: "natureTrained", checked: true }],
		["nature_prof_expert", { sageKey: "natureExpert", checked: true }],
		["nature_prof_master", { sageKey: "natureMaster", checked: true }],
		["nature_prof_legendary", { sageKey: "natureLegendary", checked: true }],

		["occultism", { sageKey: "occultismMod" }],
		["occultism_int_bonus", { sageKey: "occultismIntMod" }],
		["occultism_prof_bonus", { sageKey: "occultismProfMod" }],
		["occultism_item_bonus", { sageKey: "occultismItemMod" }],
		["occultism_prof_trained", { sageKey: "occultismTrained", checked: true }],
		["occultism_prof_expert", { sageKey: "occultismExpert", checked: true }],
		["occultism_prof_master", { sageKey: "occultismMaster", checked: true }],
		["occultism_prof_legendary", { sageKey: "occultismLegendary", checked: true }],

		["performance", { sageKey: "performanceMod" }],
		["performance_cha_bonus", { sageKey: "performanceChaMod" }],
		["performance_prof_bonus", { sageKey: "performanceProfMod" }],
		["performance_item_bonus", { sageKey: "performanceItemMod" }],
		["performance_prof_trained", { sageKey: "performanceTrained", checked: true }],
		["performance_prof_expert", { sageKey: "performanceExpert", checked: true }],
		["performance_prof_master", { sageKey: "performanceMaster", checked: true }],
		["performance_prof_legendary", { sageKey: "performanceLegendary", checked: true }],

		["piloting", { sageKey: "pilotingMod" }],
		["piloting_dex_bonus", { sageKey: "pilotingDexMod" }],
		["piloting_prof_bonus", { sageKey: "pilotingProfMod" }],
		["piloting_item_bonus", { sageKey: "pilotingItemMod" }],
		["piloting_prof_trained", { sageKey: "pilotingTrained", checked: true }],
		["piloting_prof_expert", { sageKey: "pilotingExpert", checked: true }],
		["piloting_prof_master", { sageKey: "pilotingMaster", checked: true }],
		["piloting_prof_legendary", { sageKey: "pilotingLegendary", checked: true }],

		["religion", { sageKey: "religionMod" }],
		["religion_wis_bonus", { sageKey: "religionWisMod" }],
		["religion_prof_bonus", { sageKey: "religionProfMod" }],
		["religion_item_bonus", { sageKey: "religionItemMod" }],
		["religion_prof_trained", { sageKey: "religionTrained", checked: true }],
		["religion_prof_expert", { sageKey: "religionExpert", checked: true }],
		["religion_prof_master", { sageKey: "religionMaster", checked: true }],
		["religion_prof_legendary", { sageKey: "religionLegendary", checked: true }],

		["society", { sageKey: "societyMod" }],
		["society_int_bonus", { sageKey: "societyIntMod" }],
		["society_prof_bonus", { sageKey: "societyProfMod" }],
		["society_item_bonus", { sageKey: "societyItemMod" }],
		["society_prof_trained", { sageKey: "societyTrained", checked: true }],
		["society_prof_expert", { sageKey: "societyExpert", checked: true }],
		["society_prof_master", { sageKey: "societyMaster", checked: true }],
		["society_prof_legendary", { sageKey: "societyLegendary", checked: true }],

		["stealth", { sageKey: "stealthMod" }],
		["stealth_dex_bonus", { sageKey: "stealthDexMod" }],
		["stealth_prof_bonus", { sageKey: "stealthProfMod" }],
		["stealth_item_bonus", { sageKey: "stealthItemMod" }],
		["stealth_armor_mod", { sageKey: "stealthArmorMod" }],
		["stealth_prof_trained", { sageKey: "stealthTrained", checked: true }],
		["stealth_prof_expert", { sageKey: "stealthExpert", checked: true }],
		["stealth_prof_master", { sageKey: "stealthMaster", checked: true }],
		["stealth_prof_legendary", { sageKey: "stealthLegendary", checked: true }],

		["surival", { sageKey: "survivalMod" }],
		["survival_wis_bonus", { sageKey: "survivalWisMod" }],
		["survival_prof_bonus", { sageKey: "survivalProfMod" }],
		["survival_item_bonus", { sageKey: "survivalItemMod" }],
		["survival_prof_trained", { sageKey: "survivalTrained", checked: true }],
		["survival_prof_expert", { sageKey: "survivalExpert", checked: true }],
		["survival_prof_master", { sageKey: "survivalMaster", checked: true }],
		["survival_prof_legendary", { sageKey: "survivalLegendary", checked: true }],

		["thievery", { sageKey: "thieveryMod" }],
		["thievery_dex_bonus", { sageKey: "thieveryDexMod" }],
		["thievery_prof_bonus", { sageKey: "thieveryProfMod" }],
		["thievery_item_bonus", { sageKey: "thieveryItemMod" }],
		["thievery_armor_mod", { sageKey: "thieveryArmorMod" }],
		["thievery_prof_trained", { sageKey: "thieveryTrained", checked: true }],
		["thievery_prof_expert", { sageKey: "thieveryExpert", checked: true }],
		["thievery_prof_master", { sageKey: "thieveryMaster", checked: true }],
		["thievery_prof_legendary", { sageKey: "thieveryLegendary", checked: true }],

		["perception", { sageKey: "perceptionMod" }],
		["per_wis_bonus", { sageKey: "perceptionWisMod" }],
		["per_proficiency", { sageKey: "perceptionProfMod" }],
		["per_item_bonus", { sageKey: "perceptionItemMod" }],
		["per_prof_trained", { sageKey: "perceptionTrained", checked: true }],
		["per_prof_expert", { sageKey: "perceptionExpert", checked: true }],
		["per_prof_master", { sageKey: "perceptionMaster", checked: true }],
		["per_prof_legendary", { sageKey: "perceptionLegendary", checked: true }],

		// Attacks

		// Melee
		["weapon_1", { sageKey: "melee1Name" }],
		["weapon_str_mod_1", { sageKey: "melee1StrMod" }],
		["weapon_prof_mod_1", { sageKey: "melee1ProfMod" }],
		["weapon_item_bonus_1", { sageKey: "melee1ItemMod" }],
		["weapon_bonus_1", { sageKey: "melee1Mod" }],
		["weapon_traits_notes_1", { sageKey: "melee1Traits" }],
		["weapon_damage_1", { sageKey: "melee1Damage" }],

		["weapon_2", { sageKey: "melee2Name" }],
		["weapon_str_mod_2", { sageKey: "melee2StrMod" }],
		["weapon_prof_mod_2", { sageKey: "melee2ProfMod" }],
		["weapon_item_bonus_2", { sageKey: "melee2ItemMod" }],
		["weapon_bonus_2", { sageKey: "melee2Mod" }],
		["weapon_traits_notes_2", { sageKey: "melee2Traits" }],
		["weapon_damage_2", { sageKey: "melee2Damage" }],

		// Ranged
		["ranged_weapon_1", { sageKey: "ranged1Name" }],
		["ranged_weapon_prof_mod_1", { sageKey: "ranged1ProfMod" }],
		["ranged_weapon_dex_mod_1", { sageKey: "ranged1DexMod" }],
		["ranged_weapon_item_bonus_1", { sageKey: "ranged1ItemMod" }],
		["ranged_weapon_bonus_1", { sageKey: "ranged1Mod" }],
		["ranged_weapon_damage_1", { sageKey: "ranged1Damage" }],
		["ranged_weapon_traits_notes_1", { sageKey: "ranged1Traits" }],

		["ranged_weapon_2", { sageKey: "ranged2Name" }],
		["ranged_weapon_prof_mod_2", { sageKey: "ranged2ProfMod" }],
		["ranged_weapon_dex_mod_2", { sageKey: "ranged2DexMod" }],
		["ranged_weapon_item_bonus_2", { sageKey: "ranged2ItemMod" }],
		["ranged_weapon_bonus_2", { sageKey: "ranged2Mod" }],
		["ranged_weapon_damage_2", { sageKey: "ranged2Damage" }],
		["ranged_weapon_traits_notes_2", { sageKey: "ranged2Traits" }],

		["ranged_weapon_3", { sageKey: "ranged3Name" }],
		["ranged_weapon_dex_mod_3", { sageKey: "ranged3DexMod" }],
		["ranged_weapon_prof_mod_3", { sageKey: "ranged3ProfMod" }],
		["ranged_weapon_item_bonus_3", { sageKey: "ranged3ItemMod" }],
		["ranged_weapon_bonus_3", { sageKey: "ranged3Mod" }],
		["ranged_weapon_damage_3", { sageKey: "ranged3Damage" }],
		["ranged_weapon_traits_notes_3", { sageKey: "ranged3Traits" }],

		// Weapon Proficiencies:
		["weapon_prof_unarmed_trained", { sageKey: "unarmedTrained", checked: true }],
		["weapon_prof_unarmed_expert", { sageKey: "unarmedExpert", checked: true }],
		["weapon_prof_unarmed_master", { sageKey: "unarmedMaster", checked: true }],
		["weapon_prof_unarmed_legendary", { sageKey: "unarmedLegendary", checked: true }],

		["weapon_prof_simple_trained", { sageKey: "simpleTrained", checked: true }],
		["weapon_prof_simple_expert", { sageKey: "simpleExpert", checked: true }],
		["weapon_prof_simple_master", { sageKey: "simpleMaster", checked: true }],
		["weapon_prof_simple_legendary", { sageKey: "simpleLegendary", checked: true }],

		["weapon_prof_martial_trained", { sageKey: "martialTrained", checked: true }],
		["weapon_prof_martial_expert", { sageKey: "martialExpert", checked: true }],
		["weapon_prof_martial_master", { sageKey: "martialMaster", checked: true }],
		["weapon_prof_martial_legendary", { sageKey: "martialLegendary", checked: true }],

		["weapon_prof_advanced_trained", { sageKey: "advancedTrained", checked: true }],
		["weapon_prof_advanced_expert", { sageKey: "advancedExpert", checked: true }],
		["weapon_prof_advanced_master", { sageKey: "advancedMaster", checked: true }],
		["weapon_prof_advanced_legendary", { sageKey: "advancedLegendary", checked: true }],

		// Spellcasting Modifiers:
		["spell_dc_key_att", { sageKey: "spellDcAbilityMod" }],
		["spell_dc_prof", { sageKey: "spellDcProfMod" }],
		["spell_attack_key_att", { sageKey: "spellAttackAbilityMod" }],
		["spell_attack_prof", { sageKey: "spellAttackProfMod" }],
		["spell_dc_total", { sageKey: "spellDcMod" }],
		["spell_attack_total", { sageKey: "spellAttackMod" }],
		["spell_dc_prof_trained", { sageKey: "spellDcTrained", checked: true }],
		["spell_dc_prof_expert", { sageKey: "spellDcExpert", checked: true }],
		["spell_dc_prof_master", { sageKey: "spellDcMaster", checked: true }],
		["spell_dc_prof_legendary", { sageKey: "spellDcLegendary", checked: true }],
		["spell_attack_prof_trained", { sageKey: "spellAtkTrained", checked: true }],
		["spell_attack_prof_expert", { sageKey: "spellAtkExpert", checked: true }],
		["spell_attack_prof_master", { sageKey: "spellAtkMaster", checked: true }],
		["spell_attack_prof_legendary", { sageKey: "spellAtkLegendary", checked: true }],

		// TODO: These mappings need to be configured
		// [352, { sageKey: "classFeatsFeatures" }],
		// [353, { sageKey: "ancestryAbilities" }],
		// [354, { sageKey: "ancestryFeat1" }],
		// [355, { sageKey: "backgroundFeat" }],
		// [356, { sageKey: "skillFeat2" }],
		// [357, { sageKey: "generalFeat3" }],
		// [358, { sageKey: "skillFeat4" }],
		// [359, { sageKey: "skillFeat6" }],
		// [360, { sageKey: "generalFeat6" }],
		// [361, { sageKey: "skillFeat8" }],
		// [362, { sageKey: "ancestryFeat9" }],
		// [364, { sageKey: "generalFeat11" }],
		// [365, { sageKey: "skillFeat12" }],
		// [366, { sageKey: "ancestryFeat13" }],
		// [367, { sageKey: "skillFeat14" }],
		// [368, { sageKey: "skillFeat16" }],
		// [369, { sageKey: "ancestryFeat17" }],
		// [370, { sageKey: "skillFeat18" }],
		// [371, { sageKey: "generalFeat19" }],
		// [373, { sageKey: "classFeat2" }],
		// [374, { sageKey: "classFeature3" }],
		// [375, { sageKey: "classFeat4" }],
		// [376, { sageKey: "classFeature5" }],
		// [377, { sageKey: "classFeat6" }],
		// [378, { sageKey: "classFeature7" }],
		// [379, { sageKey: "classFeat8" }],
		// [380, { sageKey: "classFeature9" }],
		// [381, { sageKey: "classFeat10" }],
		// [382, { sageKey: "classFeature11" }],
		// [383, { sageKey: "classFeat12" }],
		// [384, { sageKey: "classFeature13" }],
		// [385, { sageKey: "classFeat14" }],
		// [386, { sageKey: "classFeature15" }],
		// [387, { sageKey: "classFeat16" }],
		// [388, { sageKey: "classFeature17" }],
		// [389, { sageKey: "classFeat18" }],
		// [390, { sageKey: "classFeature19" }],
		// [391, { sageKey: "classFeat20" }],
		// [392, { sageKey: "generalFeat15" }],
		// [393, { sageKey: "ancestryFeat5" }],
		// [394, { sageKey: "skillFeat10" }],
		// [395, { sageKey: "skillFeat20" }],
		// [396, { sageKey: "attributeBoosts20" }],
		// [397, { sageKey: "attributeBoosts15" }],
		// [398, { sageKey: "attributeBoosts10" }],
		// [399, { sageKey: "attributeBoosts5" }],
		// [400, { sageKey: "heldItem1" }],
		// [401, { sageKey: "heldItem2" }],
		// [402, { sageKey: "heldItem3" }],
		// [403, { sageKey: "heldItem4" }],
		// [404, { sageKey: "heldItem5" }],
		// [405, { sageKey: "heldItem6" }],
		// [406, { sageKey: "heldItem7" }],
		// [407, { sageKey: "heldItem8" }],
		// [408, { sageKey: "heldItem9" }],
		// [409, { sageKey: "heldItem10" }],
		// [410, { sageKey: "heldItem11" }],
		// [411, { sageKey: "heldItem12" }],
		// [412, { sageKey: "consumableItem1" }],
		// [413, { sageKey: "consumableItem2" }],
		// [414, { sageKey: "consumableItem3" }],
		// [415, { sageKey: "consumableItem4" }],
		// [416, { sageKey: "consumableItem5" }],
		// [417, { sageKey: "consumableItem6" }],
		// [418, { sageKey: "consumableItem7" }],
		// [419, { sageKey: "consumableItem8" }],
		// [420, { sageKey: "consumableItem9" }],
		// [421, { sageKey: "consumableItem10" }],
		// [422, { sageKey: "consumableItem11" }],
		// [423, { sageKey: "consumableItem12" }],
		// [424, { sageKey: "consumableItem13" }],
		// [425, { sageKey: "wornItem1" }],
		// [426, { sageKey: "wornItem2" }],
		// [427, { sageKey: "wornItem3" }],
		// [428, { sageKey: "wornItem4" }],
		// [429, { sageKey: "wornItem5" }],
		// [430, { sageKey: "wornItem6" }],
		// [431, { sageKey: "wornItem7" }],
		// [432, { sageKey: "wornItem8" }],
		// [433, { sageKey: "wornItem9" }],
		// [434, { sageKey: "weapon1" }],
		// [435, { sageKey: "weapon2" }],
		// [436, { sageKey: "weapon3" }],
		// [437, { sageKey: "weapon4" }],
		// [438, { sageKey: "weapon5" }],
		// [439, { sageKey: "weapon6" }],
		// [440, { sageKey: "weapon7" }],
		// [441, { sageKey: "weapon8" }],
		// [443, { sageKey: "valuable1" }],
		// [444, { sageKey: "valuable2" }],
		// [445, { sageKey: "valuable3" }],
		// [446, { sageKey: "valuable4" }],
		// [447, { sageKey: "valuable1Price" }],
		// [448, { sageKey: "valuable2Price" }],
		// [449, { sageKey: "valuable3Price" }],
		// [450, { sageKey: "valuable4Price" }],
		// [451, { sageKey: "valuable1Bulk" }],
		// [452, { sageKey: "valuable2Bulk" }],
		// [453, { sageKey: "valuable3Bulk" }],
		// [454, { sageKey: "valuable4Bulk" }],
		// [456, { sageKey: "weapon1Magazine" }],
		// [457, { sageKey: "weapon2Magazine" }],
		// [458, { sageKey: "weapon3Magazine" }],
		// [459, { sageKey: "weapon4Magazine" }],
		// [460, { sageKey: "weapon5Magazine" }],
		// [461, { sageKey: "weapon6Magazine" }],
		// [462, { sageKey: "weapon9" }],
		// [463, { sageKey: "weapon7Magazine" }],
		// [464, { sageKey: "weapon8Magazine" }],
		// [465, { sageKey: "weapon9Magazine" }],
		// [466, { sageKey: "weapon1Bulk" }],
		// [467, { sageKey: "weapon2Bulk" }],
		// [468, { sageKey: "weapon3Bulk" }],
		// [469, { sageKey: "weapon4Bulk" }],
		// [470, { sageKey: "weapon5Bulk" }],
		// [471, { sageKey: "weapon6Bulk" }],
		// [472, { sageKey: "weapon7Bulk" }],
		// [473, { sageKey: "weapon8Bulk" }],
		// [474, { sageKey: "weapon9Bulk" }],
		// [476, { sageKey: "wornItem1Bulk" }],
		// [477, { sageKey: "wornItem1Invested", checked: true }],
		// [478, { sageKey: "wornItem2Invested", checked: true }],
		// [479, { sageKey: "wornItem3Invested", checked: true }],
		// [480, { sageKey: "wornItem4Invested", checked: true }],
		// [481, { sageKey: "wornItem5Invested", checked: true }],
		// [482, { sageKey: "wornItem6Invested", checked: true }],
		// [483, { sageKey: "wornItem7Invested", checked: true }],
		// [484, { sageKey: "wornItem8Invested", checked: true }],
		// [485, { sageKey: "wornItem9Invested", checked: true }],
		// [486, { sageKey: "wornItem3Bulk" }],
		// [487, { sageKey: "wornItem2Bulk" }],
		// [488, { sageKey: "wornItem4Bulk" }],
		// [489, { sageKey: "wornItem5Bulk" }],
		// [490, { sageKey: "wornItem6Bulk" }],
		// [491, { sageKey: "wornItem7Bulk" }],
		// [493, { sageKey: "wornItem9Bulk" }],
		// [494, { sageKey: "consumableItem1Bulk" }],
		// [495, { sageKey: "consumableItem14" }],
		// [496, { sageKey: "consumableItem2Bulk" }],
		// [497, { sageKey: "consumableItem3Bulk" }],
		// [498, { sageKey: "consumableItem4Bulk" }],
		// [499, { sageKey: "consumableItem5Bulk" }],
		// [500, { sageKey: "consumableItem6Bulk" }],
		// [501, { sageKey: "consumableItem7Bulk" }],
		// [502, { sageKey: "consumableItem8Bulk" }],
		// [503, { sageKey: "consumableItem9Bulk" }],
		// [504, { sageKey: "consumableItem10Bulk" }],
		// [505, { sageKey: "consumableItem11Bulk" }],
		// [506, { sageKey: "consumableItem12Bulk" }],
		// [507, { sageKey: "consumableItem13Bulk" }],
		// [508, { sageKey: "consumableItem14Bulk" }],
		// [509, { sageKey: "heldItem13" }],
		// [510, { sageKey: "heldItem1Bulk" }],
		// [511, { sageKey: "heldItem2Bulk" }],
		// [512, { sageKey: "heldItem3Bulk" }],
		// [513, { sageKey: "heldItem4Bulk" }],
		// [514, { sageKey: "heldItem5Bulk" }],
		// [515, { sageKey: "heldItem6Bulk" }],
		// [516, { sageKey: "heldItem7Bulk" }],
		// [517, { sageKey: "heldItem8Bulk" }],
		// [518, { sageKey: "heldItem9Bulk" }],
		// [519, { sageKey: "heldItem10Bulk" }],
		// [520, { sageKey: "heldItem11Bulk" }],
		// [521, { sageKey: "heldItem12Bulk" }],
		// [522, { sageKey: "heldItem13Bulk" }],
		// [523, { sageKey: "bulk" }],
		// [525, { sageKey: "credits" }],
		// [526, { sageKey: "upb" }],
		// [527, { sageKey: "portOfCall" }],
		// [529, { sageKey: "appearance" }],
		// [530, { sageKey: "homeworld" }],
		// [531, { sageKey: "age" }],
		// [532, { sageKey: "pronouns" }],
		// [533, { sageKey: "height" }],
		// [534, { sageKey: "weights" }],
		// [535, { sageKey: "attitude" }],
		// [536, { sageKey: "edicts" }],
		// [537, { sageKey: "philosophy" }],
		// [538, { sageKey: "anathema" }],
		// [539, { sageKey: "likes" }],
		// [540, { sageKey: "dislikes" }],
		// [541, { sageKey: "catchphrases" }],
		// [542, { sageKey: "campaignNotes" }],
		// [543, { sageKey: "allies" }],
		// [544, { sageKey: "enemies" }],
		// [545, { sageKey: "faction" }],
		// [622, { sageKey: "spellsPerDay1" }],
		// [623, { sageKey: "spellsPerDay2" }],
		// [624, { sageKey: "spellsPerDay3" }],
		// [625, { sageKey: "spellsPerDay4" }],
		// [626, { sageKey: "spellsPerDay5" }],
		// [627, { sageKey: "spellsPerDay6" }],
		// [628, { sageKey: "spellsPerDay7" }],
		// [629, { sageKey: "spellsPerDay8" }],
		// [630, { sageKey: "spellsPerDay9" }],
		// [631, { sageKey: "spellsPerDay10" }],
		// [632, { sageKey: "spellsRemaining10" }],
		// [633, { sageKey: "spellsRemaining9" }],
		// [634, { sageKey: "spellsRemaining8" }],
		// [635, { sageKey: "spellsRemaining7" }],
		// [636, { sageKey: "spellsRemaining6" }],
		// [637, { sageKey: "spellsRemaining5" }],
		// [638, { sageKey: "spellsRemaining4" }],
		// [639, { sageKey: "spellsRemaining3" }],
		// [640, { sageKey: "spellsRemaining2" }],
		// [641, { sageKey: "spellsRemaining1" }],
		// [643, { sageKey: "cantripRank" }],
		// [644, { sageKey: "cantripsPerDay" }],
		// [648, { sageKey: "focusSpellRank" }],
		// [670, { sageKey: "spellNames" }],
		// [671, { sageKey: "spellNames2" }],
		// [672, { sageKey: "cantripNames" }],
		// [673, { sageKey: "cantripActions" }],
		// [675, { sageKey: "spellActions" }],
		// [676, { sageKey: "spellRanks" }],
		// [677, { sageKey: "spellActions2" }],
		// [678, { sageKey: "spellRanks2" }],
		// [679, { sageKey: "cantripPrepared" }],
		// [680, { sageKey: "spellPrepared" }],
		// [681, { sageKey: "spellPrepared2" }],
		// [682, { sageKey: "focusSpellNames" }],
		// [683, { sageKey: "focusSpellActions" }],
		// [684, { sageKey: "innateSpellNames" }],
		// [685, { sageKey: "innateSpellActions" }],
		// [686, { sageKey: "innateSpellFrequency" }],
		// [687, { sageKey: "ritualNames" }],
		// [688, { sageKey: "ritualRanks" }],
		// [689, { sageKey: "ritualCosts" }],
		// [690, { sageKey: "ritualRanks2" }],
		// [691, { sageKey: "ritualCosts2" }],
		// [692, { sageKey: "ritualNames2" }],

		//  TODO: These do not appear to have fields in the PDF as of now
		//  [181, { sageKey: "ranged2Range" }],
		//  [182, { sageKey: "ranged1Range" }],
		//  [183, { sageKey: "ranged3Range" }],
		//  [189, { sageKey: "ranged2Magazine" }],
		//  [190, { sageKey: "ranged2Expended" }],
		//  [191, { sageKey: "ranged1Magazine" }],
		//  [192, { sageKey: "ranged1Expended" }],
		//  [193, { sageKey: "ranged3Magazine" }],
		//  [194, { sageKey: "ranged3Expended" }],
		//  [196, { sageKey: "weaponProfNotes" }],
		//  [197, { sageKey: "criticalSpecializations" }],
		//  [247, { sageKey: "otherTrained", checked: true }],
		//  [248, { sageKey: "otherExpert", checked: true }],
		//  [249, { sageKey: "otherMaster", checked: true }],
		//  [250, { sageKey: "otherLegendary", checked: true }],
	])
}