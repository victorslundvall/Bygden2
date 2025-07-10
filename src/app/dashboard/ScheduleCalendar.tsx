"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Generate 48 half-hour slots for 24 hours
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

// Define the Schedule interface
export interface Schedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  video_name: string;
  video_url: string;
  is_active: boolean;
  restaurant_id: string;
  id?: string; // optional, for Supabase
}

// Color palette for scheduled videos
const videoColors = [
  "bg-green-100 hover:bg-green-200 border-green-300",
  "bg-blue-100 hover:bg-blue-200 border-blue-300",
  "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
  "bg-purple-100 hover:bg-purple-200 border-purple-300",
  "bg-pink-100 hover:bg-pink-200 border-pink-300",
  "bg-orange-100 hover:bg-orange-200 border-orange-300",
  "bg-teal-100 hover:bg-teal-200 border-teal-300",
];
// Map video_name to a color index (use base filename after first dash)
const getVideoColor = (videoName: string) => {
  // Remove timestamp prefix if present
  const base = videoName.includes('-') ? videoName.split('-').slice(1).join('-') : videoName;
  const hash = Array.from(base).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return videoColors[hash % videoColors.length];
};

// Helper to check for conflicts in the selected time range
function hasConflict(day: string, startIdx: number, endIdx: number, schedules: Schedule[]) {
  return schedules.some(s => {
    if (s.day_of_week !== day) return false;
    const sStart = times.indexOf(s.start_time);
    const sEnd = times.indexOf(s.end_time);
    // Overlap if ranges intersect
    return Math.max(startIdx, sStart) < Math.min(endIdx, sEnd);
  });
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  onDraftChange: (draft: Schedule[]) => void;
  restaurantId: string | null;
}

export default function ScheduleCalendar({ schedules, onDraftChange, restaurantId }: ScheduleCalendarProps) {
  const [selected, setSelected] = useState<{ day: string; time: string } | null>(null);
  const [videos, setVideos] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [slider, setSlider] = useState<{ start: number; end: number }>({ start: 16, end: 18 });
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [draft, setDraft] = useState<Schedule[]>(schedules);

  useEffect(() => {
    setDraft(schedules);
  }, [schedules]);

  // Fetch videos for selection
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.storage.from("videos").list("public");
      if (data) {
        setVideos(
          data
            .filter((file) => file.name.endsWith(".mp4") || file.name.endsWith(".mov"))
            .map((file) => ({
              name: file.name,
              url: supabase.storage.from("videos").getPublicUrl(`public/${file.name}`).data.publicUrl,
            }))
        );
      }
    };
    fetchVideos();
  }, []);

  const handleSchedule = () => {
    if (!selected || !selectedVideo || !restaurantId) return;
    setLoading(true);
    setMessage(null);
    const video = videos.find((v) => v.name === selectedVideo);
    if (!video) return;
    const start_time = times[slider.start];
    const end_time = times[slider.end];
    const conflict = !!selected && hasConflict(selected.day, slider.start, slider.end, draft);
    if (conflict) {
      setMessage("S001: Time Slot Conflict. There is already a video scheduled in this time range.");
      setLoading(false);
      return;
    }
    const newDraft = [
      ...draft,
      {
        day_of_week: selected.day,
        start_time,
        end_time,
        video_name: video.name,
        video_url: video.url,
        is_active: true,
        restaurant_id: restaurantId,
      },
    ];
    setDraft(newDraft);
    onDraftChange(newDraft);
    setSelected(null);
    setSelectedVideo("");
    setLoading(false);
  };

  // Helper to get scheduled video for a slot (returns the schedule if the slot is within its range)
  const getScheduledVideoForSlot = (day: string, timeIdx: number) => {
    return draft.find((s) => {
      if (s.day_of_week !== day) return false;
      const startIdx = times.indexOf(s.start_time);
      const endIdx = times.indexOf(s.end_time);
      return timeIdx >= startIdx && timeIdx < endIdx;
    });
  };

  // Helper to check if this is the start cell for a scheduled video
  const isStartOfScheduledVideo = (schedule: Schedule, timeIdx: number) => {
    return times[timeIdx] === schedule.start_time;
  };

  const conflict = !!selected && hasConflict(selected.day, slider.start, slider.end, draft);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-lg p-6 shadow mb-8">
      <h2 className="text-2xl font-bold mb-6">Schedule Videos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2"></th>
              {days.map(day => (
                <th key={day} className="p-2 text-center font-medium">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time, idx) => (
              <tr key={time}>
                <td className="p-2 font-medium text-right">{time}</td>
                {days.map(day => {
                  const scheduled = getScheduledVideoForSlot(day, idx);
                  const isStart = scheduled && isStartOfScheduledVideo(scheduled, idx);
                  const colorClass = scheduled ? getVideoColor(scheduled.video_name) : "hover:bg-blue-50";
                  return (
                    <td
                      key={day}
                      className={`p-2 border cursor-pointer transition ${colorClass}`}
                      onClick={() => {
                        setSelected({ day, time });
                        const idx = times.indexOf(time);
                        setSlider({ start: idx, end: Math.min(idx + 1, times.length - 1) });
                      }}
                    >
                      {isStart ? (
                        <div className="text-xs font-semibold truncate text-gray-900">
                          {scheduled.video_name}<br />{scheduled.start_time}-{scheduled.end_time}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Schedule Video</h3>
            <div className="mb-2">Day: <b>{selected.day}</b></div>
            <div className="mb-2">Start: <b>{times[slider.start]}</b> End: <b>{times[slider.end]}</b></div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-medium">Select Video</label>
              <select
                className="w-full border rounded p-2"
                value={selectedVideo}
                onChange={e => setSelectedVideo(e.target.value)}
                disabled={loading}
              >
                <option value="" disabled>Select a video</option>
                {videos.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="font-medium">Select Time Range</label>
              <input
                type="range"
                min={0}
                max={47}
                value={slider.start}
                onChange={e => setSlider({ ...slider, start: Number(e.target.value) })}
                className="w-full"
                disabled={loading}
              />
              <input
                type="range"
                min={slider.start + 1}
                max={47}
                value={slider.end}
                onChange={e => setSlider({ ...slider, end: Number(e.target.value) })}
                className="w-full mt-2"
                disabled={loading}
              />
              <div className="text-xs text-gray-500 mt-1">From <b>{times[slider.start]}</b> to <b>{times[slider.end]}</b> (Stockholm time)</div>
            </div>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded mt-2 disabled:opacity-50"
              onClick={handleSchedule}
              disabled={loading || !selectedVideo || slider.end <= slider.start || conflict}
            >
              Schedule Video
            </button>
            {conflict && (
              <div className="mt-2 text-center text-red-600 text-sm font-medium">
                S001: Time Slot Conflict. There is already a video scheduled in this time range.
              </div>
            )}
            <button className="w-full bg-gray-200 text-gray-700 py-2 rounded mt-2" onClick={() => setSelected(null)} disabled={loading}>Cancel</button>
            {message && <div className="mt-4 text-center text-red-600">{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 