export abstract class HasCore<Core> {
	declare protected core: Core;
	public toJSON(): Core { return this.core; }
}
