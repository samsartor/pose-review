import { computed, makeObservable, observable } from "mobx";

export type StanceVariations = "wide" | "moderate" | "narrow";

export class ConfigData {
    stance: StanceVariations = "moderate";

    constructor() {
        makeObservable(this, {
            stance: observable,
        });
    }
}

export let SQUAT_CONFIG = new ConfigData();
