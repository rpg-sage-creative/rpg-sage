export function getCurrencyDataPf2e() {
	return {
		// names and value relative to default denomination (default has value = 1)
		denominations: [
			{ name:"Copper Piece", plural:"Copper Pieces", denom:"cp", value:1/10 },
			{ name:"Silver Piece", plural:"Silver Pieces", denom:"sp", value:1 },
			{ name:"Gold Piece", plural:"Gold Pieces", denom:"gp", value:10 },
			{ name:"Platinum Piece", plural:"Platinum Pieces", denom:"pp", value:100 },
		],
		// while the value of denominations can build exchange rates, exchanges between systems need specific values
		exchangeRates: [
			// one credit from SF2e is 10 sp (1 gp)
			{ system:"SF2e", denom:"credit", value:10 },
		]
	};
}
