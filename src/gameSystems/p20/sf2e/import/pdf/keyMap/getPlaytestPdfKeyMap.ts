import type { PdfKeyMap } from "../types.js";

export function getPlaytestPdfKeyMap(): PdfKeyMap {
	return new Map([
		[1, { sageKey: "name" }],
		[2, { sageKey: "ancestry" }],
		[3, { sageKey: "background" }],
		[4, { sageKey: "class" }],
		[5, { sageKey: "classNotes" }],
		[6, { sageKey: "backgroundNotes" }],
		[7, { sageKey: "heritage" }],
		[8, { sageKey: "size" }],
		[9, { sageKey: "playerName" }],
		[10, { sageKey: "level" }],
		[11, { sageKey: "xp" }],
		[12, { sageKey: "defenseNotes" }],
		[13, { sageKey: "resistances" }],
		[14, { sageKey: "conditions" }],
		[15, { sageKey: "languages" }],
		[16, { sageKey: "senses" }],
		[17, { sageKey: "specialMovement" }],
		[18, { sageKey: "maxHp" }],
		[19, { sageKey: "hp" }],
		[20, { sageKey: "speed" }],
		[21, { sageKey: "ac" }],
		[22, { sageKey: "strMod" }],
		[23, { sageKey: "dexMod" }],
		[24, { sageKey: "conMod" }],
		[25, { sageKey: "intMod" }],
		[26, { sageKey: "wisMod" }],
		[27, { sageKey: "chaMod" }],
		[28, { sageKey: "willMod" }],
		[29, { sageKey: "reflexMod" }],
		[30, { sageKey: "fortitudeMod" }],
		[32, { sageKey: "shieldMod" }],
		[33, { sageKey: "acDexMod" }],
		[34, { sageKey: "acProfMod" }],
		[35, { sageKey: "acItemMod" }],
		[36, { sageKey: "shieldHardness" }],
		[37, { sageKey: "shieldMaxHp" }],
		[38, { sageKey: "shieldBreakThreshold" }],
		[39, { sageKey: "shieldHp" }],
		[40, { sageKey: "fortitudeConMod" }],
		[41, { sageKey: "fortitudeProfMod" }],
		[42, { sageKey: "fortitudeItemMod" }],
		[43, { sageKey: "reflexDexMod" }],
		[44, { sageKey: "reflexProfMod" }],
		[45, { sageKey: "reflexItemMod" }],
		[46, { sageKey: "willProfMod" }],
		[47, { sageKey: "willItemMod" }],
		[49, { sageKey: "willWisMod" }],
		[50, { sageKey: "wounded" }],
		[51, { sageKey: "tempHp" }],
		[52, { sageKey: "acrobaticsMod" }],
		[53, { sageKey: "arcanaMod" }],
		[54, { sageKey: "athleticsMod" }],
		[55, { sageKey: "computersMod" }],
		[56, { sageKey: "craftingMod" }],
		[57, { sageKey: "deceptionMod" }],
		[58, { sageKey: "diplomacyMod" }],
		[59, { sageKey: "intimidationMod" }],
		[60, { sageKey: "lore1Mod" }],
		[61, { sageKey: "lore2Mod" }],
		[62, { sageKey: "medicineMod" }],
		[63, { sageKey: "natureMod" }],
		[64, { sageKey: "occultismMod" }],
		[65, { sageKey: "performanceMod" }],
		[66, { sageKey: "pilotingMod" }],
		[67, { sageKey: "religionMod" }],
		[68, { sageKey: "societyMod" }],
		[69, { sageKey: "stealthMod" }],
		[70, { sageKey: "survivalMod" }],
		[71, { sageKey: "thieveryMod" }],
		[72, { sageKey: "lore1Name" }],
		[73, { sageKey: "lore2Name" }],
		[75, { sageKey: "acrobaticsDexMod" }],
		[76, { sageKey: "arcanaIntMod" }],
		[77, { sageKey: "acrobaticsProfMod" }],
		[78, { sageKey: "acrobaticsItemMod" }],
		[79, { sageKey: "acrobaticsArmorMod" }],
		[80, { sageKey: "arcanaProfMod" }],
		[81, { sageKey: "arcanaItemMod" }],
		[82, { sageKey: "athleticsStrMod" }],
		[83, { sageKey: "computersIntMod" }],
		[84, { sageKey: "craftingIntMod" }],
		[85, { sageKey: "deceptionChaMod" }],
		[86, { sageKey: "diplomacyChaMod" }],
		[87, { sageKey: "intimidationChaMod" }],
		[88, { sageKey: "lore1IntMod" }],
		[90, { sageKey: "lore2IntMod" }],
		[92, { sageKey: "medicineWisMod" }],
		[93, { sageKey: "natureWisMod" }],
		[94, { sageKey: "occultismIntMod" }],
		[95, { sageKey: "performanceChaMod" }],
		[96, { sageKey: "pilotingDexMod" }],
		[97, { sageKey: "religionWisMod" }],
		[98, { sageKey: "societyIntMod" }],
		[99, { sageKey: "stealthDexMod" }],
		[100, { sageKey: "survivalWisMod" }],
		[101, { sageKey: "thieveryMod" }],
		[102, { sageKey: "athleticsProfMod" }],
		[103, { sageKey: "athleticsItemMod" }],
		[104, { sageKey: "athleticsArmorMod" }],
		[105, { sageKey: "computersProfMod" }],
		[106, { sageKey: "craftingProfMod" }],
		[107, { sageKey: "deceptionProfMod" }],
		[108, { sageKey: "diplomacyProfMod" }],
		[110, { sageKey: "intimidationProfMod" }],
		[111, { sageKey: "lore1ProfMod" }],
		[112, { sageKey: "lore2ProfMod" }],
		[113, { sageKey: "medicineProfMod" }],
		[114, { sageKey: "natureProfMod" }],
		[115, { sageKey: "occultismProfMod" }],
		[117, { sageKey: "performanceProfMod" }],
		[118, { sageKey: "performanceItemMod" }],
		[119, { sageKey: "occultismItemMod" }],
		[120, { sageKey: "natureItemMod" }],
		[121, { sageKey: "pilotingProfMod" }],
		[122, { sageKey: "religionProfMod" }],
		[123, { sageKey: "pilotingItemMod" }],
		[124, { sageKey: "religionItemMod" }],
		[125, { sageKey: "societyItemMod" }],
		[126, { sageKey: "societyProfMod" }],
		[127, { sageKey: "stealthProfMod" }],
		[128, { sageKey: "stealthItemMod" }],
		[129, { sageKey: "survivalProfMod" }],
		[130, { sageKey: "survivalItemMod" }],
		[131, { sageKey: "thieveryProfMod" }],
		[132, { sageKey: "thieveryItemMod" }],
		[133, { sageKey: "thieveryArmorMod" }],
		[134, { sageKey: "stealthArmorMod" }],
		[135, { sageKey: "lore2ItemMod" }],
		[136, { sageKey: "medicineItemMod" }],
		[137, { sageKey: "lore1ItemMod" }],
		[138, { sageKey: "intimidationItemMod" }],
		[139, { sageKey: "craftingItemMod" }],
		[140, { sageKey: "deceptionItemMod" }],
		[141, { sageKey: "diplomacyItemMod" }],
		[142, { sageKey: "computersItemMod" }],
		[143, { sageKey: "classDcAbilityMod" }],
		[144, { sageKey: "classDcProfMod" }],
		[145, { sageKey: "classDcItemMod" }],
		[146, { sageKey: "perceptionWisMod" }],
		[147, { sageKey: "perceptionProfMod" }],
		[148, { sageKey: "perceptionItemMod" }],
		[149, { sageKey: "melee1StrMod" }],
		[150, { sageKey: "melee1ProfMod" }],
		[151, { sageKey: "melee1ItemMod" }],
		[152, { sageKey: "melee2StrMod" }],
		[153, { sageKey: "melee2ProfMod" }],
		[154, { sageKey: "melee2ItemMod" }],
		[155, { sageKey: "ranged1ProfMod" }],
		[156, { sageKey: "ranged1DexMod" }],
		[157, { sageKey: "ranged1ItemMod" }],
		[158, { sageKey: "ranged2DexMod" }],
		[159, { sageKey: "ranged2ProfMod" }],
		[160, { sageKey: "ranged2ItemMod" }],
		[161, { sageKey: "ranged3DexMod" }],
		[162, { sageKey: "ranged3ProfMod" }],
		[163, { sageKey: "ranged3ItemMod" }],
		[164, { sageKey: "melee1Name" }],
		[165, { sageKey: "melee2Name" }],
		[166, { sageKey: "ranged1Name" }],
		[167, { sageKey: "ranged2Name" }],
		[168, { sageKey: "ranged3Name" }],
		[169, { sageKey: "ranged1Damage" }],
		[170, { sageKey: "ranged2Damage" }],
		[171, { sageKey: "ranged3Damage" }],
		[172, { sageKey: "melee2Damage" }],
		[173, { sageKey: "melee1Damage" }],
		[174, { sageKey: "perceptionMod" }],
		[176, { sageKey: "melee1Mod" }],
		[177, { sageKey: "melee2Mod" }],
		[178, { sageKey: "ranged1Mod" }],
		[179, { sageKey: "ranged2Mod" }],
		[180, { sageKey: "ranged3Mod" }],
		[181, { sageKey: "ranged2Range" }],
		[182, { sageKey: "ranged1Range" }],
		[183, { sageKey: "ranged3Range" }],
		[184, { sageKey: "ranged1Traits" }],
		[185, { sageKey: "ranged2Traits" }],
		[186, { sageKey: "ranged3Traits" }],
		[187, { sageKey: "melee2Traits" }],
		[188, { sageKey: "melee1Traits" }],
		[189, { sageKey: "ranged2Magazine" }],
		[190, { sageKey: "ranged2Expended" }],
		[191, { sageKey: "ranged1Magazine" }],
		[192, { sageKey: "ranged1Expended" }],
		[193, { sageKey: "ranged3Magazine" }],
		[194, { sageKey: "ranged3Expended" }],
		[195, { sageKey: "classDc" }],
		[196, { sageKey: "weaponProfNotes" }],
		[197, { sageKey: "criticalSpecializations" }],
		[198, { sageKey: "heroPoint1", checked: true }],
		[199, { sageKey: "heroPoint2", checked: true }],
		[200, { sageKey: "heroPoint3", checked: true }],
		[207, { sageKey: "unarmoredTrained", checked: true }],
		[208, { sageKey: "unarmoredExpert", checked: true }],
		[209, { sageKey: "unarmoredMaster", checked: true }],
		[210, { sageKey: "unarmoredLegendary", checked: true }],
		[211, { sageKey: "lightArmorTrained", checked: true }],
		[212, { sageKey: "lightArmorExpert", checked: true }],
		[213, { sageKey: "lightArmorMaster", checked: true }],
		[214, { sageKey: "lightArmorLegendary", checked: true }],
		[215, { sageKey: "mediumArmorTrained", checked: true }],
		[216, { sageKey: "mediumArmorExpert", checked: true }],
		[217, { sageKey: "mediumArmorMaster", checked: true }],
		[218, { sageKey: "mediumArmorLegendary", checked: true }],
		[219, { sageKey: "heavyArmorTrained", checked: true }],
		[220, { sageKey: "heavyArmorExpert", checked: true }],
		[221, { sageKey: "heavyArmorMaster", checked: true }],
		[222, { sageKey: "heavyArmorLegendary", checked: true }],
		[228, { sageKey: "unarmedTrained", checked: true }],
		[229, { sageKey: "unarmedExpert", checked: true }],
		[230, { sageKey: "unarmedMaster", checked: true }],
		[231, { sageKey: "unarmedLegendary", checked: true }],
		[232, { sageKey: "simpleTrained", checked: true }],
		[233, { sageKey: "simpleExpert", checked: true }],
		[234, { sageKey: "simpleMaster", checked: true }],
		[235, { sageKey: "simpleLegendary", checked: true }],
		[236, { sageKey: "martialTrained", checked: true }],
		[237, { sageKey: "martialExpert", checked: true }],
		[238, { sageKey: "martialLegendary", checked: true }],
		[239, { sageKey: "martialMaster", checked: true }],
		[240, { sageKey: "advancedTrained", checked: true }],
		[244, { sageKey: "advancedExpert", checked: true }],
		[245, { sageKey: "advancedMaster", checked: true }],
		[246, { sageKey: "advancedLegendary", checked: true }],
		[247, { sageKey: "otherTrained", checked: true }],
		[248, { sageKey: "otherExpert", checked: true }],
		[249, { sageKey: "otherMaster", checked: true }],
		[250, { sageKey: "otherLegendary", checked: true }],
		[251, { sageKey: "fortitudeTrained", checked: true }],
		[252, { sageKey: "reflexTrained", checked: true }],
		[253, { sageKey: "willTrained", checked: true }],
		[254, { sageKey: "fortitudeExpert", checked: true }],
		[255, { sageKey: "fortitudeMaster", checked: true }],
		[256, { sageKey: "fortitudeLegendary", checked: true }],
		[257, { sageKey: "reflexExpert", checked: true }],
		[258, { sageKey: "reflexMaster", checked: true }],
		[259, { sageKey: "reflexLegendary", checked: true }],
		[260, { sageKey: "willExpert", checked: true }],
		[261, { sageKey: "willMaster", checked: true }],
		[263, { sageKey: "willLegendary", checked: true }],
		[265, { sageKey: "perceptionTrained", checked: true }],
		[266, { sageKey: "perceptionExpert", checked: true }],
		[267, { sageKey: "perceptionMaster", checked: true }],
		[268, { sageKey: "perceptionLegendary", checked: true }],
		[270, { sageKey: "acrobaticsTrained", checked: true }],
		[271, { sageKey: "acrobaticsExpert", checked: true }],
		[272, { sageKey: "acrobaticsMaster", checked: true }],
		[273, { sageKey: "acrobaticsLegendary", checked: true }],
		[274, { sageKey: "arcanaTrained", checked: true }],
		[275, { sageKey: "arcanaExpert", checked: true }],
		[276, { sageKey: "arcanaMaster", checked: true }],
		[277, { sageKey: "arcanaLegendary", checked: true }],
		[278, { sageKey: "athleticsTrained", checked: true }],
		[279, { sageKey: "athleticsExpert", checked: true }],
		[280, { sageKey: "athleticsMaster", checked: true }],
		[281, { sageKey: "athleticsLegendary", checked: true }],
		[282, { sageKey: "computersTrained", checked: true }],
		[283, { sageKey: "computersExpert", checked: true }],
		[284, { sageKey: "computersMaster", checked: true }],
		[285, { sageKey: "computersLegendary", checked: true }],
		[286, { sageKey: "craftingTrained", checked: true }],
		[287, { sageKey: "craftingExpert", checked: true }],
		[288, { sageKey: "craftingMaster", checked: true }],
		[289, { sageKey: "craftingLegendary", checked: true }],
		[290, { sageKey: "deceptionTrained", checked: true }],
		[291, { sageKey: "deceptionExpert", checked: true }],
		[292, { sageKey: "deceptionMaster", checked: true }],
		[293, { sageKey: "deceptionLegendary", checked: true }],
		[294, { sageKey: "diplomacyTrained", checked: true }],
		[295, { sageKey: "diplomacyExpert", checked: true }],
		[296, { sageKey: "diplomacyMaster", checked: true }],
		[297, { sageKey: "diplomacyLegendary", checked: true }],
		[298, { sageKey: "intimidationTrained", checked: true }],
		[299, { sageKey: "intimidationExpert", checked: true }],
		[300, { sageKey: "intimidationMaster", checked: true }],
		[301, { sageKey: "intimidationLegendary", checked: true }],
		[302, { sageKey: "lore1Trained", checked: true }],
		[303, { sageKey: "lore1Expert", checked: true }],
		[304, { sageKey: "lore1Master", checked: true }],
		[305, { sageKey: "lore1Legendary", checked: true }],
		[306, { sageKey: "lore2Trained", checked: true }],
		[307, { sageKey: "lore2Expert", checked: true }],
		[308, { sageKey: "lore2Master", checked: true }],
		[309, { sageKey: "lore2Legendary", checked: true }],
		[310, { sageKey: "medicineTrained", checked: true }],
		[311, { sageKey: "medicineExpert", checked: true }],
		[312, { sageKey: "medicineMaster", checked: true }],
		[313, { sageKey: "medicineLegendary", checked: true }],
		[314, { sageKey: "natureTrained", checked: true }],
		[315, { sageKey: "natureExpert", checked: true }],
		[316, { sageKey: "natureMaster", checked: true }],
		[317, { sageKey: "natureLegendary", checked: true }],
		[318, { sageKey: "occultismTrained", checked: true }],
		[319, { sageKey: "occultismExpert", checked: true }],
		[320, { sageKey: "occultismMaster", checked: true }],
		[321, { sageKey: "occultismLegendary", checked: true }],
		[322, { sageKey: "performanceTrained", checked: true }],
		[323, { sageKey: "performanceExpert", checked: true }],
		[324, { sageKey: "performanceMaster", checked: true }],
		[325, { sageKey: "performanceLegendary", checked: true }],
		[326, { sageKey: "pilotingTrained", checked: true }],
		[327, { sageKey: "pilotingExpert", checked: true }],
		[328, { sageKey: "pilotingMaster", checked: true }],
		[329, { sageKey: "pilotingLegendary", checked: true }],
		[330, { sageKey: "religionTrained", checked: true }],
		[331, { sageKey: "religionExpert", checked: true }],
		[332, { sageKey: "religionMaster", checked: true }],
		[333, { sageKey: "religionLegendary", checked: true }],
		[334, { sageKey: "societyTrained", checked: true }],
		[336, { sageKey: "societyExpert", checked: true }],
		[337, { sageKey: "societyMaster", checked: true }],
		[338, { sageKey: "societyLegendary", checked: true }],
		[339, { sageKey: "stealthTrained", checked: true }],
		[340, { sageKey: "stealthExpert", checked: true }],
		[341, { sageKey: "stealthMaster", checked: true }],
		[342, { sageKey: "stealthLegendary", checked: true }],
		[343, { sageKey: "survivalTrained", checked: true }],
		[344, { sageKey: "survivalExpert", checked: true }],
		[345, { sageKey: "survivalMaster", checked: true }],
		[346, { sageKey: "survivalLegendary", checked: true }],
		[347, { sageKey: "thieveryTrained", checked: true }],
		[348, { sageKey: "thieveryExpert", checked: true }],
		[349, { sageKey: "thieveryMaster", checked: true }],
		[350, { sageKey: "thieveryLegendary", checked: true }],
		[352, { sageKey: "classFeatsFeatures" }],
		[353, { sageKey: "ancestryAbilities" }],
		[354, { sageKey: "ancestryFeat1" }],
		[355, { sageKey: "backgroundFeat" }],
		[356, { sageKey: "skillFeat2" }],
		[357, { sageKey: "generalFeat3" }],
		[358, { sageKey: "skillFeat4" }],
		[359, { sageKey: "skillFeat6" }],
		[360, { sageKey: "generalFeat6" }],
		[361, { sageKey: "skillFeat8" }],
		[362, { sageKey: "ancestryFeat9" }],
		[364, { sageKey: "generalFeat11" }],
		[365, { sageKey: "skillFeat12" }],
		[366, { sageKey: "ancestryFeat13" }],
		[367, { sageKey: "skillFeat14" }],
		[368, { sageKey: "skillFeat16" }],
		[369, { sageKey: "ancestryFeat17" }],
		[370, { sageKey: "skillFeat18" }],
		[371, { sageKey: "generalFeat19" }],
		[373, { sageKey: "classFeat2" }],
		[374, { sageKey: "classFeature3" }],
		[375, { sageKey: "classFeat4" }],
		[376, { sageKey: "classFeature5" }],
		[377, { sageKey: "classFeat6" }],
		[378, { sageKey: "classFeature7" }],
		[379, { sageKey: "classFeat8" }],
		[380, { sageKey: "classFeature9" }],
		[381, { sageKey: "classFeat10" }],
		[382, { sageKey: "classFeature11" }],
		[383, { sageKey: "classFeat12" }],
		[384, { sageKey: "classFeature13" }],
		[385, { sageKey: "classFeat14" }],
		[386, { sageKey: "classFeature15" }],
		[387, { sageKey: "classFeat16" }],
		[388, { sageKey: "classFeature17" }],
		[389, { sageKey: "classFeat18" }],
		[390, { sageKey: "classFeature19" }],
		[391, { sageKey: "classFeat20" }],
		[392, { sageKey: "generalFeat15" }],
		[393, { sageKey: "ancestryFeat5" }],
		[394, { sageKey: "skillFeat10" }],
		[395, { sageKey: "skillFeat20" }],
		[396, { sageKey: "attributeBoosts20" }],
		[397, { sageKey: "attributeBoosts15" }],
		[398, { sageKey: "attributeBoosts10" }],
		[399, { sageKey: "attributeBoosts5" }],
		[400, { sageKey: "heldItem1" }],
		[401, { sageKey: "heldItem2" }],
		[402, { sageKey: "heldItem3" }],
		[403, { sageKey: "heldItem4" }],
		[404, { sageKey: "heldItem5" }],
		[405, { sageKey: "heldItem6" }],
		[406, { sageKey: "heldItem7" }],
		[407, { sageKey: "heldItem8" }],
		[408, { sageKey: "heldItem9" }],
		[409, { sageKey: "heldItem10" }],
		[410, { sageKey: "heldItem11" }],
		[411, { sageKey: "heldItem12" }],
		[412, { sageKey: "consumableItem1" }],
		[413, { sageKey: "consumableItem2" }],
		[414, { sageKey: "consumableItem3" }],
		[415, { sageKey: "consumableItem4" }],
		[416, { sageKey: "consumableItem5" }],
		[417, { sageKey: "consumableItem6" }],
		[418, { sageKey: "consumableItem7" }],
		[419, { sageKey: "consumableItem8" }],
		[420, { sageKey: "consumableItem9" }],
		[421, { sageKey: "consumableItem10" }],
		[422, { sageKey: "consumableItem11" }],
		[423, { sageKey: "consumableItem12" }],
		[424, { sageKey: "consumableItem13" }],
		[425, { sageKey: "wornItem1" }],
		[426, { sageKey: "wornItem2" }],
		[427, { sageKey: "wornItem3" }],
		[428, { sageKey: "wornItem4" }],
		[429, { sageKey: "wornItem5" }],
		[430, { sageKey: "wornItem6" }],
		[431, { sageKey: "wornItem7" }],
		[432, { sageKey: "wornItem8" }],
		[433, { sageKey: "wornItem9" }],
		[434, { sageKey: "weapon1" }],
		[435, { sageKey: "weapon2" }],
		[436, { sageKey: "weapon3" }],
		[437, { sageKey: "weapon4" }],
		[438, { sageKey: "weapon5" }],
		[439, { sageKey: "weapon6" }],
		[440, { sageKey: "weapon7" }],
		[441, { sageKey: "weapon8" }],
		[443, { sageKey: "valuable1" }],
		[444, { sageKey: "valuable2" }],
		[445, { sageKey: "valuable3" }],
		[446, { sageKey: "valuable4" }],
		[447, { sageKey: "valuable1Price" }],
		[448, { sageKey: "valuable2Price" }],
		[449, { sageKey: "valuable3Price" }],
		[450, { sageKey: "valuable4Price" }],
		[451, { sageKey: "valuable1Bulk" }],
		[452, { sageKey: "valuable2Bulk" }],
		[453, { sageKey: "valuable3Bulk" }],
		[454, { sageKey: "valuable4Bulk" }],
		[456, { sageKey: "weapon1Magazine" }],
		[457, { sageKey: "weapon2Magazine" }],
		[458, { sageKey: "weapon3Magazine" }],
		[459, { sageKey: "weapon4Magazine" }],
		[460, { sageKey: "weapon5Magazine" }],
		[461, { sageKey: "weapon6Magazine" }],
		[462, { sageKey: "weapon9" }],
		[463, { sageKey: "weapon7Magazine" }],
		[464, { sageKey: "weapon8Magazine" }],
		[465, { sageKey: "weapon9Magazine" }],
		[466, { sageKey: "weapon1Bulk" }],
		[467, { sageKey: "weapon2Bulk" }],
		[468, { sageKey: "weapon3Bulk" }],
		[469, { sageKey: "weapon4Bulk" }],
		[470, { sageKey: "weapon5Bulk" }],
		[471, { sageKey: "weapon6Bulk" }],
		[472, { sageKey: "weapon7Bulk" }],
		[473, { sageKey: "weapon8Bulk" }],
		[474, { sageKey: "weapon9Bulk" }],
		[476, { sageKey: "wornItem1Bulk" }],
		[477, { sageKey: "wornItem1Invested", checked: true }],
		[478, { sageKey: "wornItem2Invested", checked: true }],
		[479, { sageKey: "wornItem3Invested", checked: true }],
		[480, { sageKey: "wornItem4Invested", checked: true }],
		[481, { sageKey: "wornItem5Invested", checked: true }],
		[482, { sageKey: "wornItem6Invested", checked: true }],
		[483, { sageKey: "wornItem7Invested", checked: true }],
		[484, { sageKey: "wornItem8Invested", checked: true }],
		[485, { sageKey: "wornItem9Invested", checked: true }],
		[486, { sageKey: "wornItem3Bulk" }],
		[487, { sageKey: "wornItem2Bulk" }],
		[488, { sageKey: "wornItem4Bulk" }],
		[489, { sageKey: "wornItem5Bulk" }],
		[490, { sageKey: "wornItem6Bulk" }],
		[491, { sageKey: "wornItem7Bulk" }],
		[493, { sageKey: "wornItem9Bulk" }],
		[494, { sageKey: "consumableItem1Bulk" }],
		[495, { sageKey: "consumableItem14" }],
		[496, { sageKey: "consumableItem2Bulk" }],
		[497, { sageKey: "consumableItem3Bulk" }],
		[498, { sageKey: "consumableItem4Bulk" }],
		[499, { sageKey: "consumableItem5Bulk" }],
		[500, { sageKey: "consumableItem6Bulk" }],
		[501, { sageKey: "consumableItem7Bulk" }],
		[502, { sageKey: "consumableItem8Bulk" }],
		[503, { sageKey: "consumableItem9Bulk" }],
		[504, { sageKey: "consumableItem10Bulk" }],
		[505, { sageKey: "consumableItem11Bulk" }],
		[506, { sageKey: "consumableItem12Bulk" }],
		[507, { sageKey: "consumableItem13Bulk" }],
		[508, { sageKey: "consumableItem14Bulk" }],
		[509, { sageKey: "heldItem13" }],
		[510, { sageKey: "heldItem1Bulk" }],
		[511, { sageKey: "heldItem2Bulk" }],
		[512, { sageKey: "heldItem3Bulk" }],
		[513, { sageKey: "heldItem4Bulk" }],
		[514, { sageKey: "heldItem5Bulk" }],
		[515, { sageKey: "heldItem6Bulk" }],
		[516, { sageKey: "heldItem7Bulk" }],
		[517, { sageKey: "heldItem8Bulk" }],
		[518, { sageKey: "heldItem9Bulk" }],
		[519, { sageKey: "heldItem10Bulk" }],
		[520, { sageKey: "heldItem11Bulk" }],
		[521, { sageKey: "heldItem12Bulk" }],
		[522, { sageKey: "heldItem13Bulk" }],
		[523, { sageKey: "bulk" }],
		[525, { sageKey: "credits" }],
		[526, { sageKey: "upb" }],
		[527, { sageKey: "portOfCall" }],
		[529, { sageKey: "appearance" }],
		[530, { sageKey: "homeworld" }],
		[531, { sageKey: "age" }],
		[532, { sageKey: "pronouns" }],
		[533, { sageKey: "height" }],
		[534, { sageKey: "weights" }],
		[535, { sageKey: "attitude" }],
		[536, { sageKey: "edicts" }],
		[537, { sageKey: "philosophy" }],
		[538, { sageKey: "anathema" }],
		[539, { sageKey: "likes" }],
		[540, { sageKey: "dislikes" }],
		[541, { sageKey: "catchphrases" }],
		[542, { sageKey: "campaignNotes" }],
		[543, { sageKey: "allies" }],
		[544, { sageKey: "enemies" }],
		[545, { sageKey: "faction" }],
		[616, { sageKey: "spellDcAbilityMod" }],
		[617, { sageKey: "spellDcProfMod" }],
		[618, { sageKey: "spellAttackAbilityMod" }],
		[619, { sageKey: "spellAttackProfMod" }],
		[620, { sageKey: "spellDcMod" }],
		[621, { sageKey: "spellAttackMod" }],
		[622, { sageKey: "spellsPerDay1" }],
		[623, { sageKey: "spellsPerDay2" }],
		[624, { sageKey: "spellsPerDay3" }],
		[625, { sageKey: "spellsPerDay4" }],
		[626, { sageKey: "spellsPerDay5" }],
		[627, { sageKey: "spellsPerDay6" }],
		[628, { sageKey: "spellsPerDay7" }],
		[629, { sageKey: "spellsPerDay8" }],
		[630, { sageKey: "spellsPerDay9" }],
		[631, { sageKey: "spellsPerDay10" }],
		[632, { sageKey: "spellsRemaining10" }],
		[633, { sageKey: "spellsRemaining9" }],
		[634, { sageKey: "spellsRemaining8" }],
		[635, { sageKey: "spellsRemaining7" }],
		[636, { sageKey: "spellsRemaining6" }],
		[637, { sageKey: "spellsRemaining5" }],
		[638, { sageKey: "spellsRemaining4" }],
		[639, { sageKey: "spellsRemaining3" }],
		[640, { sageKey: "spellsRemaining2" }],
		[641, { sageKey: "spellsRemaining1" }],
		[643, { sageKey: "cantripRank" }],
		[644, { sageKey: "cantripsPerDay" }],
		[648, { sageKey: "focusSpellRank" }],
		[670, { sageKey: "spellNames" }],
		[671, { sageKey: "spellNames2" }],
		[672, { sageKey: "cantripNames" }],
		[673, { sageKey: "cantripActions" }],
		[675, { sageKey: "spellActions" }],
		[676, { sageKey: "spellRanks" }],
		[677, { sageKey: "spellActions2" }],
		[678, { sageKey: "spellRanks2" }],
		[679, { sageKey: "cantripPrepared" }],
		[680, { sageKey: "spellPrepared" }],
		[681, { sageKey: "spellPrepared2" }],
		[682, { sageKey: "focusSpellNames" }],
		[683, { sageKey: "focusSpellActions" }],
		[684, { sageKey: "innateSpellNames" }],
		[685, { sageKey: "innateSpellActions" }],
		[686, { sageKey: "innateSpellFrequency" }],
		[687, { sageKey: "ritualNames" }],
		[688, { sageKey: "ritualRanks" }],
		[689, { sageKey: "ritualCosts" }],
		[690, { sageKey: "ritualRanks2" }],
		[691, { sageKey: "ritualCosts2" }],
		[692, { sageKey: "ritualNames2" }],
		[699, { sageKey: "spellDcTrained", checked: true }],
		[703, { sageKey: "spellDcExpert", checked: true }],
		[704, { sageKey: "spellDcMaster", checked: true }],
		[705, { sageKey: "spellDcLegendary", checked: true }],
		[706, { sageKey: "spellAttackTrained", checked: true }],
		[707, { sageKey: "spellAttackExpert", checked: true }],
		[708, { sageKey: "spellAttackMaster", checked: true }],
		[709, { sageKey: "spellAttackLegendary", checked: true }],
	]);
}
