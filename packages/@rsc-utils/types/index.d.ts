// Auto-generated aggregate type declarations for all @rsc-utils packages
// Only exports types and interfaces (no functions, constants, or classes)

// arg-utils
export type { KeyValueArgMatchGroups } from "../arg-utils/build/parseKeyValueArg.js";
export type { KeyValuePair, KeyValueTrio, KeyValueRegex, KeyValueQuad, ArgBase, FlagArg, IncrementArg, KeyValueArg, ValueArg } from "../arg-utils/build/types.js";

// aws-utils
export type { AwsRegion } from "../aws-utils/build/AwsRegion.js";
export type { DdbClientConfig } from "../aws-utils/build/ddb/DdbClientConfig.js";
export type { RepoId, RepoItem, BatchRequestKey, BatchGetRequestItems, BatchGetResults, BatchWriteRequestItems, BatchWriteResults, TableNameParser, UnprocessedItem } from "../aws-utils/build/ddb/types.js";
export type { SnsClientConfig } from "../aws-utils/build/sns/SnsClientConfig.js";

// charset-utils
export type { ScriptedCharSet } from "../charset-utils/build/ScriptedCharSet.js";

// class-utils
export type { Core } from "../class-utils/build/HasCore.js";
export type { IdCore } from "../class-utils/build/HasIdCore.js";
export type { NameCore, HasNameCore } from "../class-utils/build/types.js";

// collection-utils
export type { Filter } from "../collection-utils/build/filter/Filter.js";
export type { SortResult, Sorter, Comparable } from "../collection-utils/build/sort/types.js";

// color-utils
export type { HexColorString, RgbColorString, RgbaColorString, ColorString, ColorData } from "../color-utils/build/ColorData.js";

// core-utils
export type { Renderable, RenderableContentResolvable, RenderableContentSection, RenderableContentSectionColumn } from "../core-utils/build/render/types.js";

// date-utils
export type { DateLike } from "../date-utils/build/DateLike.js";
export type { DateStrings } from "../date-utils/build/DateStrings.js";
export type { HasSeasons } from "../date-utils/build/HasSeasons.js";
export type { DayName } from "../date-utils/build/getDayNames.js";
export type { MonthName } from "../date-utils/build/getMonthNames.js";

// error-utils
export type { ErrorLike } from "../error-utils/build/isErrorLike.js";

// game-utils
export type { CharacterBaseCore } from "../game-utils/build/character/CharacterBase.js";
export type { DenominationsCore, CurrencyCore, Denomination, ExchangeRate, CurrencyData, AnyCurrency, ParsableCurrency, CurrencyInstance, CurrencyConstructor } from "../game-utils/build/currency/Currency.js";
export type { StackKey, StackWhereKey, DeckStack, StackCard, DeckPlayArgs, DeckDrawArgs } from "../game-utils/build/deck/Deck.js";
export type { DialogContent } from "../game-utils/build/dialog/DialogContent.js";
export type { NpcDialogType, PcDialogType, OtherDialogType, DialogType } from "../game-utils/build/dialog/DialogType.js";
export type { DialogRegexKey, DialogRegExpMatch } from "../game-utils/build/dialog/matchDialogRegexPair.js";
export type { DiceTestData, DiceTargetData, HasDiceTestData, HasDiceTest } from "../game-utils/build/dice/DiceTest.js";
export type { DiceCore, TDice } from "../game-utils/build/dice/dice/Dice.js";
export type { TDiceBaseCore, DiceBaseCore, TDiceBase } from "../game-utils/build/dice/dice/DiceBase.js";
export type { DiceGroupCoreArgs, DiceGroupCore, TDiceGroup } from "../game-utils/build/dice/dice/DiceGroup.js";
export type { DicePartCoreArgs, DicePartCore, TDicePart } from "../game-utils/build/dice/dice/DicePart.js";
export type { DiceMacroNamedArgPlaceholder, DiceMacroIndexedArgPlaceholder, DiceMacroArgPlaceholder } from "../game-utils/build/dice/macro/parseDiceMacroArgPlaceholder.js";
export type { DiceMacroArgs, DiceMacroParseResults } from "../game-utils/build/dice/macro/parseDiceMacroCall.js";
export type { DiceMacroPrefix } from "../game-utils/build/dice/macro/parseDiceMacroPrefix.js";
export type { MacroBase, DialogMacroBase, DiceMacroBase } from "../game-utils/build/dice/macro/types.js";
export type { DiceDropKeepData } from "../game-utils/build/dice/manipulate/DiceDropKeep.js";
export type { DiceExplodeData } from "../game-utils/build/dice/manipulate/DiceExplode.js";
export type { DiceManipulationArgs, DiceManipulationResults } from "../game-utils/build/dice/manipulate/DiceManipulation.js";
export type { DiceManipulationData } from "../game-utils/build/dice/manipulate/DiceManipulationData.js";
export type { DiceRerollData } from "../game-utils/build/dice/manipulate/DiceReroll.js";
export type { DiceThresholdData } from "../game-utils/build/dice/manipulate/DiceThreshold.js";
export type { StatNumbersOptions, StatNumbersResults, StatResults, StatKey, StatsCharacter, StatsCharacterManager, StatsEncounterManager } from "../game-utils/build/dice/stats/types.js";
export type { ReduceSignToDropKeep, reduceTokenToCore } from "../game-utils/build/dice/token/reduceTokenToDicePartCore.js";
export type { DiceOperator } from "../game-utils/build/dice/types/DiceOperator.js";
export type { RollData } from "../game-utils/build/dice/types/RollData.js";
export type { SimpleDice } from "../game-utils/build/dice/types/SimpleDice.js";
export type { SortedRollData } from "../game-utils/build/dice/types/SortedDataRoll.js";
export type { PostCurrencyUserCountPostType, PostCurrencyIncrementPostType, PostCurrencyIncrement, PostCurrencyUserCount, PostCurrencyDataEvent, PostCurrencyDataTotal, PostCurrencyData, PostCurrency } from "../game-utils/build/postCurrency/types.js";
export type { Weight, CurrencyCoreDnD5e, CurrencyDnD5eArg, CurrencyDnD5e } from "../game-utils/build/systems/dnd5e/currency/CurrencyDnD5e.js";
export type { CurrencyCorePf2e, CurrencyPf2eArg, CurrencyPf2e } from "../game-utils/build/systems/p20/pf2e/currency/CurrencyPf2e.js";
export type { CurrencyCoreSf2e, CurrencySf2eArg, CurrencySf2e } from "../game-utils/build/systems/p20/sf2e/currency/CurrencySf2e.js";
export type { CurrencyCorePf1e, CurrencyPf1eArg, CurrencyPf1e } from "../game-utils/build/systems/pf1e/currency/CurrencyPf1e.js";
export type { CurrencyCoreSF1e, CurrencySF1eArg, CurrencySF1e } from "../game-utils/build/systems/sf1e/currency/CurrencySf1e.js";
export type { ITable, ITableItem, INextTableInfoItem } from "../game-utils/build/tables/table.js";
export type { UnpipeResults } from "../game-utils/build/utils/pipes/unpipe.js";

// git-utils
export type { CommitData } from "../git-utils/build/readCommit.js";
export type { GitRepoData } from "../git-utils/build/readRepo.js";

// id-utils
export type { SnowflakeMatcherResolvable } from "../id-utils/build/snowflake/SnowflakeMatcher.js";
export type { NIL_SNOWFLAKE, Snowflake } from "../id-utils/build/snowflake/types.js";
export type { UuidMatcherResolvable } from "../id-utils/build/uuid/UuidMatcher.js";
export type { NIL_UUID, MAX_UUID, UUID, STRICT_UUID } from "../id-utils/build/uuid/types.js";

// io-utils
export type { DsvDelimiter, DsvResults } from "../io-utils/build/dsv/parseDsv.js";
export type { GetBufferOpts } from "../io-utils/build/https/getBuffer.js";
export type { GetTextOpts } from "../io-utils/build/https/getText.js";
export type { AppServerEndpoint, BufferHandlerJsonError, BufferHandlerResponse, BufferHandler } from "../io-utils/build/https/types.js";
export type { ImageMetadata } from "../io-utils/build/image/bufferToMetadata.js";
export type { PdfJsonFieldTransmuter } from "../io-utils/build/pdf/PdfJsonFieldManager.js";
export type { TextField, CheckField, Field, FieldJson, BoxsetJson, TextJson, PageJson, PdfJson } from "../io-utils/build/pdf/types.js";
export type { VALID_URL, WRAPPED_URL, URL, WrapOptions } from "../io-utils/build/url/types.js";

// json-utils
export type { JsonCleanRules } from "../json-utils/build/cleanJson.js";

// logger-utils
export type { LoggerLike } from "../logger-utils/build/PinoWrapper.js";
export type { SnsTransportOptions } from "../logger-utils/build/createSnsTransport.js";

// map-utils
export type { MapMeta, MapLayerMeta, MapCache, ValidClip } from "../map-utils/build/internal/types.js";
export type { MimeType, HasClip, HasNatural, HasOffset, HasSize, ImageMeta, GameMapLayerImage, GameMapBackgroundImage, GameMapLayerData, GameMapLayer, GameMapData, GameMap, MapRenderPayload, MapRenderResponse } from "../map-utils/build/types.js";

// number-utils
export type { BoundedOptions } from "../number-utils/build/boundNumber.js";

// progress-utils
export type { ProgressTrackerEventName, ProgressTrackerEventData, WithLoggerOptions } from "../progress-utils/build/ProgressTracker.js";

// regexp-utils
export type { RegExpQuantifier, RegExpAnchorOptions, RegExpCaptureOptions, RegExpFlagOptions, RegExpQuantifyOptions, RegExpSpoilerOptions, RegExpWrapOptions } from "../regexp-utils/build/RegExpOptions.js";
export type { TypedRegExpMatchArray, TypedRegExpExecArray, TypedRegExpStringIterator, TypedRegExp } from "../regexp-utils/build/TypedRegExp.js";
export type { RegExpGetOptions } from "../regexp-utils/build/getOrCreateRegExp.js";

// search-utils
export type { TSearchFlag } from "../search-utils/build/SearchInfo.js";
export type { SearchTermData } from "../search-utils/build/SearchScore.js";
export type { Searchable } from "../search-utils/build/Searchable.js";

// string-utils
export type { MaxChunkLengthCallback, ChunkOptions } from "../string-utils/build/chunk.js";
export type { CodeBlockRegexGroups } from "../string-utils/build/codeBlocks/AllCodeBlocksRegExp.js";
export type { SimpleHtmlRegExpExecGroup, SimpleHtmlRegExpExecArray } from "../string-utils/build/html/getSimpleHtmlElementRegex.js";
export type { Flags } from "../string-utils/build/html/internal/helpers.js";
export type { RedactOptions } from "../string-utils/build/redact/RedactOptions.js";
export type { RedactCodeBlocksOptions } from "../string-utils/build/redact/redactCodeBlocks.js";
export type { RedactKeyValuePairsOptions } from "../string-utils/build/redact/redactKeyValuePairs.js";
export type { RedactMdLinksOptions } from "../string-utils/build/redact/redactMdLinks.js";

// token-string-utils
export type { TokenParsers, TokenData } from "../token-string-utils/build/tokenize.js";

// type-utils
export type { MatcherResolvable, Matcher } from "../type-utils/build/Matcher.js";
export type { Saveable } from "../type-utils/build/Saveable.js";
export type { Enum } from "../type-utils/build/enums/Enum.js";
export type { Args, Awaitable, Constructable, EnumLike, If, Optional, OrNull, OrUndefined } from "../type-utils/build/generics.js";
export type { Options } from "../type-utils/build/literals/toLiteral.js";

