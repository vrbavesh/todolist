// src/TodoApp.jsx
import React, { useEffect, useState } from "react";
import "./App.css";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { useAuth } from "./AuthContext";

import { ref, push, set, onValue, update, remove, off } from "firebase/database";

export default function TodoApp() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [darkMode, setDarkMode] = useState(true);


  const [calendarOpenFor, setCalendarOpenFor] = useState(null);
 
  const [calendarInputValue, setCalendarInputValue] = useState("");


  const getGoogleAccessToken = () => sessionStorage.getItem("googleAccessToken");

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const tasksRef = ref(db, `users/${user.uid}/todos`);
    const listener = (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setTasks([]);
        return;
      }
      const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setTasks(list);
    };

    onValue(tasksRef, listener);
    return () => {
      off(tasksRef, "value", listener);
    };
  }, [user]);

  const addTask = async () => {
    const text = newTask.trim();
    if (!text || !user) return;
    const tasksRef = ref(db, `users/${user.uid}/todos`);
    const newRef = push(tasksRef);
    await set(newRef, {
      text,
      completed: false,
      createdAt: Date.now(),
    });
    setNewTask("");
  };

  const toggleTask = async (id, completed) => {
    if (!user) return;
    const taskRef = ref(db, `users/${user.uid}/todos/${id}`);
    await update(taskRef, { completed: !completed });
  };

  const deleteTask = async (id, task) => {
    if (!user) return;
   
    if (task?.calendarEventId) {
      const token = getGoogleAccessToken();
      if (token) {
        try {
          const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(task.calendarEventId)}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) {
            console.warn("Could not delete event from calendar", await res.text());
          }
        } catch (err) {
          console.warn("Network error deleting calendar event", err);
        }
      }
    }

    const taskRef = ref(db, `users/${user.uid}/todos/${id}`);
    await remove(taskRef);
  };

  const createCalendarEventWithDatetime = async (taskId, datetimeLocal) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const token = getGoogleAccessToken();
    if (!token) {
      alert("You must sign in with Google (or link Google) to add events to Calendar.");
      return;
    }


    const startDate = new Date(datetimeLocal);
    if (isNaN(startDate.getTime())) {
      alert("Invalid date/time. Use the picker.");
      return;
    }
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    try {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: task.text,
          description: "Created from To-Do App",
          start: { dateTime: startDate.toISOString(), timeZone: timezone },
          end: { dateTime: endDate.toISOString(), timeZone: timezone },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Calendar API error:", data);
        if (data?.error?.code === 401) {
          alert("Google access expired. Please sign in with Google again.");
        } else {
          alert("Calendar API error: " + (data?.error?.message || JSON.stringify(data)));
        }
        return;
      }


      const taskRef = ref(db, `users/${user.uid}/todos/${taskId}`);
      await update(taskRef, { calendarEventId: data.id });

      alert("Event created in your Google Calendar ✅");
    
      setCalendarOpenFor(null);
      setCalendarInputValue("");
    } catch (err) {
      console.error("Network error creating event:", err);
      alert("Network error creating calendar event");
    }
  };

 
  const openCalendarPicker = (taskId) => {

    const d = new Date();
    d.setHours(d.getHours() + 1);
   
    const localISO = d.toISOString().slice(0, 16); 
    
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const localValue = `${year}-${month}-${day}T${hours}:${minutes}`;

    setCalendarInputValue(localValue);
    setCalendarOpenFor(taskId);
  };

  const cancelCalendar = () => {
    setCalendarOpenFor(null);
    setCalendarInputValue("");
  };

  const toggleTheme = () => setDarkMode(!darkMode);
  const logout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("googleAccessToken");
  };

  return (
    <div className={darkMode ? "container dark" : "container light"}>
      <div className="todo-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>To-Do App ✅</h1>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#ccc" }}>{user?.email || user?.displayName}</div>
            <button onClick={logout} style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8 }}>Logout</button>
          </div>
        </div>

        <button className="theme-btn" onClick={toggleTheme}>
          {darkMode ? "Light" : "Dark"} Mode
        </button>

        <div className="input-area">
          <input
            type="text"
            placeholder="Add a task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>

        {tasks.length === 0 ? (
          <p className="empty">No tasks yet... add one ✍️</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!task.completed}
                    onChange={() => toggleTask(task.id, task.completed)}
                  />
                  <span className={task.completed ? "completed" : ""} style={{ cursor: "pointer" }}>
                    {task.text}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                 
                  {calendarOpenFor === task.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="datetime-local"
                        value={calendarInputValue}
                        onChange={(e) => setCalendarInputValue(e.target.value)}
                        style={{ padding: 6, borderRadius: 8 }}
                      />
                      <button
                        onClick={() => createCalendarEventWithDatetime(task.id, calendarInputValue)}
                        style={{ padding: "6px 8px" }}
                      >
                        Create
                      </button>
                      <button onClick={cancelCalendar} style={{ padding: "6px 8px" }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openCalendarPicker(task.id)} style={{ fontSize: 13 }}>
                        Add to Calendar
                      </button>
                      <button onClick={() => deleteTask(task.id, task)}>✕</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
