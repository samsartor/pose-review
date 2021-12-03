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

// .--------------------------------------------.
// | oneway | ratio | after delay | eventually  |
// |        |       | A    | B    | A    | B    |
// |--------|-------|------|------|------|------|
// | *      | 0.0   |######|      |######|      |
// | false  | 0.5   |##### |#     |###   |###   |
// | true   | 0.5   |####  |##    |      |######|
// | *      | 1.0   |###   |###   |      |######|
// .--------------------------------------------.
export interface Edge {
    a: State,
    b: State,
    // How long it will take to move 50% of A to B when ratio=1
    delay: number,
    // True if B can _not_ move to A when ratio=0
    oneway?: boolean,
    // The fraction which should move to B vs move to A
    ratio(data: Summary): number,
}

export class Simulation {
    edges: Set<Edge> = new Set();
    states: Set<State> = new Set();

    connect(edge: Edge) {
        this.edges.add(edge);
        this.states.add(edge.a);
        this.states.add(edge.b);
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
        for (let { a, b, delay, oneway, ratio } of this.edges) {
            // x(0) = state.measure
            // x(delay) = state.measure / 2
            // x' = -a * x
            // ...implies...
            // x(t) = state.measure * e^(-a * t)
            // a = 0.693147 / delay
            let alpha = 0.693147 / delay;

            // Calculate how much measure is leaving each state to be
            // redistributed by this edge.
            let from_a = a.measure * alpha * dt;
            let from_b: number;
            if (oneway) {
                from_b = 0;
            } else {
                from_b = b.measure * alpha * dt;
            }

            // Technically this allows the measure to go negative, but that
            // should be self-correcting.
            a.measure -= from_a;
            b.measure -= from_b;

            // Redistribute combined measure.
            let r = ratio(data);
            let m = from_a + from_b;
            b.measure += m * r;
            a.measure += m * (1 - r);
        }

        for (let state of this.states) {
            state.total += state.measure * dt;
        }
    }
}
