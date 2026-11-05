import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import Swal from "sweetalert2";
import Logo from "../assets/notenest.png";
import "../styles/PasswordReset.css";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const uidb64 = searchParams.get("uidb64");
    const token = searchParams.get("token");

    const [password1, setPassword1] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!uidb64 || !token) {
            Swal.fire({
                icon: "error",
                title: "Invalid Reset Link",
                text: "Your password reset link is incomplete or invalid.",
            });
            return;
        }

        if (password1 !== password2) {
            Swal.fire({
                icon: "error",
                title: "Passwords Do Not Match",
                text: "Please make sure both passwords are identical.",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/api/password-reset/confirm/",
                {
                    uidb64,
                    token,
                    password1,
                    password2,
                }
            );

            await Swal.fire({
                icon: "success",
                title: "Password Reset Successful",
                text: response.data.message,
                confirmButtonText: "Go to Login",
            });

            navigate("/login");

        } catch (error) {
            const data = error.response?.data;

            const messages = data
                ? Object.values(data).flat().join("\n")
                : "Unable to reset your password. Please try again.";

            Swal.fire({
                icon: "error",
                title: "Password Reset Failed",
                text: messages,
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

                <h2>Reset Password</h2>

                <p>
                    Create a new password for your NoteNest account.
                </p>

                <input
                    type="password"
                    className="password-reset-input"
                    placeholder="New Password"
                    value={password1}
                    onChange={(e) => setPassword1(e.target.value)}
                    required
                />

                <input
                    type="password"
                    className="password-reset-input"
                    placeholder="Confirm New Password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="password-reset-button"
                    disabled={loading}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>

                <Link to="/login" className="password-reset-link">
                    Back to Login
                </Link>

            </form>
        </div>
    );
}