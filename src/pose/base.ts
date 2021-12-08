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

export class Recorder implements Iterable<Sample> {
    private buffer: Sample[] = [];
    private size: number;
    private start = 0;

    constructor(size: number) {
        this.size = size;
    }

    push(x: Sample) {
        if (this.buffer.length < this.size) {
            this.buffer.push(x);
        } else {
            this.buffer[this.start] = x;
            this.start = (this.start + 1) % this.size;
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

    list(name: LandmarkName, element: LandmarkElem, world = true): Float32Array {
        let out = new Float32Array(this.buffer.length);
        let i = 0;
        let index = POSE_LANDMARKS[name];
        if (element == 't') {
            for (let sample of this) {
                out[i] = sample.t;
                i++;
            }
        } else if (world) {
            for (let sample of this) {
                out[i] = sample.worldPose[index][element] || 0;
                i++;
            }
        } else {
            for (let sample of this) {
                out[i] = sample.screenPose[index][element] || 0;
                i++;
            }
        }
        return out;
    }

    fit(name: LandmarkName, element: LandmarkElem, delay: number, world = true): Fit {
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

    summarize(delay: number, world = true): Summary {
        let pos: any = {};
        let vel: any = {};
        for (let name of LANDMARK_NAMES) {
            let x = this.fit(name, 'x', delay, world);
            let y = this.fit(name, 'y', delay, world);
            let z = this.fit(name, 'z', delay, world);
            pos[name] = new Vector3(x.mean, -y.mean, z.mean);
            vel[name] = new Vector3(x.slope, -y.slope, z.slope);
        }
        return { pos, vel };
    }

    get length(): number {
        return this.buffer.length;
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < this.buffer.length; i++) {
            yield this.buffer[(this.start + i) % this.buffer.length];
        }
    }
}

