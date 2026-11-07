
import Logo from "../assets/notenest.png";
import Logout from "../assets/logout.svg";
import { Link } from "react-router-dom";
import "../styles/Notes.css";
import "../styles/NoteEditor.css";
import api from "../api";
import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, Bell } from "lucide-react";
import Swal from "sweetalert2";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import DOMPurify from "dompurify";

// React Quill configuration
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
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
];

// Empty form state
const emptyForm = {
    title: "",
    content: "",
    reminder_at: "",
};

// Format dates for display
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

// Convert current local time into datetime-local format
const getLocalDateTime = () => {
    const now = new Date();

    return new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 16);
};

// Convert API timestamp into local datetime-local format
const toLocalDateTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    )
        .toISOString()
        .slice(0, 16);
};

// Convert datetime-local value into an ISO timestamp for Django
const toISOString = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);

    return date.toISOString();
};

// HTML helpers
const isHtml = (text) => /<\/?[a-z][\s\S]*>/i.test(text || "");

const stripHtml = (text) => {
    if (!isHtml(text)) return text || "";

    const div = document.createElement("div");
    div.innerHTML = DOMPurify.sanitize(text);

    return div.textContent || "";
};

// Display note content
function NoteBody({ content }) {
    if (isHtml(content)) {
        return (
            <div
                className="note-rich"
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(content),
                }}
            />
        );
    }

    return (
        <div className="note-rich">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

// Reminder status labels
const getReminderStatus = (status) => {
    switch (status) {
        case "pending":
            return "Pending";

        case "sending":
            return "Sending";

        case "sent":
            return "Email sent";

        case "failed":
            return "Delivery failed";

        default:
            return "";
    }
};

export default function Notes() {
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        ...emptyForm,
    });

    useEffect(() => {
        getUser();
        fetchNotes();
    }, []);

    // Fetch logged-in user
    const getUser = async () => {
        try {
            const res = await api.get("/api/user/");
            setUser(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    // Fetch notes
    const fetchNotes = async () => {
        try {
            const res = await api.get("/notenest/notes/");
            setNotes(res.data);
        } catch (error) {
            console.log(error);
        }
    };

    // Close and reset form
    const closeForm = () => {
        setFormData({ ...emptyForm });
        setEditingId(null);
        setShowForm(false);
    };

    // Validate note content
    const isEmpty = () =>
        !formData.title.trim() ||
        !stripHtml(formData.content).trim();

    // Validate reminder date
    const validateReminder = () => {
        if (!formData.reminder_at) return true;

        const selectedDate = new Date(formData.reminder_at);

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate <= new Date()
        ) {
            Swal.fire({
                icon: "warning",
                title: "Invalid reminder time",
                text: "Please select a future date and time.",
            });

            return false;
        }

        return true;
    };

    // Prepare data for Django
    const getPayload = () => ({
        title: formData.title,
        content: formData.content,
        reminder_at: toISOString(formData.reminder_at),
    });

    // Create a note
    const addNote = async () => {
        if (isEmpty()) {
            Swal.fire({
                icon: "warning",
                title: "Empty fields",
                text: "Please enter both a title and some content.",
            });

            return;
        }

        if (!validateReminder()) return;

        try {
            await api.post(
                "/notenest/notes/",
                getPayload()
            );

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
                text:
                    error.response?.data?.reminder_at?.[0] ||
                    "Something went wrong. Please try again.",
            });
        }
    };

    // Load note into editing form
    const handleEdit = (note) => {
        setFormData({
            title: note.title,
            content: note.content,
            reminder_at: toLocalDateTime(note.reminder_at),
        });

        setEditingId(note.id);
        setShowForm(true);
    };

    // Update an existing note
    const updateNote = async () => {
        if (isEmpty()) {
            Swal.fire({
                icon: "warning",
                title: "Empty fields",
                text: "Please enter both a title and some content.",
            });

            return;
        }

        if (!validateReminder()) return;

        try {
            await api.put(
                `/notenest/notes/update/${editingId}/`,
                getPayload()
            );

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
                text:
                    error.response?.data?.reminder_at?.[0] ||
                    "Something went wrong. Please try again.",
            });
        }
    };

    // Delete a note
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

        if (!result.isConfirmed) return;

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

    // Search notes
    const q = search.toLowerCase();

    const filteredNotes = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(q) ||
            stripHtml(note.content).toLowerCase().includes(q)
    );

    return (
        <div className="container-fluid mb-4">

            {/* Application header */}
            <div className="container-fluid app-details">
                <div className="container d-flex align-items-center justify-content-between mt-1">

                    <div className="d-flex align-items-center">
                        <img
                            src={Logo}
                            alt="notenest logo"
                            className="img-fluid app-logo"
                        />

                        <h4 className="app-name mt-3">
                            NoteNest
                        </h4>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {user && (
                            <p
                                className="d-none d-md-block mb-0 me-2 text-truncate"
                                style={{ maxWidth: "200px" }}
                            >
                                {user.email}
                            </p>
                        )}

                        <Link
                            to="/logout"
                            className="login rounded-pill pt-2 pb-2 ps-3 pe-3 border border-1 text-nowrap"
                        >
                            <img
                                src={Logout}
                                alt="logout icon"
                                className="img-fluid pe-1 logout"
                            />

                            Sign out
                        </Link>
                    </div>

                </div>
            </div>

            {/* Notes heading and search */}
            <div className="container mt-5 mb-4 d-flex align-items-center justify-content-between">

                <div className="notes-header">
                    <h2>
                        Your <span className="text-notes">notes</span>
                    </h2>

                    <p>{filteredNotes.length} entries</p>
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

                    <button
                        onClick={() => {
                            setFormData({ ...emptyForm });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="ms-4 btn btn-dark rounded-pill d-flex align-items-center"
                    >
                        <Plus size={18} className="pe-1" />
                        New
                    </button>

                </div>
            </div>

            {/* Notes list */}
            {filteredNotes.length === 0 ? (

                <div className="container d-flex flex-column align-items-center justify-content-center blank-page mt-5 pt-5 pb-5 rounded">

                    <h2>A blank page awaits</h2>

                    <p>Capture your first thought</p>

                    <button
                        className="btn btn-dark rounded-pill d-flex align-items-center mt-2"
                        onClick={() => {
                            setFormData({ ...emptyForm });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                    >
                        <Plus size={18} className="pe-1" />
                        Write a note
                    </button>

                </div>

            ) : (

                <div className="container">
                    <div className="row">

                        {filteredNotes.map((note) => (

                            <div
                                className="col-12 col-sm-12"
                                key={note.id}
                            >
                                <div className="notes-written mt-4 rounded p-3 p-md-5">

                                    <div className="d-flex justify-content-between gap-3">

                                        <div className="content-section">

                                            <h2 className="mb-3">
                                                {note.title}
                                            </h2>

                                            <div className="note-details">
                                                <NoteBody content={note.content} />
                                            </div>

                                        </div>

                                        <div className="features d-flex align-items-start gap-2">

                                            <button
                                                className="btn btn-light rounded-circle"
                                                onClick={() => handleEdit(note)}
                                                aria-label="Edit note"
                                            >
                                                <Pencil
                                                    size={14}
                                                    color="blue"
                                                />
                                            </button>

                                            <button
                                                className="btn btn-light rounded-circle"
                                                onClick={() => deleteNote(note.id)}
                                                aria-label="Delete note"
                                            >
                                                <Trash2
                                                    size={14}
                                                    color="red"
                                                />
                                            </button>

                                        </div>

                                    </div>

                                    {/* Reminder information */}
                                    {note.reminder_at && (
                                        <div className="mt-3 d-flex align-items-center flex-wrap gap-2">

                                            <small className="d-flex align-items-center gap-1 text-muted">
                                                <Bell size={14} />

                                                Reminder: {formatDate(note.reminder_at)}
                                            </small>

                                            {note.reminder_status && (
                                                <span className="badge bg-light text-dark border">
                                                    {getReminderStatus(note.reminder_status)}
                                                </span>
                                            )}

                                        </div>
                                    )}

                                    {/* Note creation/update date */}
                                    <div className="date-container mt-3">
                                        <small className="note-date">

                                            {note.updated_at &&
                                            note.updated_at !== note.created_at
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

            {/* Create/Edit note form */}
            {showForm && (

                <div className="container-fluid note-main d-flex align-items-center justify-content-center">

                    <div className="container p-4 create-note d-flex flex-column rounded">

                        <h3 className="mb-3">
                            {editingId ? "Edit note" : "Create a note"}
                        </h3>

                        {/* Note title */}
                        <input
                            className="note-title mb-3 p-2 rounded"
                            placeholder="Title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                        />

                        {/* Rich text editor */}
                        <ReactQuill
                            theme="snow"
                            className="note-editor mb-4"
                            placeholder="Write something..."
                            modules={quillModules}
                            formats={quillFormats}
                            value={formData.content}
                            onChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    content: value,
                                }))
                            }
                        />

                        {/* Reminder date and time */}
                        <div className="mb-4">

                            <label
                                htmlFor="reminder_at"
                                className="form-label d-flex align-items-center gap-2"
                            >
                                <Bell size={17} />
                                Set Email Reminder
                            </label>

                            <input
                                type="datetime-local"
                                id="reminder_at"
                                className="form-control"
                                value={formData.reminder_at}
                                min={getLocalDateTime()}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        reminder_at: e.target.value,
                                    }))
                                }
                            />

                            <small className="text-muted d-block mt-2">
                                Optional. We'll send a reminder to your registered email address.
                            </small>

                            {formData.reminder_at && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger ps-0 mt-1"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            reminder_at: "",
                                        }))
                                    }
                                >
                                    Remove reminder
                                </button>
                            )}

                        </div>

                        {/* Form buttons */}
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
