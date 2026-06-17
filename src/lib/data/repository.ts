import type { DataResult, PeriodConstellation } from "./types";

export interface Repository {
  getPeriods(): Promise<DataResult<PeriodConstellation[]>>;
  getPeriodById(id: string): Promise<DataResult<PeriodConstellation>>;
}