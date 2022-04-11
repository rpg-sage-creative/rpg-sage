export type TMonthType = keyof typeof MonthType;
export enum MonthType { Abadius, Calistril, Pharast, Gozran, Desnus, Sarenith, Erastus, Arodus, Rova, Lamashan, Neth, Kuthona }
export const MonthTypes = [MonthType.Abadius, MonthType.Calistril, MonthType.Pharast, MonthType.Gozran, MonthType.Desnus, MonthType.Sarenith, MonthType.Erastus, MonthType.Arodus, MonthType.Rova, MonthType.Lamashan, MonthType.Neth, MonthType.Kuthona];
export const Months: TMonthType[] = ["Abadius", "Calistril", "Pharast", "Gozran", "Desnus", "Sarenith", "Erastus", "Arodus", "Rova", "Lamashan", "Neth", "Kuthona"];

export type TDayType = keyof typeof DayType;
export enum DayType { Firstday, Seconday, Thirday, Fourthday, Fifthday, Sixthday, Seventhday }
export const DayTypes = [DayType.Firstday, DayType.Seconday, DayType.Thirday, DayType.Fourthday, DayType.Fifthday, DayType.Sixthday, DayType.Seventhday];
export const Days: TDayType[] = ["Firstday", "Seconday", "Thirday", "Fourthday", "Fifthday", "Sixthday", "Seventhday"];
export const DaysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
