"use client";
import { useRef, useState } from "react";
import { supabase } from "@/supabaseClient";

const MAX_SIZE_MB = 200; // Example: 200MB limit
const ALLOWED_TYPES = ["video/mp4", "video/quicktime"];

// Helper to sanitize filenames for Supabase Storage
function sanitizeFilename(filename: string) {
  // Replace spaces with underscores
  let sanitized = filename.replace(/\s+/g, "_");
  // Replace Swedish characters with ASCII equivalents
  sanitized = sanitized.replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o");
  sanitized = sanitized.replace(/Å/g, "A").replace(/Ä/g, "A").replace(/Ö/g, "O");
  // Remove any other non-ASCII characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "");
  return sanitized;
}

export default function VideoUpload({ onUpload }: { onUpload: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    setProgress(0);
    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("V001: Unsupported file format. Only MP4 and MOV allowed.");
      return;
    }
    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError("V002: File size exceeds limit (200MB).");
      return;
    }
    setUploading(true);
    try {
      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(file.name);
      // Upload to Supabase Storage (bucket: 'videos')
      const { data, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(`public/${Date.now()}-${sanitizedFilename}`, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(`V003: Upload failed. ${uploadError.message}`);
      } else {
        setProgress(100);
        onUpload();
      }
    } catch (e: any) {
      setError(`V003: Upload failed. ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded p-6 text-center transition-colors ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"}`}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{ cursor: uploading ? "not-allowed" : "pointer" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-lg font-medium">Drag & drop a video here, or click to select</span>
        <span className="text-xs text-gray-500">MP4 or MOV, max {MAX_SIZE_MB}MB</span>
        {uploading && (
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
    </div>
  );
} 