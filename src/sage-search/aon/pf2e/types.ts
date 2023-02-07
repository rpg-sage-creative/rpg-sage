//#region PostData

import type { AonBaseCore } from "../../../sage-pf2e/model/base/AonBase";

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
type Tbm = { bool: { must?:Tmm[]; should?:Tmm[]; } };
export type TPostData = {
	query: {
		bool: {
			should: [Tmpp, Tbm];
			filter?: [ { terms: { type:string[] } } ];
			must_not?: [ { terms: { type:string[] } } ];
			minimum_should_match: 1;
		}
	}
	size?: number;
	sort: ["_score","_doc"];
};


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

export type TResponseData = {
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
