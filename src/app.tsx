import { render } from "react-dom";
import { Component, createRef } from "react";
import { Container, Form, Button, ListGroup, Nav } from "react-bootstrap";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Routes, Route } from "react-router";
import { Poser, poser } from "./poser";

interface PoseAppState {
    poseStatus: string,
}
class PoseApp extends Component<{}, PoseAppState> {
    canvas = createRef<HTMLCanvasElement>();
    poser: Poser;

    constructor(props) {
        super(props);
        this.poser = poser();
    }

    componentDidMount() {
        this.poser.setCanvas(this.canvas.current);
    }

    render() {
        return <Container>
            <h2>Pose Review</h2>
            <canvas width="1280px" height="720px" ref={this.canvas}></canvas>
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
    <BrowserRouter>
        <Nav as="ul">
            <Nav.Item as="li">
                <Nav.Link as={NavLink} to="/">Pose</Nav.Link>
            </Nav.Item>
            <Nav.Item as="li">
                <Nav.Link as={NavLink} to="/todos">TODO</Nav.Link>
            </Nav.Item>
        </Nav>
        <Routes>
            <Route path="/" element={<PoseApp />} />
            <Route path="/todos" element={<TodoApp />} />
        </Routes>
    </BrowserRouter>,
    document.getElementById('app')
);
