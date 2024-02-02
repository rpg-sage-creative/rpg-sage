/*
This is where we are going to manage ensuring an individual die roll has a minimum / maximum value.
Current working term is threshold.
Top Threshold is the HIGHEST value you can get, regardless of the rolled value.
Bottom Threshold is the LOWEST value you can get, regardless of the rolled value.
Working codes are tt and bt.
Ex: [1d8tt7] would mean that when an 8 is rolled, a value of 7 would be used.
Ex: [1d8bt2] would mean that when a 1 is rolled, a value of 2 would be used.

maybe use lt (lowest threshold) and ht (highest threshold) to match dh and dl and kh and kl (drop/keep)
*/

/**
 * @internal
 * @private
 */
export class DiceThreshold {

}