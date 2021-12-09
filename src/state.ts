import { action, makeObservable, observable } from "mobx";
import { Summary, Recorder, SimLogger } from "./pose/base";

export type StateStatus = 'good' | 'none' | 'bad';

interface Transition {
    delay: number,
    func: (data: Summary) => State,
}

export class State {
    readonly status: StateStatus;
    readonly name: string;
    readonly window: number;
    readonly position: [number, number] | null;
    readonly directional: boolean;

    transitions: Array<Transition> = [];

    constructor(status: StateStatus, name: string, window: number = 0.1, directional = true) {
        this.status = status;
        this.name = name;
        this.window = window;
        this.directional = directional;
    }

    to(delay: number, transition: (data: Summary) => State) {
        this.transitions.push({ delay, func: transition });
    }
}

export class Simulation {
    readonly name: string;
    readonly start: State;
    readonly fit: boolean;
    states: Set<State>;
    mode: State;
    displayMode: State;

    counts: Map<State, number> = new Map();

    constructor(name: string, start: State, fit = true) {
        this.name = name;
        this.fit = fit;
        this.start = start;
        this.states = new Set([start]);
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

    weight(state: State): number {
        if (state === this.mode) {
            return 1;
        } else {
            return 0;
        }
    }

    step(recorder: Recorder, dt: number, logger: SimLogger) {
        let previous = this.mode;
        let data = recorder.summarize(this.mode.window, true, this.fit);
        this.doStep(data, dt);

        if (this.mode !== previous) {
            this.counts.set(this.mode, this.count(this.mode) + 1);
        }

        if (this.mode.status == 'good' || this.mode.status == 'bad' || this.displayMode.status == 'none') {
            this.displayMode = this.mode;
        }

        for (let state of this.states) {
            logger.log(this.name, state.name, this.weight(state), this.count(state));
        }
    }

    count(state: State): number {
        return this.counts.get(state) || 0;
    }

    reset(counts = true) {
        if (counts) {
            this.counts = new Map();
        }
        this.mode = this.start;
        this.displayMode = this.start;
    }
}

function multMax(a: number, b: number): number {
    let x = a * b;
    if (x > a) {
        x = a;
    }
    return x;
}
export class FuzzySimulation extends Simulation {
    weights: Map<State, { front: number, back: number }> = new Map();
    outputs: Map<Transition, Set<State>> = new Map();

    private take(state: State, alpha: number, dt: number, front: boolean): number {
        let weights = this.weights.get(state);
        if (weights != null) {
            if (front) {
                let from_state = multMax(weights.front, alpha * dt);
                weights.front -= from_state;
                return from_state;
            } else {
                let from_state = multMax(weights.back, alpha * dt);
                weights.back -= from_state;
                return from_state;
            }
        } else {
            return 0;
        }
    }

    private put(state: State, weight: number, front: boolean) {
        let weights = this.weights.get(state);
        if (weights != null) {
            if (state.directional && front) {
                weights.front += weight;
            } else {
                weights.back += weight;
            }
        } else {
            if (state.directional && front) {
                this.weights.set(state, { front: weight, back: 0 });
            } else {
                this.weights.set(state, { front: 0, back: weight });
            }
        }
    }

    weight(state: State): number {
        let { front, back } = this.weights.get(state) || { front: 0, back: 0 };
        return front + back;
    }

    doStep(data: Summary, dt: number) {
        for (let state of this.weights.keys()) {
            for (let trans of state.transitions) {
                let outputs = this.outputs.get(trans);
                if (outputs == null) {
                    outputs = new Set([state]);
                    this.outputs.set(trans, outputs);
                }

                let next = trans.func(data);
                outputs.add(next);
                this.states.add(next);

                // x(0) = state.measure
                // x(delay) = state.measure / 2
                // x' = -a * x
                // ...implies...
                // x(t) = state.measure * e^(-a * t)
                // a = 0.693147 / delay
                let alpha = 0.693147 / trans.delay;
                let to_redistribute = 0;
                for (let out of outputs) {
                    to_redistribute += this.take(out, alpha, dt, out !== state);
                }
                this.put(next, to_redistribute, next !== state);
            }
        }

        let max_weight = 0;
        for (let [state, { front, back }] of this.weights) {
            let weight = front + back;
            if (weight > max_weight) {
                max_weight = weight;
                this.mode = state;
            }
        }

        let { front, back } = this.weights.get(this.mode) || { front: 0, back: 0 };
        this.weights.set(this.mode, { front: 0, back: front + back });
    }

    reset(counts = true) {
        super.reset(counts);
        this.weights = new Map();
        this.weights.set(this.start, { front: 0, back: 1 });
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
