import type { ViewState } from "@/lib/data/types";

export interface AppStore {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}

export function createStore() {
  return {} as AppStore;
}