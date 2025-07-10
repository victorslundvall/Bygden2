"use client";
import { useState } from "react";
import { supabase } from "@/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
      <form className="space-y-4" onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Send Reset Link"}
        </button>
      </form>
      {message && <div className="mt-4 text-center text-gray-700">{message}</div>}
    </div>
  );
} 