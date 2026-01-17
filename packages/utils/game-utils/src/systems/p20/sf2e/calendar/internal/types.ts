export type MonthName = keyof typeof MonthType;
export enum MonthType { Abadius, Calistril, Pharast, Gozran, Desnus, Sarenith, Erastus, Arodus, Rova, Lamashan, Neth, Kuthona }
export const MonthTypes = [MonthType.Abadius, MonthType.Calistril, MonthType.Pharast, MonthType.Gozran, MonthType.Desnus, MonthType.Sarenith, MonthType.Erastus, MonthType.Arodus, MonthType.Rova, MonthType.Lamashan, MonthType.Neth, MonthType.Kuthona];
export const Months = ["Abadius", "Calistril", "Pharast", "Gozran", "Desnus", "Sarenith", "Erastus", "Arodus", "Rova", "Lamashan", "Neth", "Kuthona"] as const;

export type DayName = keyof typeof DayType;
export enum DayType { Firstday, Seconday, Thirday, Fourthday, Fifthday, Sixthday, Seventhday }
export const DayTypes = [DayType.Firstday, DayType.Seconday, DayType.Thirday, DayType.Fourthday, DayType.Fifthday, DayType.Sixthday, DayType.Seventhday];
export const Days = ["Firstday", "Seconday", "Thirday", "Fourthday", "Fifthday", "Sixthday", "Seventhday"] as const;
export const DaysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
