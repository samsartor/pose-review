import { Summary } from "./pose/base";

export type StateStatus = 'good' | 'warn' | 'bad';

export class State {
    readonly status: StateStatus;
    readonly name: string;

    measure: number;
    total: number;

    constructor(status: StateStatus, name: string) {
        this.status = status;
        this.name = name;
        this.reset();
    }

    start(measure = 1) {
        this.measure = measure;
        this.total = 0;
    }

    reset() {
        this.measure = 0;
        this.total = 0;
    }
}

export type States = State | State[] | Map<State, number>;

function divideUpValue(states: States, value: number, normalize: boolean, each: (state: State, value: number) => void) {
    if (states instanceof State) {
        each(states, value);
    } else if (Array.isArray(states)) {
        for (let state of states) {
            if (normalize) {
                each(state, value / states.length);
            } else {
                each(state, value);
            }
        }
    } else {
        let total_weight = 0;
        if (normalize) {
            for (let weight of states.values()) {
                total_weight += weight;
            }
        } else {
            total_weight += 1;
        }
        for (let [state, weight] of states) {
            each(state, weight / total_weight * value);
        }
    }
}

export interface Edge {
    from: States,
    to(data: Summary): States,
    // How long it will take to move 50% from A to B
    delay: number,
}

export class Simulation {
    edges: Set<Edge> = new Set();
    states: Set<State> = new Set();

    connect(edge: Edge) {
        this.edges.add(edge);
        divideUpValue(edge.from, 0, false, state => this.states.add(state));
    }

    get mode(): State {
        let max_measure = 0;
        let max_state: State | null = null;
        for (let state of this.states) {
            if (state.measure > max_measure) {
                max_state = state;
                max_measure = state.measure;
            }
        }
        return max_state!;
    }

    step(data: Summary, dt: number) {
        for (let { from, to, delay } of this.edges) {
            let to_states = to(data);
            if ((Array.isArray(to_states) && to_states.length == 0) || (to_states instanceof Map && to_states.size == 0)) {
                continue;
            }

            // x(0) = state.measure
            // x(delay) = state.measure / 2
            // x' = -a * x
            // ...implies...
            // x(t) = state.measure * e^(-a * t)
            // a = 0.693147 / delay
            let alpha = 0.693147 / delay;

            // Calculate how much measure is leaving each state to be
            // redistributed by this edge.
            let to_redistribute = 0;
            divideUpValue(from, alpha, false, (state, alpha) => {
                let from_state = state.measure * alpha * dt;
                // Technically this allows the measure to go negative, but that
                // should be self-correcting.
                state.measure -= from_state;
                // Redistribute to other states.
                to_redistribute += from_state;
            })

            // Figure out how much should be distributed to each state.
            divideUpValue(to_states, to_redistribute, true, (state, measure) => {
                this.states.add(state);
                state.measure += measure;
            });
        }

        for (let state of this.states) {
            state.total += state.measure * dt;
        }
    }
}

export function signToState(val: number, positive: States, negative: States, zero: States = [], margin = 0.1): States {
    if (val >= margin) {
        return positive;
    } else if (val <= -margin) {
        return negative;
    } else {
        return zero;
    }
}
