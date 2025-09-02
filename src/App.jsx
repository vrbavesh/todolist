import React from "react";
import { useAuth } from "./AuthContext";
import Login from "./Login";
import TodoApp from "./TodoApp";

export default function App() {
  const { user } = useAuth();


  if (user === undefined) return <div style={{ padding: 20 }}>checking auth…</div>;

  return user ? <TodoApp /> : <Login />;
}
