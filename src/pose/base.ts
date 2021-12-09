import { Vector3 } from "@math.gl/core";
import { LandmarkList, NormalizedLandmarkList, POSE_LANDMARKS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_NEUTRAL, POSE_LANDMARKS_RIGHT } from "@mediapipe/pose";

export type LandmarkName = keyof typeof POSE_LANDMARKS_NEUTRAL | keyof typeof POSE_LANDMARKS_LEFT | keyof typeof POSE_LANDMARKS_RIGHT;
export let LANDMARK_NAMES = [...Object.keys(POSE_LANDMARKS)] as LandmarkName[];

export interface Sample {
    t: number,
    timestamp: Date,
    worldPose: LandmarkList,
    screenPose: NormalizedLandmarkList,
}

export interface Fit {
    delay: number,
    mean_t: number,
    mean: number,
    slope: number,
}

export interface Summary {
    pos: { [name in LandmarkName]: Vector3 },
    vel: { [name in LandmarkName]: Vector3 },
}

type LandmarkElem = 'x' | 'y' | 'z' | 't' | 'visibility';

function hasVisibleHeel(sample: Sample) {
    let left = sample.worldPose[POSE_LANDMARKS_LEFT.LEFT_HEEL].visibility;
    let right = sample.worldPose[POSE_LANDMARKS_RIGHT.RIGHT_HEEL].visibility;
    return left != null && right != null && left > 0.5 && right > 0.5
}

export class Recorder implements Iterable<Sample> {
    private buffer: Sample[] = [];
    private size: number;
    private start = 0;
    private visibleHealCount: number = 0;

    constructor(size: number) {
        this.size = size;
    }

    push(x: Sample) {
        if (this.buffer.length < this.size) {
            this.buffer.push(x);
        } else {
            if (hasVisibleHeel(this.buffer[this.start])) {
                this.visibleHealCount -= 1;
            }
            this.buffer[this.start] = x;
            this.start = (this.start + 1) % this.size;
        }
        if (hasVisibleHeel(x)) {
            this.visibleHealCount += 1;
        }
    }

    last(): Sample | null {
        let i = this.start;
        if (i == 0) {
            i = this.buffer.length;
        }

        if (i == 0) {
            return null;
        } else {
            return this.buffer[i - 1];
        }
    }

    list(names: LandmarkName | LandmarkName[], element: LandmarkElem, world = true, tail?: number): Float32Array {
        if (!Array.isArray(names)) {
            names = [names]
        }

        let iter: Iterable<Sample>;
        let out: Float32Array;
        if (tail != undefined) {
            iter = this.slice(this.length - tail, this.length);
            out = new Float32Array(Math.min(tail, this.length) * names.length);
        } else {
            iter = this;
            out = new Float32Array(this.length * names.length);
        }

        let i = 0;
        for (let name of names) {
            let index = POSE_LANDMARKS[name];
            if (element == 't') {
                for (let sample of iter) {
                    out[i] = sample.t;
                    i++;
                }
            } else if (world) {
                for (let sample of iter) {
                    out[i] = sample.worldPose[index][element] || 0;
                    if (this.relativeToHeel) {
                        out[i] -= (
                            sample.worldPose[POSE_LANDMARKS_LEFT.LEFT_HEEL][element]! +
                            sample.worldPose[POSE_LANDMARKS_RIGHT.RIGHT_HEEL][element]!
                        ) / 2;
                    }
                    if (element == 'y') {
                        out[i] *= -1;
                    }
                    i++;
                }
            } else {
                for (let sample of iter) {
                    out[i] = sample.screenPose[index][element] || 0;
                    i++;
                }
            }
        }
        return out;
    }

    fit(name: LandmarkName | LandmarkName[], element: LandmarkElem, delay: number, world = true): Fit {
        let ts = this.list(name, 't', world);
        let vs = this.list(name, 'visibility', world);
        let xs = this.list(name, element, world);
        let n = xs.length;
        if (n == 0) {
            throw Error('no data');
        }

        let end_t = ts[n - 1];
        let mean_t = end_t - delay;
        let lambda = 1 / delay;

        let weight_sum = 0;

        let mean = 0;
        for (let i = 0; i < n; i++) {
            let weight = lambda * Math.exp(lambda * (ts[i] - end_t)) * vs[i];
            mean += weight * xs[i];
            weight_sum += weight;
        }
        mean /= weight_sum;

        let covariance = 0;
        for (let i = 0; i < n; i++) {
            let weight = lambda * Math.exp(lambda * (ts[i] - end_t)) * vs[i];
            covariance += weight * (xs[i] - mean) * (ts[i] - mean_t);
        }
        covariance /= weight_sum;

        return {
            delay,
            mean_t,
            mean,
            slope: covariance / (delay * delay),
        };
    }

    diff(name: LandmarkName, element: LandmarkElem, world = true): Fit {
        let ts = this.list(name, 't', world, 2);
        let xs = this.list(name, element, world, 2);
        if (xs.length != 2) {
            throw Error('no data');
        }

        let mean_t = (ts[0] + ts[1]) / 2;

        return {
            delay: ts[1] - mean_t,
            mean_t,
            mean: (xs[0] + xs[1]) / 2,
            slope: (xs[1] - xs[0]) / (ts[1] - ts[0]),
        }
    }

    summarize(delay: number, world = true, fit = true): Summary {
        let pos: any = {};
        let vel: any = {};
        for (let name of LANDMARK_NAMES) {
            let x, y, z;
            if (fit) {
                x = this.fit(name, 'x', delay, world);
                y = this.fit(name, 'y', delay, world);
                z = this.fit(name, 'z', delay, world);
            } else {
                x = this.diff(name, 'x', world);
                y = this.diff(name, 'y', world);
                z = this.diff(name, 'z', world);
            }
            pos[name] = new Vector3(x.mean, y.mean, z.mean);
            vel[name] = new Vector3(x.slope, y.slope, z.slope);
        }

        return { pos, vel };
    }

    get length(): number {
        return this.buffer.length;
    }

    get relativeToHeel(): boolean {
        return this.visibleHealCount >= 0.9 * this.length;
    }

    slice(start: number, end: number): Iterable<Sample> {
        let self = this;
        return {
            *[Symbol.iterator]() {
                for (let i = Math.max(start, 0); i < Math.min(end, self.length); i++) {
                    yield self.buffer[(self.start + i) % self.buffer.length];
                }
            }
        };
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this.buffer.length; i++) {
            yield this.buffer[(this.start + i) % this.buffer.length];
        }
    }
}

export interface SimLogger {
    logging: boolean;
    toggleLog();
    clearLog();
    log(sim: string, state: string, weight: number, count: number);
    downloadLog();
}
