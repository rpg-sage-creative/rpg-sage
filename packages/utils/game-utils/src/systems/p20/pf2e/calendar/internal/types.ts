export type MonthName = keyof typeof MonthType;
export enum MonthType { Abadius, Calistril, Pharast, Gozran, Desnus, Sarenith, Erastus, Arodus, Rova, Lamashan, Neth, Kuthona }
export const MonthTypes = [MonthType.Abadius, MonthType.Calistril, MonthType.Pharast, MonthType.Gozran, MonthType.Desnus, MonthType.Sarenith, MonthType.Erastus, MonthType.Arodus, MonthType.Rova, MonthType.Lamashan, MonthType.Neth, MonthType.Kuthona];
export const Months = ["Abadius", "Calistril", "Pharast", "Gozran", "Desnus", "Sarenith", "Erastus", "Arodus", "Rova", "Lamashan", "Neth", "Kuthona"] as const;

export type DayName = keyof typeof DayType;
export enum DayType { Sunday, Moonday, Toilday, Wealday, Oathday, Fireday, Starday }
export const DayTypes = [DayType.Sunday, DayType.Moonday, DayType.Toilday, DayType.Wealday, DayType.Oathday, DayType.Fireday, DayType.Starday];
export const Days = ["Sunday", "Moonday", "Toilday", "Wealday", "Oathday", "Fireday", "Starday"] as const;
export const DaysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
