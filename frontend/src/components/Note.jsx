import React from "react";
import "../styles/Notes.css";
import CancelIcon from "../assets/cancel-icon.svg";

function Note({ note, onDelete }) {
    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US")

    return (
        <div className="container note-container">
            <p className="note-title">{note.title}</p>
            <p className="note-content">{note.content}</p>
            <p className="note-date">{formattedDate}</p>
            <button className="delete-button" onClick={() => onDelete(note.id)}>
                <img src={CancelIcon} alt="cancel icon" />
            </button>
        </div>
    );
}

export default Note;