import type { HasPixelDimensions } from "./HasDimensions.js";
import type { HasGridDimensions } from "./HasGridDimensions.js";

export type HasSize = Partial<HasGridDimensions> & Partial<HasPixelDimensions>;
