import type { MessageAttachment } from "discord.js";
import { PdfJsonFields, TRawJson } from "../../../sage-e20/common/pdf";
import type PlayerCharacterE20 from "../../../sage-e20/common/PlayerCharacterE20";
import { PdfJsonParserJoe } from "../../../sage-e20/joe/parse";
import PlayerCharacterJoe from "../../../sage-e20/joe/PlayerCharacterJoe";
import { PdfJsonParserPR } from "../../../sage-e20/pr/parse";
import PlayerCharacterPR from "../../../sage-e20/pr/PlayerCharacterPR";
import { errorReturnNull } from "../../../sage-utils/utils/ConsoleUtils/Catchers";
import { PdfCacher } from "../../../sage-utils/utils/PdfUtils";
import type { DUser, TChannel } from "../../discord";
import type SageInteraction from "../model/SageInteraction";

type TPlayerCharacter = PlayerCharacterJoe | PlayerCharacterPR;

async function attachCharacter(channel: TChannel | DUser, attachment: MessageAttachment, character: TPlayerCharacter, pin: boolean): Promise<void> {
	const game = character instanceof PlayerCharacterPR ? "Power Rangers" : "G.I. Joe";
	const message = await channel.send({
		content: `Attaching ${game} Character: ${character} (${attachment.name})`,
		files:[attachment]
	}).catch(errorReturnNull);
	if (pin && message?.pinnable) {
		await message.pin();
	}
	return Promise.resolve();
}

export const e20Pdf = "e20-pdf";

export async function slashHandlerEssence20(sageInteraction: SageInteraction): Promise<void> {
	const attachment = sageInteraction.getAttachmentPdf(e20Pdf, true);
	const rawJson = await PdfCacher.read<TRawJson>(attachment.url);
	const fields = PdfJsonFields.inputToFields(rawJson);
	let pc: PlayerCharacterE20<any> | undefined;
	if (PdfJsonParserJoe.isJoePdf(rawJson, fields)) {
		const joeCore = PdfJsonParserJoe.parseCharacter(fields);
		joeCore.userDid = sageInteraction.user.id;
		pc = new PlayerCharacterJoe(joeCore, sageInteraction.caches);
	}
	if (PdfJsonParserPR.isPowerRangerPdf(rawJson, fields)) {
		const prCore = PdfJsonParserPR.parseCharacter(fields);
		prCore.userDid = sageInteraction.user.id;
		pc = new PlayerCharacterPR(prCore, sageInteraction.caches);
	}
	if (pc) {
		const channel = sageInteraction.interaction.channel;
		if (sageInteraction.getBoolean("attach") === true) {
			await attachCharacter(channel, attachment, pc, sageInteraction.getBoolean("pin") === true);
		}
		const html = sageInteraction.caches.format(pc.toHtml());
		channel.send({ content:html });
	}else {
		console.log(`Error importing character!`);
	}
}