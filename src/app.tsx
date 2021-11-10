import { render } from "react-dom";
import { Nav } from "react-bootstrap";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Routes, Route } from "react-router";
import { Todos, TodoApp } from "./screens/todos";
import { PoseApp } from "./screens/pose";

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
