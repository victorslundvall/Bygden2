"use client";
import RequireAuth from "../components/RequireAuth";
import VideoUpload from "./VideoUpload";
import { useState } from "react";
import VideoGrid from "./VideoGrid";

export default function VideosPage() {
  const [refreshFlag, setRefreshFlag] = useState(0);
  const handleUpload = () => {
    setRefreshFlag((f) => f + 1);
  };
  return (
    <RequireAuth>
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-2xl font-bold mb-6">Your Videos</h1>
        <div className="mb-4">
          <VideoUpload onUpload={handleUpload} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <VideoGrid refreshFlag={refreshFlag} />
        </div>
      </div>
    </RequireAuth>
  );
} 