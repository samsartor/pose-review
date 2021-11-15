import { render } from "react-dom";
import { Nav } from "react-bootstrap";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Routes, Route } from "react-router";
import { Todos, TodoApp } from "./screens/todos";
import { PoseApp } from "./screens/pose";
import { ViolinApp } from "./screens/violin";
import { Component } from "react";
import { observer } from "mobx-react";
import { POSER } from "./pose";

const todos = new Todos();
let basename = '/';
console.log(location.origin);
if (location.origin == 'gh.samsartor.com') {
    basename = '/pose-review';
}

@observer
class App extends Component {
    render() {
        return <BrowserRouter basename={basename}>
            <Nav as="ul">
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/">Pose</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/violin">Violin</Nav.Link>
                </Nav.Item>
                <Nav.Item as="li">
                    <Nav.Link as={NavLink} to="/todos">TODO</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link disabled>Status: {POSER.status}</Nav.Link>
                </Nav.Item>
            </Nav>
            <Routes>
                <Route path="/" element={<PoseApp />} />
                <Route path="/todos" element={<TodoApp todos={todos} />} />
                <Route path="/violin" element={<ViolinApp />} />
            </Routes>
        </BrowserRouter>;
    }
}

render(<App />, document.getElementById('app'));
