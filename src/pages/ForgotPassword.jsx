import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Monitor } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "http://localhost:3001/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetQuestion = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/forgot-password/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to load question");
        return;
      }

      setQuestion(data.question);
      setStep(2);
    } catch (error) {
      toast.error("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          answer,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Password reset failed");
        return;
      }

      toast.success("Password reset successful");
      navigate("/login");
    } catch (error) {
      toast.error("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F3] via-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-[#E7EEF7] bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFE7D6] flex items-center justify-center border border-[#F3C9A9] shadow-sm">
              <Monitor className="w-5 h-5 text-[#C96A2B]" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-900">
                IT Inventory Management System
              </h1>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase">
                By Mervs V.1
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Recover your local account using your security question.
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleGetQuestion} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Next"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Security Question
              </label>
              <div className="rounded-xl border border-[#F3DDCF] bg-[#FFF8F3] px-4 py-3 text-sm text-slate-700">
                {question}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Answer
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter answer"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}