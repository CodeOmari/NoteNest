import Logo from "../assets/notenest.png";
import Logout from "../assets/logout.svg";
import { Link } from "react-router-dom";
import '../styles/Notes.css';
import '../styles/NoteEditor.css';
import api from "../api";
import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import DOMPurify from "dompurify";

//  install react-quill-new dompurify to add editor capabilities to my notes form
const SIZES = ["12px", "14px", "16px", "18px", "24px", "32px"];
const Size = Quill.import("attributors/style/size");
Size.whitelist = SIZES;
Quill.register(Size, true);

const quillModules = {
    toolbar: [
        [{ size: SIZES }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
    ],
};

const quillFormats = [
    "size", "bold", "italic", "underline", "strike",
    "color", "background", "list",
];

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};


const isHtml = (text) => /<\/?[a-z][\s\S]*>/i.test(text || "");

const stripHtml = (text) => {
    if (!isHtml(text)) return text || "";
    const div = document.createElement("div");
    div.innerHTML = DOMPurify.sanitize(text);
    return div.textContent || "";
};

function NoteBody({ content }) {
    if (isHtml(content)) {
        return (
            <div
                className="note-rich"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
        );
    }
    return (
        <div className="note-rich">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}

export default function Notes() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: "", content: "" });

    useEffect(() => {
        getUser();
        fetchNotes();
    }, []);

    const getUser = async () => {
        try {
            const res = await api.get("/api/user/");
            setUser(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await api.get("/notenest/notes/");
            setNotes(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    const closeForm = () => {
        setFormData({ title: "", content: "" });
        setEditingId(null);
        setShowForm(false);
    };

    const isEmpty = () =>
        !formData.title.trim() || !stripHtml(formData.content).trim();

    const addNote = async () => {
        if (isEmpty()) {
            Swal.fire({
                icon: "warning",
                title: "Empty fields",
                text: "Please enter both a title and some content.",
            });
            return;
        }
        try {
            await api.post("/notenest/notes/", formData);
            await fetchNotes();
            closeForm();

            Swal.fire({
                icon: "success",
                title: "Note Created!",
                text: "Your note has been saved successfully.",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Failed to Create Note",
                text: "Something went wrong. Please try again.",
            });
        }
    };

    const handleEdit = (note) => {
        setFormData({
            title: note.title,
            content: note.content,
        });
        setEditingId(note.id);
        setShowForm(true);
    };

    const updateNote = async () => {
        if (isEmpty()) {
            Swal.fire({
                icon: "warning",
                title: "Empty fields",
                text: "Please enter both a title and some content.",
            });
            return;
        }

        try {
            await api.put(`/notenest/notes/update/${editingId}/`, formData);
            await fetchNotes();
            closeForm();

            Swal.fire({
                icon: "success",
                title: "Note Updated!",
                text: "Your changes have been saved successfully.",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Failed to Update Note",
                text: "Something went wrong. Please try again.",
            });
        }
    };

    const deleteNote = async (id) => {
        const result = await Swal.fire({
            title: "Delete this note?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            reverseButtons: true,
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await api.delete(`/notenest/notes/delete/${id}/`);
            await fetchNotes();

            Swal.fire({
                icon: "success",
                title: "Note Deleted!",
                text: "The note has been deleted successfully.",
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.log(error);

            Swal.fire({
                icon: "error",
                title: "Failed to Delete Note",
                text: "Something went wrong. Please try again.",
            });
        }
    };

    const q = search.toLowerCase();
    const filteredNotes = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(q) ||
            stripHtml(note.content).toLowerCase().includes(q)
    );

    return (
        <div className="container-fluid mb-4">
            <div className="container-fluid app-details">
                <div className="container d-flex align-items-center justify-content-between mt-1">

                    <div className="d-flex align-items-center">
                        <img src={Logo} alt="notenest logo" className="img-fluid app-logo" />
                        <h4 className="app-name mt-3">NoteNest</h4>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {user && (
                            <p className="d-none d-md-block mb-0 me-2 text-truncate" style={{ maxWidth: "200px" }}>
                                {user.email}
                            </p>
                        )}
                        <Link
                            to="/logout"
                            className="login rounded-pill pt-2 pb-2 ps-3 pe-3 border border-1 text-nowrap"
                        >
                            <img src={Logout} alt="logout icon" className="img-fluid pe-1 logout" />
                            Sign out
                        </Link>
                    </div>

                </div>
            </div>

            <div className="container mt-5 mb-4 d-flex align-items-center justify-content-between">
                <div className="notes-header">
                    <h2>Your <span className="text-notes">notes</span></h2>
                    <p> {filteredNotes.length} entries</p>
                </div>

                <div className="right-section d-flex align-items-center">
                    <div className="search-bar d-flex align-items-center">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            className="search rounded-pill ps-3 p-1"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <span className="search-icon">
                            <Search size={18} />
                        </span>
                    </div>

                    <button onClick={() => setShowForm(true)} className="ms-4 btn btn-dark rounded-pill d-flex align-items-center">
                        <Plus size={18} className="pe-1" /> New
                    </button>
                </div>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="container d-flex flex-column align-items-center justify-content-center blank-page mt-5 pt-5 pb-5 rounded">
                    <h2>A blank page awaits</h2>

                    <p>Capture your first thought</p>

                    <button className="btn btn-dark rounded-pill d-flex align-items-center mt-2" onClick={() => setShowForm(true)}>
                        <Plus size={18} className="pe-1" /> Write a note
                    </button>
                </div>
            ) : (
                <div className="container">
                    <div className="row">
                        {filteredNotes.map((note) => (
                            <div className="col-12 col-sm-12" key={note.id}>
                                <div className="notes-written mt-4 rounded p-3 p-md-4">
                                    <div className="d-flex justify-content-between gap-3">
                                        <div className="content-section">
                                            <h2 className="mb-3">{note.title}</h2>

                                            <div className="note-details">
                                                <NoteBody content={note.content} />
                                            </div>
                                        </div>

                                        <div className="features d-flex align-items-start gap-2">
                                            <button className="btn btn-light rounded-circle" onClick={() => handleEdit(note)}>
                                                <Pencil size={14} color="blue" />
                                            </button>

                                            <button className="btn btn-light rounded-circle" onClick={() => deleteNote(note.id)}>
                                                <Trash2 size={14} color="red" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="date-container mt-3">
                                        <small className="note-date">
                                            {note.updated_at && note.updated_at !== note.created_at
                                                ? `updated at ${formatDate(note.updated_at)}`
                                                : `created at ${formatDate(note.created_at)}`}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="container-fluid note-main d-flex align-items-center justify-content-center">
                    <div className="container p-4 create-note d-flex flex-column rounded">
                        <h3 className="mb-3">{editingId ? "Edit note" : "Create a note"}</h3>

                        <input
                            className="note-title mb-3 p-2 rounded"
                            placeholder="Title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                        />

                        <ReactQuill
                            theme="snow"
                            className="note-editor mb-4"
                            placeholder="Write something..."
                            modules={quillModules}
                            formats={quillFormats}
                            value={formData.content}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, content: value }))
                            }
                        />

                        <div className="d-flex justify-content-end gap-2">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={closeForm}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-dark rounded-pill"
                                onClick={editingId ? updateNote : addNote}
                            >
                                {editingId ? "Update Note" : "Save Note"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
