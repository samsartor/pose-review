import { Summary, Recorder } from "./pose/base";

export type StateStatus = 'good' | 'none' | 'bad';

export class State {
    readonly status: StateStatus;
    readonly name: string;
    readonly window: number;

    transitions: Array<(data: Summary) => State>;

    constructor(status: StateStatus, name: string, window: number = 0.1) {
        this.status = status;
        this.name = name;
        this.transitions = [];
        this.window = window;
    }

    to(transition: (data: Summary) => State) {
        this.transitions.push(transition);
    }
}

export class Simulation {
    readonly start: State;
    states: Set<State> = new Set();
    mode: State;

    constructor(start: State) {
        this.start = start;
        this.reset();
    }

    step(recorder: Recorder, dt: number) {
        let data = recorder.summarize(this.mode.window, true);
        for (let func of this.mode.transitions) {
            this.mode = func(data);
        }
    }

    reset() {
        this.mode = this.start;
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
