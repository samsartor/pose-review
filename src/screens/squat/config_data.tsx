import { action, computed, makeObservable, observable } from "mobx";

export type StanceVariations = "wide" | "moderate" | "narrow";

export class ConfigData {
    stance: StanceVariations = "moderate";

    constructor() {
        makeObservable(this, {
            stance: observable,
            setStance: action,
        });
    }

    setStance(stance: StanceVariations) {
        this.stance = stance;
    }
}

export let SQUAT_CONFIG = new ConfigData();
