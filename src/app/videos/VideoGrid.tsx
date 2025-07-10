"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

interface Video {
  id: string;
  name: string;
  url: string;
}

export default function VideoGrid({ refreshFlag }: { refreshFlag: number }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      // List files in the 'videos/public' folder
      const { data, error } = await supabase.storage.from("videos").list("public");
      if (error) {
        setError("V006: Failed to fetch videos. " + error.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setVideos([]);
        setLoading(false);
        return;
      }
      // Get public URLs for each video
      const videoList: Video[] = data
        .filter((file) => file.name.endsWith(".mp4") || file.name.endsWith(".mov"))
        .map((file) => ({
          id: file.id || file.name,
          name: file.name,
          url: supabase.storage.from("videos").getPublicUrl(`public/${file.name}`).data.publicUrl,
        }));
      setVideos(videoList);
      setLoading(false);
    };
    fetchVideos();
  }, [refreshFlag, refresh]);

  const handleDelete = async (video: Video) => {
    if (!confirm(`Delete video "${video.name}"?`)) return;
    const { error } = await supabase.storage.from("videos").remove([`public/${video.name}`]);
    if (error) {
      setError("V007: Video deletion failed. " + error.message);
    } else {
      setRefresh(r => r + 1);
    }
  };

  const handleRename = async (video: Video) => {
    const newName = prompt("Enter new name (with .mp4 or .mov):", video.name);
    if (!newName || newName === video.name) return;
    // Download the file
    const { data, error: downloadError } = await supabase.storage.from("videos").download(`public/${video.name}`);
    if (downloadError || !data) {
      setError("V004: Video processing error. " + (downloadError?.message || ""));
      return;
    }
    // Upload with new name
    const { error: uploadError } = await supabase.storage.from("videos").upload(`public/${newName}`, data, { upsert: false });
    if (uploadError) {
      setError("V004: Video processing error. " + uploadError.message);
      return;
    }
    // Delete old file
    await supabase.storage.from("videos").remove([`public/${video.name}`]);
    setRefresh(r => r + 1);
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading videos...</div>;
  }
  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }
  if (videos.length === 0) {
    return <div className="aspect-video bg-gray-100 rounded flex items-center justify-center text-gray-400">No videos yet</div>;
  }
  return (
    <>
      {videos.map((video) => (
        <div key={video.id} className="aspect-video bg-gray-100 rounded flex flex-col items-center justify-center p-2 relative group">
          <video src={video.url} className="w-full h-full object-cover rounded cursor-pointer" controls preload="metadata" style={{ maxHeight: 160 }} onClick={() => setPreviewUrl(video.url)} />
          <div className="mt-2 text-xs text-gray-700 truncate w-full text-center">{video.name}</div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => handleRename(video)} className="bg-yellow-400 text-white px-2 py-1 rounded text-xs">Rename</button>
            <button onClick={() => handleDelete(video)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
          </div>
        </div>
      ))}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <video src={previewUrl} controls autoPlay className="w-full rounded" style={{ maxHeight: '70vh' }} />
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded" onClick={() => setPreviewUrl(null)}>Close Preview</button>
          </div>
        </div>
      )}
    </>
  );
} 