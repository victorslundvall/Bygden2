"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { Schedule } from "../../dashboard/ScheduleCalendar";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

function getCurrentDayTime() {
  const now = new Date();
  const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Sun, 1=Mon...
  const day = days[dayIdx];
  // Get hour and minute in Stockholm time
  const hour = parseInt(now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", hour: "2-digit", hour12: false }));
  const min = parseInt(now.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", minute: "2-digit" }));
  // Round down to nearest half-hour slot
  const roundedMin = min < 30 ? "00" : "30";
  const slot = `${hour.toString().padStart(2, "0")}:${roundedMin}`;
  return { day, time: slot };
}

export default function TVPage() {
  const params = useParams();
  const { restaurantId } = params;
  const [current, setCurrent] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    const { day, time } = getCurrentDayTime();
    const idx = times.indexOf(time);
    const { data } = await supabase.from("schedules").select().eq("restaurant_id", restaurantId);
    if (data) {
      const scheduled = data.find((s: Schedule) => {
        if (s.day_of_week !== day) return false;
        const startIdx = times.indexOf(s.start_time);
        const endIdx = times.indexOf(s.end_time);
        return idx >= startIdx && idx < endIdx;
      });
      setCurrent(scheduled || null);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchCurrent]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="w-full max-w-2xl aspect-video bg-black rounded flex items-center justify-center">
        {loading ? (
          <span className="text-white text-xl">Loading...</span>
        ) : current ? (
          <video src={current.video_url} autoPlay loop controls muted playsInline className="w-full h-full object-contain rounded bg-black" />
        ) : (
          <span className="text-white text-xl">No video scheduled</span>
        )}
      </div>
    </div>
  );
} 