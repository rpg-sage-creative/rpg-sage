import { generateSnowflake } from "@rsc-utils/core-utils";

const testDate = new Date();
const testBigInt = BigInt("12345678901234567890");
const tests = [
	{ deserialized:null, serialized:{NULL:true} },
	{ deserialized:true, serialized:{BOOL:true} },
	{ deserialized:false, serialized:{BOOL:false} },
	{ deserialized:"", serialized:{S:""} },
	{ deserialized:"one", serialized:{S:"one"} },
	{ deserialized:1, serialized:{N:"1"} },
	{ deserialized:1.2, serialized:{N:"1.2"} },
	{ deserialized:testDate, serialized:{M:{$date:{S:testDate.toISOString()}}} },
	{ deserialized:testBigInt, serialized:{M:{$bigint:{S:testBigInt.toString()}}} },
	{ deserialized:{}, serialized:{M:{}} },
	{ deserialized:{a:"A"}, serialized:{M:{a:{S:"A"}}} },
	{ deserialized:{a:"A",b:{c:"C"}}, serialized:{M:{a:{S:"A"},b:{M:{c:{S:"C"}}}}} },
	{ deserialized:{a:"A",b:{c:"C"},d:[1]}, serialized:{M:{a:{S:"A"},b:{M:{c:{S:"C"}}},d:{L:[{N:"1"}]}}} },
	{ deserialized:[], serialized:{L:[]} },
	{ deserialized:["",0,{a:"A"}], serialized:{L:[{S:""},{N:"0"},{M:{a:{S:"A"}}}]} },
	{ deserialized:new Set(["a","b","c"]), serialized:{SS:["a","b","c"]} },
	{ deserialized:new Set([1,2,3]), serialized:{NS:["1","2","3"]} },
	{ deserialized:new Set([1,"2"]), serialized:{M:{$set:{L:[{N:"1"},{S:"2"}]}}} },
];

export function getTests(which) {
	switch(which) {
		case "serialize": return tests;
		case "deserialize": return tests;
		default: return [];
	}
}

let channelIndex = 0;
const _channelIds = ["ic-channel", "ooc-channel", "gm-channel", "dice-channel", "misc-channel"];
let userIndex = 0;
const _userIds = ["fighter-id", "rogue-id", "wizard-id"];
function addChannelsAndUsers(objectType) {
	if (objectType !== "Game") return undefined;
	const channelIds = _channelIds.slice(channelIndex, channelIndex + 2);
	channelIndex++;
	if (channelIndex === _channelIds.length) channelIndex = 0;
	const userId = _userIds[userIndex];
	userIndex++;
	if (userIndex === _userIds.length) userIndex = 0;
	return {
		channels: channelIds.reduce((out, channelId) => { out[channelId] = {}; return out; }, {}),
		relatedIds: [userId].concat(channelIds),
		users: [{id:userId}],
	};
}
export function getJsonObjects(...objectTypes) {
	const jsonObjects = [];

	const itemCount = 50;
	for (let i = 0; i < itemCount; i++) {
		for (const objectType of objectTypes) {
			const id = generateSnowflake();
			const item = {
				name: `Random ${objectType}: ${id}`,
				id,
				objectType,
				...addChannelsAndUsers(objectType),

				// throw in some other values for funsies
				bigintValue: 1234567890n,
				trueValue: true,
				falseValue: false,
				dateValue: new Date(),
				emptyStringValue: "",
				nullValue: null,
				numberValue: 1234567890,
				stringValue: "non-empty string",
				zeroValue: 0,
			};
			// toStrictEqual complains about keys missing vs keys with undefined
			// serializing the data removes keys with undefined values
			if (i === 0) item.archivedTs = Date.now();
			jsonObjects.push(item);
		}
	}

	return jsonObjects;
}