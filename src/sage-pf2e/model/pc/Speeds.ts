import Check from "./Check";
import type PlayerCharacter from "./PlayerCharacter";

export default class Speeds {

	public constructor(public pc: PlayerCharacter) { }

	public get hasBurrowSpeed(): boolean {
		return this.pc.features.find(feature => feature.hasMetadata && feature.metadata.speedBurrow > 0) !== undefined;
	}
	public get hasClimbSpeed(): boolean {
		return this.pc.features.find(feature => feature.hasMetadata && feature.metadata.speedClimb > 0) !== undefined;
	}
	public get hasFlySpeed(): boolean {
		return this.pc.features.find(feature => feature.hasMetadata && feature.metadata.speedFly > 0) !== undefined;
	}
	public get hasLandSpeed(): boolean {
		return this.pc.features.find(feature => feature.hasMetadata && feature.metadata.speedLand > 0) !== undefined;
	}
	public get hasSwimSpeed(): boolean {
		return this.pc.features.find(feature => feature.hasMetadata && feature.metadata.speedSwim > 0) !== undefined;
	}

	public get speed(): Check {
		const check = new Check(this.pc, "Speed");
		check.minimum = 5;
		this.pc.features.forEach(feature => feature.hasMetadata && feature.metadata.speedLand > 0, feature => {
			check.addUntypedModifier(feature.name, feature.metadata.speedLand);
		});
		this.pc.features.getFeats().filter(feat => feat.hasMetadata && feat.metadata.speedLand > 0).forEach(feat => {
			check.addUntypedModifier(feat.name, feat.metadata.speedLand);
		});
		if (this.pc.encumbrance.isEncumbered) {
			check.addUntypedModifier("Encumbered", -10);
		}
		return check;
	}

}
