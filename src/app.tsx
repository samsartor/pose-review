import { render } from "react-dom";
import { Component, createContext, createRef, useContext } from "react";
import { Container, Form, Button, ListGroup, Nav } from "react-bootstrap";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Routes, Route } from "react-router";
import { poser } from "./poser";
import { observable, action, autorun, makeObservable } from "mobx";
import { observer } from "mobx-react";


@observer
class PoseApp extends Component {
    canvas = createRef<HTMLCanvasElement>();

    componentDidMount() {
        poser().setCanvas(this.canvas.current!);
    }

    render() {
        return <Container>
            <h2>Pose Review</h2>
            <p>{poser().status}</p>
            <canvas width="1280px" height="720px" ref={this.canvas}></canvas>
        </Container>;
    }
}

interface TodoItem {
    id: any,
    text: string,
}

class Todos {
    items: TodoItem[] = [];
    draft = '';

    constructor() {
        makeObservable(this, {
            items: observable,
            draft: observable,
            addTodo: action,
            setDraft: action,
        });
        autorun(() => console.log(this.items.map(item => `- ${item.text}`).join('\n')));
    }

    addTodo() {
        this.items.push({
            id: Date.now(),
            text: this.draft,
        });
        this.draft = '';
    }

    setDraft(draft: string) {
        this.draft = draft;
    }
}

@observer
class TodoList extends Component<{ items: TodoItem[] }> {
    render() {
        return <ListGroup>
            {
                this.props.items.map(item => (
                    <ListGroup.Item key={item.id}>{item.text}</ListGroup.Item>
                ))
            }
        </ListGroup>;
    }
};

@observer
class TodoApp extends Component<{ todos: Todos }> {
    render() {
        let t = this.props.todos;

        function handleSubmit(e) {
            e.preventDefault();
            t.addTodo();
        }

        return (
            <Container>
                <h3>TODO</h3>
                <p>You have {t.items.length} tasks to do.</p>
                <TodoList items={t.items} />
                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>
                            What needs to be done?
                        </Form.Label>
                        <Form.Control
                            onChange={e => t.setDraft(e.target.value)}
                            value={t.draft}
                        />
                    </Form.Group>

                    <Button type="submit">
                        Add task #{t.items.length + 1}
                    </Button>
                </Form>
            </Container >
        );
    }
};

const todos = new Todos();

render(
    <BrowserRouter basename={location.pathname}>
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
            <Route path="/todos" element={<TodoApp todos={todos} />} />
        </Routes>
    </BrowserRouter>,
    document.getElementById('app')
);
