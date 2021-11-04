import { render } from "react-dom";
import { Component } from "react";
import { Container, Form, Button, ListGroup } from "react-bootstrap";

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
    <TodoApp />,
    document.getElementById('application')
);
