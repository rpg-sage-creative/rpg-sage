import type { Snowflake, UUID } from "@rsc-utils/core-utils";

export type CharId = Snowflake | UUID;

export type CharModalIndicator = "CharModal";

type SelectOptions = `Char`;
type ModalActions = `Show` | `Submit`;
type ModalOptions = `Names` | `Images` | `Stats`;
export type CharModalAction = `Select${SelectOptions}` | `${ModalActions}${ModalOptions}` | "Save" | "Confirm" | "Cancel";

export type CustomIdParts = {
	/** indicator that this control belongs to this form */
	indicator: CharModalIndicator;

	/** User Id */
	userId: Snowflake;

	/** Character Id */
	charId: CharId;

	/** Action */
	action: CharModalAction;
};
