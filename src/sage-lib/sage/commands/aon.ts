import AonBase from "../../../sage-pf2e/model/base/AonBase";
import type { AonBaseCore } from "../../../sage-pf2e/model/base/AonBase";
import utils from "../../../sage-utils";
import { SearchResults } from "../../../sage-pf2e";
import type { SearchInfo } from "../../../sage-utils/utils/SearchUtils";
import type SageMessage from "../model/SageMessage";
import { send } from "../../discord/messages";
import type { TChannel } from "../../discord";
import { parseSearchInfo } from "./default";

//#region PostData

/*
{
	"query": {
		"bool": {
			"should": [
				{"match_phrase_prefix":{"name":{"query":"magic missile"}}},
				{
					"bool": {
						"must": [
							{"multi_match":{"query":"magic","type":"best_fields","fields":["name","text^0.1","trait_raw","type"],"fuzziness":"auto"}},
							{"multi_match":{"query":"missile","type":"best_fields","fields":["name","text^0.1","trait_raw","type"],"fuzziness":"auto"}}
						]
					}
				}
			],
			"minimum_should_match":1
		}
	},
	"size":50,
	"sort":["_score","_doc"]
}
*/

type Tmpp = { match_phrase_prefix: { name: { query:string; } } };
type Tmm = { multi_match: { query:string; type:"best_fields"; fields:["name","text^0.1","trait_raw","type"]; fuzziness:"auto"; } };
type Tbm = { bool: { must:Tmm[]; } };
type TPostData = {
	query: {
		bool: {
			should: [Tmpp, Tbm];
			filter?: [ { terms: { type:string[] } } ];
			must_not?: [ { terms: { type:string[] } } ];
			minimum_should_match: 1;
		}
	}
	size: 50;
	sort: ["_score","_doc"];
};

function buildPostData(terms: string[], filterTypes?: string[], excludeTypes?: string[]): TPostData {
	const mpp = { match_phrase_prefix: { name: { query:terms.join(" ") } } };
	const bm = { bool:{ must:
		terms.map<Tmm>(term => ({ multi_match: { query:term, type:"best_fields", fields:["name","text^0.1","trait_raw","type"], fuzziness:"auto" } }))
	} };
	const postData: TPostData = {
		query: {
			bool: {
				should: [mpp, bm],
				minimum_should_match: 1
			}
		},
		size: 50,
		sort: ["_score","_doc"]
	};
	if (filterTypes) {
		postData.query.bool.filter = [ { terms: { type:filterTypes } } ];
	}
	if (excludeTypes) {
		postData.query.bool.must_not = [ { terms: { type:excludeTypes } } ];
	}
	return postData;
}

//#endregion

//#region ResponseData

/*
{
	took: 13,
	timed_out: false,
	_shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
	hits: {
		total: { value: 10000, relation: 'gte' },
		max_score: 1,
		hits: [
{
                "_index": "aon7",
                "_type": "_doc",
                "_id": "spell-180",
                "_score": 35.046444,
                "_source": {
                    "id": 180,
                    "url": "Spells.aspx?ID=180",
                    "category": "spell",
                    "name": "Magic Missile",
                    "type": "Spell",
                    "pfs": "Standard",
                    "text": "Magic Missile Spell 1 Evocation Force Source Core Rulebook pg. 349 2.0 Traditions arcane , occult Bloodline imperial Deity Nethys Cast to ( somatic , verbal ) Range 120 feet; Targets 1 creature You send a dart of force streaking toward a creature that you can see. It automatically hits and deals 1d4+1 force damage. For each additional action you use when Casting the Spell, increase the number of missiles you shoot by one, to a maximum of three missiles for 3 actions. You choose the target for each missile individually. If you shoot more than one missile at the same target, combine the damage before applying bonuses or penalties to damage, resistances, weaknesses, and so forth. Heightened (+2) You shoot one additional missile with each action you spend.",
                    "source": "Core Rulebook",
                    "source_raw": "Core Rulebook pg. 349 2.0",
                    "level": 1,
                    "bloodline": [
                        "imperial"
                    ],
                    "cast": "Single Action to Three Actions",
                    "component": [
                        "somatic",
                        "verbal"
                    ],
                    "deity": "Nethys",
                    "heighten": [
                        "+2"
                    ],
                    "range": 120,
                    "range_raw": "120 feet",
                    "target": "1 creature",
                    "tradition": [
                        "arcane",
                        "occult"
                    ],
                    "trait": [
                        "Evocation",
                        "Force"
                    ],
                    "trait_raw": [
                        "Evocation",
                        "Force"
                    ]
                },
                "sort": [
                    35.046444,
                    11760
                ]
            },
		]
	}
}
*/

type TResponseData = {
	took: number;
	timed_out: boolean;
	_shards: { total:number; successful:number; skipped:number; failed:number; };
	hits: {
		total: { value:number; relation:string; };
		max_score: number;
		hits: THit[];
	};
};

type THit = {
	_index: string;
	_type: string;
	_id: string;
	_score: number;
	_source: AonBaseCore;
	sort: number[];
};

//#endregion

export async function searchAon(searchInfo: SearchInfo, filterTypes: string[], excludeTypes: string[]): Promise<SearchResults> {
	const searchResults = new SearchResults(searchInfo);
	const postData = buildPostData(searchInfo.terms.map(term => term.term), filterTypes, excludeTypes);
	const url = `https://elasticsearch.galdiuz.com/aon/_search`;
	const response = await utils.HttpsUtils.getJson<TResponseData>(url, postData).catch(e => console.error(e)! || null);
	response?.hits?.hits?.forEach(hit => searchResults.add(...AonBase.searchRecursive(hit._source, searchInfo)));

	//#region type shuffle (rules/source/creature should be last)

	const typesToShuffle = ["Item", "Source", "Rules", "Creature"];
	const { types, scores } = typesToShuffle.reduce((data, type) => {
		data.types.push(type);
		data.scores.push(searchResults.scores.filter(score => score.searchable.objectType === type));
		return data;
	}, { types:[] as string[], scores:[] as utils.SearchUtils.SearchScore<AonBase>[][] });
	const resorted = searchResults.scores.filter(score => !types.includes(score.searchable.objectType));
	scores.forEach(typeScores => resorted.push(...typeScores));
	searchResults.scores = resorted;

	//#endregion

	// #region perfect match resort

	const stringMatcher = utils.StringUtils.StringMatcher.from(searchInfo.searchText);
	const nameMatches = searchResults.scores.filter(score => score.searchable.matches(stringMatcher));
	if (nameMatches.length) {
		searchResults.scores = nameMatches.concat(searchResults.scores.filter(score => !nameMatches.includes(score)));
	}

	// #endregion

	return searchResults;
}

export async function aonHandler(sageMessage: SageMessage, nameOnly = false): Promise<void> {
	if (!sageMessage.allowSearch) {
		return sageMessage.reactBlock();
	}

	// Let em know we are busy ...
	const promise = send(sageMessage.caches, sageMessage.message.channel as TChannel, `> Searching Archives of Nethys, please wait ...`, sageMessage.message.author);

	// Parse the query and start the search ...
	const parsedSearchInfo = parseSearchInfo(sageMessage.args);
	const searchInfo = new utils.SearchUtils.SearchInfo(parsedSearchInfo.searchText, nameOnly ? "" : "g");
	const searchResults = await searchAon(searchInfo, undefined!, undefined!);

	const renderableToSend = nameOnly
		? (searchResults.theOne ?? searchResults.theMatch ?? searchResults)
		: (searchResults.theOne ?? searchResults);

	// delete the "please wait" message(s)
	const messages = await promise;
	messages.forEach(message => message.deletable ? message.delete() : void 0);

	// Send the proper results
	await send(sageMessage.caches, sageMessage.message.channel as TChannel, renderableToSend, sageMessage.message.author);
	return Promise.resolve();
}
