import { render } from "react-dom";
import { Component, createRef } from "react";
import { Container, Form, Button, ListGroup } from "react-bootstrap";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose, POSE_CONNECTIONS, Results as PoseResults } from "@mediapipe/pose"
import { Camera } from "@mediapipe/camera_utils";

class PoseInfo {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, grid: HTMLDivElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  update(results: PoseResults) {
    if (!results.poseLandmarks) {
      // this.grid.updateLandmarks([]);
      return;
    }

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(results.segmentationMask, 0, 0,
      this.canvas.width, this.canvas.height);

    // Only overwrite existing pixels.
    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Only overwrite missing pixels.
    this.ctx.globalCompositeOperation = 'destination-atop';
    this.ctx.drawImage(
      results.image, 0, 0, this.canvas.width, this.canvas.height);

    this.ctx.globalCompositeOperation = 'source-over';
    drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS,
      { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(this.ctx, results.poseLandmarks,
      { color: '#FF0000', lineWidth: 2 });
    this.ctx.restore();

    // this.grid.updateLandmarks(results.poseWorldLandmarks);
  }
}

// Mediapipe needs to be able to find all of these files. By importing them here
// with `require(..)` we make sure parcel crates URLs for them.
const POSE_FILES = {
  'pose_landmark_full.tflite': require('url:@mediapipe/pose/pose_landmark_full.tflite'),
  'pose_landmark_heavy.tflite': require('url:@mediapipe/pose/pose_landmark_heavy.tflite'),
  'pose_landmark_lite.tflite': require('url:@mediapipe/pose/pose_landmark_lite.tflite'),
  'pose_solution_packed_assets_loader.js': require('url:@mediapipe/pose/pose_solution_packed_assets_loader.js'),
  'pose_solution_packed_assets.data': require('url:@mediapipe/pose/pose_solution_packed_assets.data'),
  'pose_solution_simd_wasm_bin.data': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.data'),
  'pose_solution_simd_wasm_bin.js': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.js'),
  'pose_solution_simd_wasm_bin.wasm': require('url:@mediapipe/pose/pose_solution_simd_wasm_bin.wasm'),
  'pose_solution_wasm_bin.js': require('url:@mediapipe/pose/pose_solution_wasm_bin.js'),
  'pose_solution_wasm_bin.wasm': require('url:@mediapipe/pose/pose_solution_wasm_bin.wasm'),
  'pose_web.binarypb': require('url:@mediapipe/pose/pose_web.binarypb'),
};

interface PoseAppState {
  poseStatus: string,
}

class PoseApp extends Component<{}, PoseAppState> {
  canvas = createRef<HTMLCanvasElement>();
  grid = createRef<HTMLDivElement>();
  video = createRef<HTMLVideoElement>();
  info: PoseInfo | null = null;
  pose: Pose | null = null;

  constructor(props) {
    super(props);
    this.state = {
      poseStatus: 'Not yet loaded.',
    };
  }

  componentDidMount() {
    this.info = new PoseInfo(this.canvas.current, this.grid.current);
    this.pose = new Pose({
      locateFile: path => POSE_FILES[path],
    });
    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    this.pose.onResults(r => this.info.update(r));
    this.pose.initialize()
      .then(() => this.setState({ poseStatus: 'Loaded.' }))
      .catch(e => {
        console.error(e);
        this.setState({ poseStatus: `Error ${e}` })
      });
    const camera = new Camera(this.video.current, {
      onFrame: async () => {
        await this.pose.send({ image: this.video.current });
      },
      width: 1280,
      height: 720
    });
    camera.start();
  }

  render() {
    return <Container>
      <h2>Pose Review</h2>
      <p>{this.state.poseStatus}</p>
      <video ref={this.video}></video>
      <canvas width="1280px" height="720px" ref={this.canvas}></canvas>
      <div ref={this.grid}></div>
    </Container>;
  }
}

class TodoApp extends Component<{}, { items: Item[], text: string }> {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '' };
  }

  render() {
    return (
      <Container>
        <h3>TODO</h3>
        <TodoList items={this.state.items} />
        <Form onSubmit={this.handleSubmit}>
          <Form.Group>
            <Form.Label>
              What needs to be done?
            </Form.Label>
            <Form.Control
              onChange={e => this.setState({ text: e.target.value })}
              value={this.state.text}
            />
          </Form.Group>

          <Button type="submit">
            Add #{this.state.items.length + 1}
          </Button>
        </Form>
      </Container >
    );
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.state.text.length === 0) {
      return;
    }
    this.setState(state => ({
      items: state.items.concat({
        text: this.state.text,
        id: Date.now(),
      }),
      text: ''
    }));
  }
}

interface Item {
  id: any,
  text: string,
}

class TodoList extends Component<{ items: Item[] }> {
  render() {
    return (
      <ListGroup>
        {
          this.props.items.map(item => (
            <ListGroup.Item key={item.id}>{item.text}</ListGroup.Item>
          ))
        }
      </ListGroup>
    );
  }
}

render(
  <PoseApp />,
  document.getElementById('pose')
);

render(
  <TodoApp />,
  document.getElementById('todos')
);
