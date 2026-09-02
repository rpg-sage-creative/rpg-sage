import type { Localizer } from "@rsc-sage/localization";
import type { RenderMapResults } from "./renderMap.js";

type Args = {
	additionalErrors?: string[];
	localize: Localizer;
	renderResults: RenderMapResults;
	updateContent?: string;
};

type ArgsWithAdditionalErrors = Args & {
	additionalErrors: string[];
};
type ArgsWithRenderErrors = Args & {
	renderResults: RenderMapResults & { hasError:true };
}
type ArgsWithUpdateContent = Args & {
	updateContent: string;
};

export function getRenderMapResultsContent(args: ArgsWithAdditionalErrors): string;
export function getRenderMapResultsContent(args: ArgsWithRenderErrors): string;
export function getRenderMapResultsContent(args: ArgsWithUpdateContent): string;
export function getRenderMapResultsContent(args: Args): string | undefined;
export function getRenderMapResultsContent({ additionalErrors, localize, renderResults, updateContent }: Args): string | undefined {
	const errors: string[] = [];

	if (renderResults.invalidImagesRemoved) {
		errors.push(localize("INVALID_IMAGES_REMOVED"));
	}

	if (!renderResults.rendered) {
		errors.push(localize("ERROR_MANIPULATING_IMAGE"));
	}

	const allErrors = additionalErrors
		? errors.concat(additionalErrors)
		: errors;

	const errorContent = allErrors.length
		? localize("AT_LEAST_ONE_OCCURRED") + allErrors.map(err => "\n- " + err)
		: undefined;

	if (renderResults.saved && updateContent) {
		return errorContent
			? updateContent + "\n" + errorContent
			: updateContent;
	}

	return errorContent;
}