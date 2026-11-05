import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Swal from "sweetalert2";
import Logo from "../assets/notenest.png";
import "../styles/PasswordReset.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post(
                "/api/password-reset/",
                { email }
            );

            await Swal.fire({
                icon: "success",
                title: "Check Your Email",
                text: response.data.message,
                confirmButtonText: "Okay",
            });

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Request Failed",
                text: error.response?.data?.detail ||
                    "Unable to process your request. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="password-reset-container">
            <form onSubmit={handleSubmit} className="password-reset-form">

                <div className="password-reset-logo">
                    <img src={Logo} alt="NoteNest logo" />
                </div>

                <h2>Forgot Password?</h2>

                <p>
                    Enter your registered email address and we'll
                    send you a link to reset your password.
                </p>

                <input
                    type="email"
                    className="password-reset-input"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="password-reset-button"
                    disabled={loading}
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <Link to="/login" className="password-reset-link">
                    Back to Login
                </Link>

            </form>
        </div>
    );
}