import { action, makeObservable, observable } from "mobx";
import { Summary, Recorder } from "./pose/base";

export type StateStatus = 'good' | 'none' | 'bad';

export class State {
    readonly status: StateStatus;
    readonly name: string;
    readonly window: number;
    readonly position: [number, number] | null;
    readonly directional: boolean;

    transitions: Array<{ delay: number, func: (data: Summary) => State }>;
    delays: Array<number>;

    constructor(status: StateStatus, name: string, window: number = 0.1, directional = true) {
        this.status = status;
        this.name = name;
        this.transitions = [];
        this.window = window;
        this.directional = directional;
    }

    to(delay: number, transition: (data: Summary) => State) {
        this.transitions.push({ delay, func: transition });
    }
}

export class Simulation {
    readonly start: State;
    readonly fit: boolean;
    states: Set<State> = new Set();
    mode: State;
    displayMode: State;

    counts: Map<State, number> = new Map();

    constructor(start: State, fit = true) {
        this.fit = fit;
        this.start = start;
        this.reset();
        makeObservable(this, {
            mode: observable.ref,
            displayMode: observable.ref,
            states: observable,
            counts: observable,
            step: action,
            reset: action,
        })
    }

    protected doStep(data: Summary, dt: number) {
        for (let { func } of this.mode.transitions) {
            this.mode = func(data);
            this.states.add(this.mode);
        }
    }

    step(recorder: Recorder, dt: number) {
        let previous = this.mode;
        let data = recorder.summarize(this.mode.window, true, this.fit);
        this.doStep(data, dt);

        if (this.mode !== previous) {
            this.counts.set(this.mode, this.count(this.mode) + 1);
        }

        if (this.displayMode.status != 'bad' || this.mode.status == 'good') {
            this.displayMode = this.mode;
        }
    }

    count(state: State): number {
        return this.counts.get(state) || 0;
    }

    reset() {
        this.counts = new Map();
        this.mode = this.start;
        this.displayMode = this.start;
    }
}

export class FuzzySimulation extends Simulation {
    weights: Map<State, { into: number, out: number }> = new Map();

    private take(state: State, alpha: number, dt: number): number {
        let weights = this.weights.get(state);
        if (weights != null) {
            let from_state = weights.out * alpha * dt;
            if (from_state > 0.75 * weights.out) {
                from_state = 0.75 * weights.out;
            }
            weights.out -= from_state;
            return from_state;
        } else {
            return 0;
        }
    }

    private put(state: State, weight: number, input: boolean) {
        let weights = this.weights.get(state);
        if (weights != null) {
            if (state.directional && input) {
                weights.into += weight;
            } else {
                weights.out += weight;
            }
        } else {
            if (state.directional && input) {
                this.weights.set(state, { into: weight, out: 0 });
            } else {
                this.weights.set(state, { into: 0, out: weight });
            }
        }
    }

    doStep(data: Summary, dt: number) {
        for (let state of this.weights.keys()) {
            for (let { delay, func } of state.transitions) {
                let next = func(data);

                // x(0) = state.measure
                // x(delay) = state.measure / 2
                // x' = -a * x
                // ...implies...
                // x(t) = state.measure * e^(-a * t)
                // a = 0.693147 / delay
                this.put(next, this.take(state, 0.693147 / delay, dt), next !== state);
            }
        }

        let max_weight = 0;
        for (let [state, { into, out }] of this.weights) {
            let weight = into + out;
            if (weight > max_weight) {
                max_weight = weight;
                this.mode = state;
            }
        }

        let { into, out } = this.weights.get(this.mode) || { into: 0, out: 0 };
        this.weights.set(this.mode, { into: 0, out: into + out });
    }

    reset() {
        super.reset();
        this.weights = new Map();
        this.weights.set(this.start, { into: 0, out: 1 });
    }
}

export function signToState(val: number, margin: number, positive: State, negative: State, zero: State): State {
    if (val >= margin) {
        return positive;
    } else if (val <= -margin) {
        return negative;
    } else {
        return zero;
    }
}
