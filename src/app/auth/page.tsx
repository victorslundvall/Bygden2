"use client";
import { useState } from "react";
import { supabase } from "@/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Logged in! Redirecting...");
      // Optionally redirect here
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Check your email for a confirmation link!");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In / Register</h1>
      <form className="space-y-4" onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>
      </form>
      <button
        onClick={handleSignUp}
        className="w-full mt-2 bg-gray-100 text-gray-800 py-2 rounded hover:bg-gray-200 transition"
        disabled={loading}
      >
        {loading ? "Loading..." : "Register"}
      </button>
      {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
      {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
    </div>
  );
} 