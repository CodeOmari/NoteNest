import { useState, useEffect } from "react";
import api from "../api";
import Note from "../components/Note"
import "../styles/Home.css"

import { useNavigate } from "react-router-dom";

function Home() {
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    const navigate = useNavigate();

    const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    }

    useEffect(() => {
        getNotes();
    }, []);

    const getNotes = () => {
        api
            .get("/api/notes/")
            .then((res) => res.data)
            .then((data) => {
                setNotes(data);
                console.log(data);
            })
            .catch((err) => alert(err));
    };

    const deleteNote = (id) => {
        api
            .delete(`/api/notes/delete/${id}/`)
            .then((res) => {
                if (res.status === 204) alert("Note deleted!");
                else alert("Failed to delete note.");
                getNotes();
            })
            .catch((error) => alert(error));
    };

    const createNote = (e) => {
        e.preventDefault();
        api
            .post("/api/notes/", { content, title })
            .then((res) => {
                if (res.status === 201) {
                    alert("Note created!");
                    setTitle("");
                    setContent("");
                }
                else alert("Failed to make note.");
                getNotes();
            })
            .catch((err) => alert(err));
    };

    return (
        <div className="container-fluid px-0">
            <div className="header d-flex justify-content-between align-items-center pt-3 pb-2">
                <div className="title-container">
                    <h2 className="title">NoteNest</h2>
                </div>

                <div className="logout-btn">
                    <button className="logout" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            </div>
            <h2 className="note-header">Create a Note</h2>
            <form className="container note-form" onSubmit={createNote}>
                <label htmlFor="title">Title:</label>
                <br />
                <input
                    type="text"
                    className="title-input"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                    placeholder="Enter note title..."
                />
                <br />
                <label htmlFor="content">Content:</label>
                <br />
                <textarea
                    id="content"
                    name="content"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note here..."
                ></textarea>
                <br />
                <input type="submit" value="Submit" className="btn-submit"></input>
            </form>

            <div className="container note-created mb-4 mt-4">
                {notes.length === 0 ? (
                    <p className="text-muted">No notes yet. Create your first note above!</p>
                ) : (
                    notes.map((note) => (
                        <Note note={note} onDelete={deleteNote} key={note.id} />
                    ))
                )}
            </div>
        </div>
    );
}

export default Home;