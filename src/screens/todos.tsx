import { action, autorun, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { Component } from "react";
import { Form, ListGroup, Container, Button } from "react-bootstrap";

interface TodoItem {
    id: any,
    text: string,
}

export class Todos {
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
export class TodoApp extends Component<{ todos: Todos }> {
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
