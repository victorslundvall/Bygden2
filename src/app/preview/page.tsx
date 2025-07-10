"use client";
import { useEffect, useState } from "react";
import RequireAuth from "../components/RequireAuth";
import { supabase } from "@/supabaseClient";
import { Schedule } from "../dashboard/ScheduleCalendar";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

export default function PreviewPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [selectedTime, setSelectedTime] = useState(() => {
    const now = new Date();
    const hour = now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", hour12: false });
    const min = now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", minute: "2-digit" });
    return `${hour}:${min}`;
  });
  const [current, setCurrent] = useState<Schedule | null>(null);
  const [copied, setCopied] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      const { data } = await supabase.from("schedules").select();
      if (data) setSchedules(data);
    };
    fetchSchedules();
    // Fetch restaurantId for the current user (use user.id)
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setRestaurantId(data.user.id);
    });
  }, []);

  useEffect(() => {
    // Find the scheduled video for the selected day and time
    const idx = times.indexOf(selectedTime);
    const scheduled = schedules.find(s => {
      if (s.day_of_week !== selectedDay) return false;
      const startIdx = times.indexOf(s.start_time);
      const endIdx = times.indexOf(s.end_time);
      return idx >= startIdx && idx < endIdx;
    });
    setCurrent(scheduled || null);
  }, [selectedDay, selectedTime, schedules]);

  const handleCopyUrl = () => {
    const url = window.location.origin + "/tv/" + (restaurantId || "restaurantId");
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <h1 className="text-2xl font-bold mb-6">TV Display Preview</h1>
        <div className="flex gap-4 mb-4">
          <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="border rounded p-2">
            {days.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="border rounded p-2">
            {times.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
        <div className="w-full max-w-xl aspect-video bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-4">
          {current ? (
            <video src={current.video_url} controls className="w-full h-full object-contain rounded" />
          ) : (
            <span>No video scheduled for this slot.</span>
          )}
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={handleCopyUrl}>Copy TV Display URL</button>
        {copied && <div className="mt-2 text-green-600 font-medium">Link copied!</div>}
      </div>
    </RequireAuth>
  );
} 