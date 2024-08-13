export type PdfKeyMapItem = { pdfId:number; sageKey:string; checked?:boolean; };
export function getSf2ePlaytestPdfKeyMap(): PdfKeyMapItem[] {
	return [
		{ pdfId: 1, sageKey: "name" },
		{ pdfId: 2, sageKey: "ancestry" },
		{ pdfId: 3, sageKey: "background" },
		{ pdfId: 4, sageKey: "class" },
		{ pdfId: 5, sageKey: "classNotes" },
		{ pdfId: 6, sageKey: "backgroundNotes" },
		{ pdfId: 7, sageKey: "heritage" },
		{ pdfId: 8, sageKey: "size" },
		{ pdfId: 9, sageKey: "playerName" },
		{ pdfId: 10, sageKey: "level" },
		{ pdfId: 11, sageKey: "xp" },
		{ pdfId: 12, sageKey: "defenseNotes" },
		{ pdfId: 13, sageKey: "resistances" },
		{ pdfId: 14, sageKey: "conditions" },
		{ pdfId: 15, sageKey: "languages" },
		{ pdfId: 16, sageKey: "senses" },
		{ pdfId: 17, sageKey: "specialMovement" },
		{ pdfId: 18, sageKey: "maxHp" },
		{ pdfId: 19, sageKey: "hp" },
		{ pdfId: 20, sageKey: "speed" },
		{ pdfId: 21, sageKey: "ac" },
		{ pdfId: 22, sageKey: "strMod" },
		{ pdfId: 23, sageKey: "dexMod" },
		{ pdfId: 24, sageKey: "conMod" },
		{ pdfId: 25, sageKey: "intMod" },
		{ pdfId: 26, sageKey: "wisMod" },
		{ pdfId: 27, sageKey: "chaMod" },
		{ pdfId: 28, sageKey: "willMod" },
		{ pdfId: 29, sageKey: "reflexMod" },
		{ pdfId: 30, sageKey: "fortitudeMod" },
		{ pdfId: 32, sageKey: "shieldMod" },
		{ pdfId: 33, sageKey: "acDexMod" },
		{ pdfId: 34, sageKey: "acProfMod" },
		{ pdfId: 35, sageKey: "acItemMod" },
		{ pdfId: 36, sageKey: "shieldHardness" },
		{ pdfId: 37, sageKey: "shieldMaxHp" },
		{ pdfId: 38, sageKey: "shieldBreakThreshold" },
		{ pdfId: 39, sageKey: "shieldHp" },
		{ pdfId: 40, sageKey: "fortitudeConMod" },
		{ pdfId: 41, sageKey: "fortitudeProfMod" },
		{ pdfId: 42, sageKey: "fortitudeItemMod" },
		{ pdfId: 43, sageKey: "reflexDexMod" },
		{ pdfId: 44, sageKey: "reflexProfMod" },
		{ pdfId: 45, sageKey: "reflexItemMod" },
		{ pdfId: 46, sageKey: "willProfMod" },
		{ pdfId: 47, sageKey: "willItemMod" },
		{ pdfId: 49, sageKey: "willWisMod" },
		{ pdfId: 50, sageKey: "wounded" },
		{ pdfId: 51, sageKey: "tempHp" },
		{ pdfId: 52, sageKey: "acrobaticsMod" },
		{ pdfId: 53, sageKey: "arcanaMod" },
		{ pdfId: 54, sageKey: "athleticsMod" },
		{ pdfId: 55, sageKey: "computersMod" },
		{ pdfId: 56, sageKey: "craftingMod" },
		{ pdfId: 57, sageKey: "deceptionMod" },
		{ pdfId: 58, sageKey: "diplomacyMod" },
		{ pdfId: 59, sageKey: "intimidationMod" },
		{ pdfId: 60, sageKey: "lore1Mod" },
		{ pdfId: 61, sageKey: "lore2Mod" },
		{ pdfId: 62, sageKey: "medicineMod" },
		{ pdfId: 63, sageKey: "natureMod" },
		{ pdfId: 64, sageKey: "occultismMod" },
		{ pdfId: 65, sageKey: "performanceMod" },
		{ pdfId: 66, sageKey: "pilotingMod" },
		{ pdfId: 67, sageKey: "religionMod" },
		{ pdfId: 68, sageKey: "societyMod" },
		{ pdfId: 69, sageKey: "stealthMod" },
		{ pdfId: 70, sageKey: "survivalMod" },
		{ pdfId: 71, sageKey: "thieveryMod" },
		{ pdfId: 72, sageKey: "lore1Name" },
		{ pdfId: 73, sageKey: "lore2Name" },
		{ pdfId: 75, sageKey: "acrobaticsDexMod" },
		{ pdfId: 76, sageKey: "arcanaIntMod" },
		{ pdfId: 77, sageKey: "acrobaticsProfMod" },
		{ pdfId: 78, sageKey: "acrobaticsItemMod" },
		{ pdfId: 79, sageKey: "acrobaticsArmorMod" },
		{ pdfId: 80, sageKey: "arcanaProfMod" },
		{ pdfId: 81, sageKey: "arcanaItemMod" },
		{ pdfId: 82, sageKey: "athleticsStrMod" },
		{ pdfId: 83, sageKey: "computersIntMod" },
		{ pdfId: 84, sageKey: "craftingIntMod" },
		{ pdfId: 85, sageKey: "deceptionChaMod" },
		{ pdfId: 86, sageKey: "diplomacyChaMod" },
		{ pdfId: 87, sageKey: "intimidationChaMod" },
		{ pdfId: 88, sageKey: "lore1IntMod" },
		{ pdfId: 90, sageKey: "lore2IntMod" },
		{ pdfId: 92, sageKey: "medicineWisMod" },
		{ pdfId: 93, sageKey: "natureWisMod" },
		{ pdfId: 94, sageKey: "occultismIntMod" },
		{ pdfId: 95, sageKey: "performanceChaMod" },
		{ pdfId: 96, sageKey: "pilotingDexMod" },
		{ pdfId: 97, sageKey: "religionWisMod" },
		{ pdfId: 98, sageKey: "societyIntMod" },
		{ pdfId: 99, sageKey: "stealthDexMod" },
		{ pdfId: 100, sageKey: "survivalWisMod" },
		{ pdfId: 101, sageKey: "thieveryMod" },
		{ pdfId: 102, sageKey: "athleticsProfMod" },
		{ pdfId: 103, sageKey: "athleticsItemMod" },
		{ pdfId: 104, sageKey: "athleticsArmorMod" },
		{ pdfId: 105, sageKey: "computersProfMod" },
		{ pdfId: 106, sageKey: "craftingProfMod" },
		{ pdfId: 107, sageKey: "deceptionProfMod" },
		{ pdfId: 108, sageKey: "diplomacyProfMod" },
		{ pdfId: 110, sageKey: "intimidationProfMod" },
		{ pdfId: 111, sageKey: "lore1ProfMod" },
		{ pdfId: 112, sageKey: "lore2ProfMod" },
		{ pdfId: 113, sageKey: "medicineProfMod" },
		{ pdfId: 114, sageKey: "natureProfMod" },
		{ pdfId: 115, sageKey: "occultismProfMod" },
		{ pdfId: 117, sageKey: "performanceProfMod" },
		{ pdfId: 118, sageKey: "performanceItemMod" },
		{ pdfId: 119, sageKey: "occultismItemMod" },
		{ pdfId: 120, sageKey: "natureItemMod" },
		{ pdfId: 121, sageKey: "pilotingProfMod" },
		{ pdfId: 122, sageKey: "religionProfMod" },
		{ pdfId: 123, sageKey: "pilotingItemMod" },
		{ pdfId: 124, sageKey: "religionItemMod" },
		{ pdfId: 125, sageKey: "societyItemMod" },
		{ pdfId: 126, sageKey: "societyProfMod" },
		{ pdfId: 127, sageKey: "stealthProfMod" },
		{ pdfId: 128, sageKey: "stealthItemMod" },
		{ pdfId: 129, sageKey: "survivalProfMod" },
		{ pdfId: 130, sageKey: "survivalItemMod" },
		{ pdfId: 131, sageKey: "thieveryProfMod" },
		{ pdfId: 132, sageKey: "thieveryItemMod" },
		{ pdfId: 133, sageKey: "thieveryArmorMod" },
		{ pdfId: 134, sageKey: "stealthArmorMod" },
		{ pdfId: 135, sageKey: "lore2ItemMod" },
		{ pdfId: 136, sageKey: "medicineItemMod" },
		{ pdfId: 137, sageKey: "lore1ItemMod" },
		{ pdfId: 138, sageKey: "intimidationItemMod" },
		{ pdfId: 139, sageKey: "craftingItemMod" },
		{ pdfId: 140, sageKey: "deceptionItemMod" },
		{ pdfId: 141, sageKey: "diplomacyItemMod" },
		{ pdfId: 142, sageKey: "computersItemMod" },
		{ pdfId: 143, sageKey: "classDcAbilityMod" },
		{ pdfId: 144, sageKey: "classDcProfMod" },
		{ pdfId: 145, sageKey: "classDcItemMod" },
		{ pdfId: 146, sageKey: "perceptionWisMod" },
		{ pdfId: 147, sageKey: "perceptionProfMod" },
		{ pdfId: 148, sageKey: "perceptionItemMod" },
		{ pdfId: 149, sageKey: "melee1StrMod" },
		{ pdfId: 150, sageKey: "melee1ProfMod" },
		{ pdfId: 151, sageKey: "melee1ItemMod" },
		{ pdfId: 152, sageKey: "melee2StrMod" },
		{ pdfId: 153, sageKey: "melee2ProfMod" },
		{ pdfId: 154, sageKey: "melee2ItemMod" },
		{ pdfId: 155, sageKey: "ranged1ProfMod" },
		{ pdfId: 156, sageKey: "ranged1DexMod" },
		{ pdfId: 157, sageKey: "ranged1ItemMod" },
		{ pdfId: 158, sageKey: "ranged2DexMod" },
		{ pdfId: 159, sageKey: "ranged2ProfMod" },
		{ pdfId: 160, sageKey: "ranged2ItemMod" },
		{ pdfId: 161, sageKey: "ranged3DexMod" },
		{ pdfId: 162, sageKey: "ranged3ProfMod" },
		{ pdfId: 163, sageKey: "ranged3ItemMod" },
		{ pdfId: 164, sageKey: "melee1Name" },
		{ pdfId: 165, sageKey: "melee2Name" },
		{ pdfId: 166, sageKey: "ranged1Name" },
		{ pdfId: 167, sageKey: "ranged2Name" },
		{ pdfId: 168, sageKey: "ranged3Name" },
		{ pdfId: 169, sageKey: "ranged1Damage" },
		{ pdfId: 170, sageKey: "ranged2Damage" },
		{ pdfId: 171, sageKey: "ranged3Damage" },
		{ pdfId: 172, sageKey: "melee2Damage" },
		{ pdfId: 173, sageKey: "melee1Damage" },
		{ pdfId: 174, sageKey: "perceptionMod" },
		{ pdfId: 176, sageKey: "melee1Mod" },
		{ pdfId: 177, sageKey: "melee2Mod" },
		{ pdfId: 178, sageKey: "ranged1Mod" },
		{ pdfId: 179, sageKey: "ranged2Mod" },
		{ pdfId: 180, sageKey: "ranged3Mod" },
		{ pdfId: 181, sageKey: "ranged2Range" },
		{ pdfId: 182, sageKey: "ranged1Range" },
		{ pdfId: 183, sageKey: "ranged3Range" },
		{ pdfId: 184, sageKey: "ranged1Traits" },
		{ pdfId: 185, sageKey: "ranged2Traits" },
		{ pdfId: 186, sageKey: "ranged3Traits" },
		{ pdfId: 187, sageKey: "melee2Traits" },
		{ pdfId: 188, sageKey: "melee1Traits" },
		{ pdfId: 189, sageKey: "ranged2Magazine" },
		{ pdfId: 190, sageKey: "ranged2Expended" },
		{ pdfId: 191, sageKey: "ranged1Magazine" },
		{ pdfId: 192, sageKey: "ranged1Expended" },
		{ pdfId: 193, sageKey: "ranged3Magazine" },
		{ pdfId: 194, sageKey: "ranged3Expended" },
		{ pdfId: 195, sageKey: "classDc" },
		{ pdfId: 196, sageKey: "weaponProfNotes" },
		{ pdfId: 197, sageKey: "criticalSpecializations" },
		{ pdfId: 198, sageKey: "heroPoint1", checked: true },
		{ pdfId: 199, sageKey: "heroPoint2", checked: true },
		{ pdfId: 200, sageKey: "heroPoint3", checked: true },
		{ pdfId: 207, sageKey: "unarmoredTrained", checked: true },
		{ pdfId: 208, sageKey: "unarmoredExpert", checked: true },
		{ pdfId: 209, sageKey: "unarmoredMaster", checked: true },
		{ pdfId: 210, sageKey: "unarmoredLegendary", checked: true },
		{ pdfId: 211, sageKey: "lightArmorTrained", checked: true },
		{ pdfId: 212, sageKey: "lightArmorExpert", checked: true },
		{ pdfId: 213, sageKey: "lightArmorMaster", checked: true },
		{ pdfId: 214, sageKey: "lightArmorLegendary", checked: true },
		{ pdfId: 215, sageKey: "mediumArmorTrained", checked: true },
		{ pdfId: 216, sageKey: "mediumArmorExpert", checked: true },
		{ pdfId: 217, sageKey: "mediumArmorMaster", checked: true },
		{ pdfId: 218, sageKey: "mediumArmorLegendary", checked: true },
		{ pdfId: 219, sageKey: "heavyArmorTrained", checked: true },
		{ pdfId: 220, sageKey: "heavyArmorExpert", checked: true },
		{ pdfId: 221, sageKey: "heavyArmorMaster", checked: true },
		{ pdfId: 222, sageKey: "heavyArmorLegendary", checked: true },
		{ pdfId: 228, sageKey: "unarmedTrained", checked: true },
		{ pdfId: 229, sageKey: "unarmedExpert", checked: true },
		{ pdfId: 230, sageKey: "unarmedMaster", checked: true },
		{ pdfId: 231, sageKey: "unarmedLegendary", checked: true },
		{ pdfId: 232, sageKey: "simpleTrained", checked: true },
		{ pdfId: 233, sageKey: "simpleExpert", checked: true },
		{ pdfId: 234, sageKey: "simpleMaster", checked: true },
		{ pdfId: 235, sageKey: "simpleLegendary", checked: true },
		{ pdfId: 236, sageKey: "martialTrained", checked: true },
		{ pdfId: 237, sageKey: "martialExpert", checked: true },
		{ pdfId: 238, sageKey: "martialLegendary", checked: true },
		{ pdfId: 239, sageKey: "martialMaster", checked: true },
		{ pdfId: 240, sageKey: "advancedTrained", checked: true },
		{ pdfId: 244, sageKey: "advancedExpert", checked: true },
		{ pdfId: 245, sageKey: "advancedMaster", checked: true },
		{ pdfId: 246, sageKey: "advancedLegendary", checked: true },
		{ pdfId: 247, sageKey: "otherTrained", checked: true },
		{ pdfId: 248, sageKey: "otherExpert", checked: true },
		{ pdfId: 249, sageKey: "otherMaster", checked: true },
		{ pdfId: 250, sageKey: "otherLegendary", checked: true },
		{ pdfId: 251, sageKey: "fortitudeTrained", checked: true },
		{ pdfId: 252, sageKey: "reflexTrained", checked: true },
		{ pdfId: 253, sageKey: "willTrained", checked: true },
		{ pdfId: 254, sageKey: "fortitudeExpert", checked: true },
		{ pdfId: 255, sageKey: "fortitudeMaster", checked: true },
		{ pdfId: 256, sageKey: "fortitudeLegendary", checked: true },
		{ pdfId: 257, sageKey: "reflexExpert", checked: true },
		{ pdfId: 258, sageKey: "reflexMaster", checked: true },
		{ pdfId: 259, sageKey: "reflexLegendary", checked: true },
		{ pdfId: 260, sageKey: "willExpert", checked: true },
		{ pdfId: 261, sageKey: "willMaster", checked: true },
		{ pdfId: 263, sageKey: "willLegendary", checked: true },
		{ pdfId: 265, sageKey: "perceptionTrained", checked: true },
		{ pdfId: 266, sageKey: "perceptionExpert", checked: true },
		{ pdfId: 267, sageKey: "perceptionMaster", checked: true },
		{ pdfId: 268, sageKey: "perceptionLegendary", checked: true },
		{ pdfId: 270, sageKey: "acrobaticsTrained", checked: true },
		{ pdfId: 271, sageKey: "acrobaticsExpert", checked: true },
		{ pdfId: 272, sageKey: "acrobaticsMaster", checked: true },
		{ pdfId: 273, sageKey: "acrobaticsLegendary", checked: true },
		{ pdfId: 274, sageKey: "arcanaTrained", checked: true },
		{ pdfId: 275, sageKey: "arcanaExpert", checked: true },
		{ pdfId: 276, sageKey: "arcanaMaster", checked: true },
		{ pdfId: 277, sageKey: "arcanaLegendary", checked: true },
		{ pdfId: 278, sageKey: "athleticsTrained", checked: true },
		{ pdfId: 279, sageKey: "athleticsExpert", checked: true },
		{ pdfId: 280, sageKey: "athleticsMaster", checked: true },
		{ pdfId: 281, sageKey: "athleticsLegendary", checked: true },
		{ pdfId: 282, sageKey: "computersTrained", checked: true },
		{ pdfId: 283, sageKey: "computersExpert", checked: true },
		{ pdfId: 284, sageKey: "computersMaster", checked: true },
		{ pdfId: 285, sageKey: "computersLegendary", checked: true },
		{ pdfId: 286, sageKey: "craftingTrained", checked: true },
		{ pdfId: 287, sageKey: "craftingExpert", checked: true },
		{ pdfId: 288, sageKey: "craftingMaster", checked: true },
		{ pdfId: 289, sageKey: "craftingLegendary", checked: true },
		{ pdfId: 290, sageKey: "deceptionTrained", checked: true },
		{ pdfId: 291, sageKey: "deceptionExpert", checked: true },
		{ pdfId: 292, sageKey: "deceptionMaster", checked: true },
		{ pdfId: 293, sageKey: "deceptionLegendary", checked: true },
		{ pdfId: 294, sageKey: "diplomacyTrained", checked: true },
		{ pdfId: 295, sageKey: "diplomacyExpert", checked: true },
		{ pdfId: 296, sageKey: "diplomacyMaster", checked: true },
		{ pdfId: 297, sageKey: "diplomacyLegendary", checked: true },
		{ pdfId: 298, sageKey: "intimidationTrained", checked: true },
		{ pdfId: 299, sageKey: "intimidationExpert", checked: true },
		{ pdfId: 300, sageKey: "intimidationMaster", checked: true },
		{ pdfId: 301, sageKey: "intimidationLegendary", checked: true },
		{ pdfId: 302, sageKey: "lore1Trained", checked: true },
		{ pdfId: 303, sageKey: "lore1Expert", checked: true },
		{ pdfId: 304, sageKey: "lore1Master", checked: true },
		{ pdfId: 305, sageKey: "lore1Legendary", checked: true },
		{ pdfId: 306, sageKey: "lore2Trained", checked: true },
		{ pdfId: 307, sageKey: "lore2Expert", checked: true },
		{ pdfId: 308, sageKey: "lore2Master", checked: true },
		{ pdfId: 309, sageKey: "lore2Legendary", checked: true },
		{ pdfId: 310, sageKey: "medicineTrained", checked: true },
		{ pdfId: 311, sageKey: "medicineExpert", checked: true },
		{ pdfId: 312, sageKey: "medicineMaster", checked: true },
		{ pdfId: 313, sageKey: "medicineLegendary", checked: true },
		{ pdfId: 314, sageKey: "natureTrained", checked: true },
		{ pdfId: 315, sageKey: "natureExpert", checked: true },
		{ pdfId: 316, sageKey: "natureMaster", checked: true },
		{ pdfId: 317, sageKey: "natureLegendary", checked: true },
		{ pdfId: 318, sageKey: "occultismTrained", checked: true },
		{ pdfId: 319, sageKey: "occultismExpert", checked: true },
		{ pdfId: 320, sageKey: "occultismMaster", checked: true },
		{ pdfId: 321, sageKey: "occultismLegendary", checked: true },
		{ pdfId: 322, sageKey: "performanceTrained", checked: true },
		{ pdfId: 323, sageKey: "performanceExpert", checked: true },
		{ pdfId: 324, sageKey: "performanceMaster", checked: true },
		{ pdfId: 325, sageKey: "performanceLegendary", checked: true },
		{ pdfId: 326, sageKey: "pilotingTrained", checked: true },
		{ pdfId: 327, sageKey: "pilotingExpert", checked: true },
		{ pdfId: 328, sageKey: "pilotingMaster", checked: true },
		{ pdfId: 329, sageKey: "pilotingLegendary", checked: true },
		{ pdfId: 330, sageKey: "religionTrained", checked: true },
		{ pdfId: 331, sageKey: "religionExpert", checked: true },
		{ pdfId: 332, sageKey: "religionMaster", checked: true },
		{ pdfId: 333, sageKey: "religionLegendary", checked: true },
		{ pdfId: 334, sageKey: "societyTrained", checked: true },
		{ pdfId: 336, sageKey: "societyExpert", checked: true },
		{ pdfId: 337, sageKey: "societyMaster", checked: true },
		{ pdfId: 338, sageKey: "societyLegendary", checked: true },
		{ pdfId: 339, sageKey: "stealthTrained", checked: true },
		{ pdfId: 340, sageKey: "stealthExpert", checked: true },
		{ pdfId: 341, sageKey: "stealthMaster", checked: true },
		{ pdfId: 342, sageKey: "stealthLegendary", checked: true },
		{ pdfId: 343, sageKey: "survivalTrained", checked: true },
		{ pdfId: 344, sageKey: "survivalExpert", checked: true },
		{ pdfId: 345, sageKey: "survivalMaster", checked: true },
		{ pdfId: 346, sageKey: "survivalLegendary", checked: true },
		{ pdfId: 347, sageKey: "thieveryTrained", checked: true },
		{ pdfId: 348, sageKey: "thieveryExpert", checked: true },
		{ pdfId: 349, sageKey: "thieveryMaster", checked: true },
		{ pdfId: 350, sageKey: "thieveryLegendary", checked: true },
		{ pdfId: 352, sageKey: "classFeatsFeatures" },
		{ pdfId: 353, sageKey: "ancestryAbilities" },
		{ pdfId: 354, sageKey: "ancestryFeat1" },
		{ pdfId: 355, sageKey: "backgroundFeat" },
		{ pdfId: 356, sageKey: "skillFeat2" },
		{ pdfId: 357, sageKey: "generalFeat3" },
		{ pdfId: 358, sageKey: "skillFeat4" },
		{ pdfId: 359, sageKey: "skillFeat6" },
		{ pdfId: 360, sageKey: "generalFeat6" },
		{ pdfId: 361, sageKey: "skillFeat8" },
		{ pdfId: 362, sageKey: "ancestryFeat9" },
		{ pdfId: 364, sageKey: "generalFeat11" },
		{ pdfId: 365, sageKey: "skillFeat12" },
		{ pdfId: 366, sageKey: "ancestryFeat13" },
		{ pdfId: 367, sageKey: "skillFeat14" },
		{ pdfId: 368, sageKey: "skillFeat16" },
		{ pdfId: 369, sageKey: "ancestryFeat17" },
		{ pdfId: 370, sageKey: "skillFeat18" },
		{ pdfId: 371, sageKey: "generalFeat19" },
		{ pdfId: 373, sageKey: "classFeat2" },
		{ pdfId: 374, sageKey: "classFeature3" },
		{ pdfId: 375, sageKey: "classFeat4" },
		{ pdfId: 376, sageKey: "classFeature5" },
		{ pdfId: 377, sageKey: "classFeat6" },
		{ pdfId: 378, sageKey: "classFeature7" },
		{ pdfId: 379, sageKey: "classFeat8" },
		{ pdfId: 380, sageKey: "classFeature9" },
		{ pdfId: 381, sageKey: "classFeat10" },
		{ pdfId: 382, sageKey: "classFeature11" },
		{ pdfId: 383, sageKey: "classFeat12" },
		{ pdfId: 384, sageKey: "classFeature13" },
		{ pdfId: 385, sageKey: "classFeat14" },
		{ pdfId: 386, sageKey: "classFeature15" },
		{ pdfId: 387, sageKey: "classFeat16" },
		{ pdfId: 388, sageKey: "classFeature17" },
		{ pdfId: 389, sageKey: "classFeat18" },
		{ pdfId: 390, sageKey: "classFeature19" },
		{ pdfId: 391, sageKey: "classFeat20" },
		{ pdfId: 392, sageKey: "generalFeat15" },
		{ pdfId: 393, sageKey: "ancestryFeat5" },
		{ pdfId: 394, sageKey: "skillFeat10" },
		{ pdfId: 395, sageKey: "skillFeat20" },
		{ pdfId: 396, sageKey: "attributeBoosts20" },
		{ pdfId: 397, sageKey: "attributeBoosts15" },
		{ pdfId: 398, sageKey: "attributeBoosts10" },
		{ pdfId: 399, sageKey: "attributeBoosts5" },
		{ pdfId: 400, sageKey: "heldItem1" },
		{ pdfId: 401, sageKey: "heldItem2" },
		{ pdfId: 402, sageKey: "heldItem3" },
		{ pdfId: 403, sageKey: "heldItem4" },
		{ pdfId: 404, sageKey: "heldItem5" },
		{ pdfId: 405, sageKey: "heldItem6" },
		{ pdfId: 406, sageKey: "heldItem7" },
		{ pdfId: 407, sageKey: "heldItem8" },
		{ pdfId: 408, sageKey: "heldItem9" },
		{ pdfId: 409, sageKey: "heldItem10" },
		{ pdfId: 410, sageKey: "heldItem11" },
		{ pdfId: 411, sageKey: "heldItem12" },
		{ pdfId: 412, sageKey: "consumableItem1" },
		{ pdfId: 413, sageKey: "consumableItem2" },
		{ pdfId: 414, sageKey: "consumableItem3" },
		{ pdfId: 415, sageKey: "consumableItem4" },
		{ pdfId: 416, sageKey: "consumableItem5" },
		{ pdfId: 417, sageKey: "consumableItem6" },
		{ pdfId: 418, sageKey: "consumableItem7" },
		{ pdfId: 419, sageKey: "consumableItem8" },
		{ pdfId: 420, sageKey: "consumableItem9" },
		{ pdfId: 421, sageKey: "consumableItem10" },
		{ pdfId: 422, sageKey: "consumableItem11" },
		{ pdfId: 423, sageKey: "consumableItem12" },
		{ pdfId: 424, sageKey: "consumableItem13" },
		{ pdfId: 425, sageKey: "wornItem1" },
		{ pdfId: 426, sageKey: "wornItem2" },
		{ pdfId: 427, sageKey: "wornItem3" },
		{ pdfId: 428, sageKey: "wornItem4" },
		{ pdfId: 429, sageKey: "wornItem5" },
		{ pdfId: 430, sageKey: "wornItem6" },
		{ pdfId: 431, sageKey: "wornItem7" },
		{ pdfId: 432, sageKey: "wornItem8" },
		{ pdfId: 433, sageKey: "wornItem9" },
		{ pdfId: 434, sageKey: "weapon1" },
		{ pdfId: 435, sageKey: "weapon2" },
		{ pdfId: 436, sageKey: "weapon3" },
		{ pdfId: 437, sageKey: "weapon4" },
		{ pdfId: 438, sageKey: "weapon5" },
		{ pdfId: 439, sageKey: "weapon6" },
		{ pdfId: 440, sageKey: "weapon7" },
		{ pdfId: 441, sageKey: "weapon8" },
		{ pdfId: 443, sageKey: "valuable1" },
		{ pdfId: 444, sageKey: "valuable2" },
		{ pdfId: 445, sageKey: "valuable3" },
		{ pdfId: 446, sageKey: "valuable4" },
		{ pdfId: 447, sageKey: "valuable1Price" },
		{ pdfId: 448, sageKey: "valuable2Price" },
		{ pdfId: 449, sageKey: "valuable3Price" },
		{ pdfId: 450, sageKey: "valuable4Price" },
		{ pdfId: 451, sageKey: "valuable1Bulk" },
		{ pdfId: 452, sageKey: "valuable2Bulk" },
		{ pdfId: 453, sageKey: "valuable3Bulk" },
		{ pdfId: 454, sageKey: "valuable4Bulk" },
		{ pdfId: 456, sageKey: "weapon1Magazine" },
		{ pdfId: 457, sageKey: "weapon2Magazine" },
		{ pdfId: 458, sageKey: "weapon3Magazine" },
		{ pdfId: 459, sageKey: "weapon4Magazine" },
		{ pdfId: 460, sageKey: "weapon5Magazine" },
		{ pdfId: 461, sageKey: "weapon6Magazine" },
		{ pdfId: 462, sageKey: "weapon9" },
		{ pdfId: 463, sageKey: "weapon7Magazine" },
		{ pdfId: 464, sageKey: "weapon8Magazine" },
		{ pdfId: 465, sageKey: "weapon9Magazine" },
		{ pdfId: 466, sageKey: "weapon1Bulk" },
		{ pdfId: 467, sageKey: "weapon2Bulk" },
		{ pdfId: 468, sageKey: "weapon3Bulk" },
		{ pdfId: 469, sageKey: "weapon4Bulk" },
		{ pdfId: 470, sageKey: "weapon5Bulk" },
		{ pdfId: 471, sageKey: "weapon6Bulk" },
		{ pdfId: 472, sageKey: "weapon7Bulk" },
		{ pdfId: 473, sageKey: "weapon8Bulk" },
		{ pdfId: 474, sageKey: "weapon9Bulk" },
		{ pdfId: 476, sageKey: "wornItem1Bulk" },
		{ pdfId: 477, sageKey: "wornItem1Invested", checked: true },
		{ pdfId: 478, sageKey: "wornItem2Invested", checked: true },
		{ pdfId: 479, sageKey: "wornItem3Invested", checked: true },
		{ pdfId: 480, sageKey: "wornItem4Invested", checked: true },
		{ pdfId: 481, sageKey: "wornItem5Invested", checked: true },
		{ pdfId: 482, sageKey: "wornItem6Invested", checked: true },
		{ pdfId: 483, sageKey: "wornItem7Invested", checked: true },
		{ pdfId: 484, sageKey: "wornItem8Invested", checked: true },
		{ pdfId: 485, sageKey: "wornItem9Invested", checked: true },
		{ pdfId: 486, sageKey: "wornItem3Bulk" },
		{ pdfId: 487, sageKey: "wornItem2Bulk" },
		{ pdfId: 488, sageKey: "wornItem4Bulk" },
		{ pdfId: 489, sageKey: "wornItem5Bulk" },
		{ pdfId: 490, sageKey: "wornItem6Bulk" },
		{ pdfId: 491, sageKey: "wornItem7Bulk" },
		{ pdfId: 493, sageKey: "wornItem9Bulk" },
		{ pdfId: 494, sageKey: "consumableItem1Bulk" },
		{ pdfId: 495, sageKey: "consumableItem14" },
		{ pdfId: 496, sageKey: "consumableItem2Bulk" },
		{ pdfId: 497, sageKey: "consumableItem3Bulk" },
		{ pdfId: 498, sageKey: "consumableItem4Bulk" },
		{ pdfId: 499, sageKey: "consumableItem5Bulk" },
		{ pdfId: 500, sageKey: "consumableItem6Bulk" },
		{ pdfId: 501, sageKey: "consumableItem7Bulk" },
		{ pdfId: 502, sageKey: "consumableItem8Bulk" },
		{ pdfId: 503, sageKey: "consumableItem9Bulk" },
		{ pdfId: 504, sageKey: "consumableItem10Bulk" },
		{ pdfId: 505, sageKey: "consumableItem11Bulk" },
		{ pdfId: 506, sageKey: "consumableItem12Bulk" },
		{ pdfId: 507, sageKey: "consumableItem13Bulk" },
		{ pdfId: 508, sageKey: "consumableItem14Bulk" },
		{ pdfId: 509, sageKey: "heldItem13" },
		{ pdfId: 510, sageKey: "heldItem1Bulk" },
		{ pdfId: 511, sageKey: "heldItem2Bulk" },
		{ pdfId: 512, sageKey: "heldItem3Bulk" },
		{ pdfId: 513, sageKey: "heldItem4Bulk" },
		{ pdfId: 514, sageKey: "heldItem5Bulk" },
		{ pdfId: 515, sageKey: "heldItem6Bulk" },
		{ pdfId: 516, sageKey: "heldItem7Bulk" },
		{ pdfId: 517, sageKey: "heldItem8Bulk" },
		{ pdfId: 518, sageKey: "heldItem9Bulk" },
		{ pdfId: 519, sageKey: "heldItem10Bulk" },
		{ pdfId: 520, sageKey: "heldItem11Bulk" },
		{ pdfId: 521, sageKey: "heldItem12Bulk" },
		{ pdfId: 522, sageKey: "heldItem13Bulk" },
		{ pdfId: 523, sageKey: "bulk" },
		{ pdfId: 525, sageKey: "credits" },
		{ pdfId: 526, sageKey: "upb" },
		{ pdfId: 527, sageKey: "portOfCall" },
		{ pdfId: 529, sageKey: "appearance" },
		{ pdfId: 530, sageKey: "homeworld" },
		{ pdfId: 531, sageKey: "age" },
		{ pdfId: 532, sageKey: "pronouns" },
		{ pdfId: 533, sageKey: "height" },
		{ pdfId: 534, sageKey: "weights" },
		{ pdfId: 535, sageKey: "attitude" },
		{ pdfId: 536, sageKey: "edicts" },
		{ pdfId: 537, sageKey: "philosophy" },
		{ pdfId: 538, sageKey: "anathema" },
		{ pdfId: 539, sageKey: "likes" },
		{ pdfId: 540, sageKey: "dislikes" },
		{ pdfId: 541, sageKey: "catchphrases" },
		{ pdfId: 542, sageKey: "campaignNotes" },
		{ pdfId: 543, sageKey: "allies" },
		{ pdfId: 544, sageKey: "enemies" },
		{ pdfId: 545, sageKey: "faction" },
		{ pdfId: 616, sageKey: "spellDcAbilityMod" },
		{ pdfId: 617, sageKey: "spellDcProfMod" },
		{ pdfId: 618, sageKey: "spellAttackAbilityMod" },
		{ pdfId: 619, sageKey: "spellAttackProfMod" },
		{ pdfId: 620, sageKey: "spellDcMod" },
		{ pdfId: 621, sageKey: "spellAttackMod" },
		{ pdfId: 622, sageKey: "spellsPerDay1" },
		{ pdfId: 623, sageKey: "spellsPerDay2" },
		{ pdfId: 624, sageKey: "spellsPerDay3" },
		{ pdfId: 625, sageKey: "spellsPerDay4" },
		{ pdfId: 626, sageKey: "spellsPerDay5" },
		{ pdfId: 627, sageKey: "spellsPerDay6" },
		{ pdfId: 628, sageKey: "spellsPerDay7" },
		{ pdfId: 629, sageKey: "spellsPerDay8" },
		{ pdfId: 630, sageKey: "spellsPerDay9" },
		{ pdfId: 631, sageKey: "spellsPerDay10" },
		{ pdfId: 632, sageKey: "spellsRemaining10" },
		{ pdfId: 633, sageKey: "spellsRemaining9" },
		{ pdfId: 634, sageKey: "spellsRemaining8" },
		{ pdfId: 635, sageKey: "spellsRemaining7" },
		{ pdfId: 636, sageKey: "spellsRemaining6" },
		{ pdfId: 637, sageKey: "spellsRemaining5" },
		{ pdfId: 638, sageKey: "spellsRemaining4" },
		{ pdfId: 639, sageKey: "spellsRemaining3" },
		{ pdfId: 640, sageKey: "spellsRemaining2" },
		{ pdfId: 641, sageKey: "spellsRemaining1" },
		{ pdfId: 643, sageKey: "cantripRank" },
		{ pdfId: 644, sageKey: "cantripsPerDay" },
		{ pdfId: 648, sageKey: "focusSpellRank" },
		{ pdfId: 670, sageKey: "spellNames" },
		{ pdfId: 671, sageKey: "spellNames2" },
		{ pdfId: 672, sageKey: "cantripNames" },
		{ pdfId: 673, sageKey: "cantripActions" },
		{ pdfId: 675, sageKey: "spellActions" },
		{ pdfId: 676, sageKey: "spellRanks" },
		{ pdfId: 677, sageKey: "spellActions2" },
		{ pdfId: 678, sageKey: "spellRanks2" },
		{ pdfId: 679, sageKey: "cantripPrepared" },
		{ pdfId: 680, sageKey: "spellPrepared" },
		{ pdfId: 681, sageKey: "spellPrepared2" },
		{ pdfId: 682, sageKey: "focusSpellNames" },
		{ pdfId: 683, sageKey: "focusSpellActions" },
		{ pdfId: 684, sageKey: "innateSpellNames" },
		{ pdfId: 685, sageKey: "innateSpellActions" },
		{ pdfId: 686, sageKey: "innateSpellFrequency" },
		{ pdfId: 687, sageKey: "ritualNames" },
		{ pdfId: 688, sageKey: "ritualRanks" },
		{ pdfId: 689, sageKey: "ritualCosts" },
		{ pdfId: 690, sageKey: "ritualRanks2" },
		{ pdfId: 691, sageKey: "ritualCosts2" },
		{ pdfId: 692, sageKey: "ritualNames2" },
		{ pdfId: 699, sageKey: "spellDcTrained", checked: true },
		{ pdfId: 703, sageKey: "spellDcExpert", checked: true },
		{ pdfId: 704, sageKey: "spellDcMaster", checked: true },
		{ pdfId: 705, sageKey: "spellDcLegendary", checked: true },
		{ pdfId: 706, sageKey: "spellAtkTrained", checked: true },
		{ pdfId: 707, sageKey: "spellAtkExpert", checked: true },
		{ pdfId: 708, sageKey: "spellAtkMaster", checked: true },
		{ pdfId: 709, sageKey: "spellAtkLegendary", checked: true },
	].reduce((out, item) => {
		out[item.pdfId] = item;
		return out;
	}, [] as PdfKeyMapItem[]);
}
