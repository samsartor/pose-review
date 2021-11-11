import { LandmarkList, NormalizedLandmarkList, POSE_LANDMARKS } from "@mediapipe/pose";

export type LandmarkName = keyof typeof POSE_LANDMARKS;
export let LANDMARK_NAMES = [...Object.keys(POSE_LANDMARKS)] as LandmarkName[];

export interface Sample {
    t: number,
    timestamp: Date,
    pose: LandmarkList,
    normedPose: NormalizedLandmarkList,
}

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

    list(name: LandmarkName, element: 'x' | 'y' | 'z' | 'vis'): Float32Array {
        let out = new Float32Array(this.buffer.length);
        let i = 0;
        let index = POSE_LANDMARKS[name];
        for (let sample of this) {
            if (element == 'vis') {
                out[i] = sample.pose[index].visibility || 0;
            } else {
                out[i] = sample.pose[index][element];
            }
            i++;
        }
        return out;
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

