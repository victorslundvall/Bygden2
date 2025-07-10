"use client";
import RequireAuth from "../components/RequireAuth";
import { supabase } from "@/supabaseClient";
import { useRouter } from "next/navigation";
import ScheduleCalendar from "./ScheduleCalendar";
import { useState, useEffect } from "react";
import { Schedule } from "./ScheduleCalendar";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to truncate video names
function truncateName(name: string) {
  return name.length > 15 ? name.slice(0, 15) + '...' : name;
}

export default function DashboardPage() {
  const router = useRouter();
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showDeleteDay, setShowDeleteDay] = useState<string | null>(null);
  const [draftSchedules, setDraftSchedules] = useState<Schedule[] | null>(null);
  const [activeSchedules, setActiveSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Fetch user id on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setRestaurantId(data.user.id);
    });
  }, []);

  // Fetch active schedules on mount (only for this restaurant)
  useEffect(() => {
    if (!restaurantId) return;
    const fetchSchedules = async () => {
      const { data } = await supabase.from("schedules").select().eq("restaurant_id", restaurantId);
      if (data) setActiveSchedules(data);
    };
    fetchSchedules();
  }, [restaurantId]);

  // Handler for saving (posting) schedules
  const handleSaveSchedules = async (schedules: Schedule[]) => {
    if (!restaurantId) return;
    setLoading(true);
    setMessage(null);
    // Delete all existing schedules for this restaurant, then insert new ones
    await supabase.from("schedules").delete().eq("restaurant_id", restaurantId);
    if (schedules.length > 0) {
      // Remove any id fields from draft schedules before insert, and add restaurant_id
      const schedulesToInsert = schedules.map((schedule) => {
        const { id, ...rest } = schedule;
        return { ...rest, restaurant_id: restaurantId };
      });
      const { error } = await supabase.from("schedules").insert(schedulesToInsert);
      if (error) {
        setMessage("Error saving schedules: " + error.message);
        setLoading(false);
        return;
      }
    }
    // Refetch from Supabase to get fresh ids and data
    const { data } = await supabase.from("schedules").select().eq("restaurant_id", restaurantId);
    setActiveSchedules(data || []);
    setDraftSchedules(null);
    setLoading(false);
    setMessage("Schedules saved!");
  };

  // Handler for deleting all schedules
  const handleDeleteAll = async () => {
    setLoading(true);
    setMessage(null);
    await supabase.from("schedules").delete().neq("id", "");
    setActiveSchedules([]);
    setDraftSchedules(null);
    setShowDeleteAll(false);
    setLoading(false);
    setMessage("All schedules deleted.");
  };

  // Handler for deleting a day's schedules
  const handleDeleteDay = async (day: string) => {
    setLoading(true);
    setMessage(null);
    await supabase.from("schedules").delete().eq("day_of_week", day);
    setActiveSchedules(activeSchedules.filter(s => s.day_of_week !== day));
    setDraftSchedules(draftSchedules ? draftSchedules.filter(s => s.day_of_week !== day) : null);
    setShowDeleteDay(null);
    setLoading(false);
    setMessage(`Schedules for ${day} deleted.`);
  };

  // Handler for draft changes from ScheduleCalendar
  const handleDraftChange = (draft: Schedule[]) => {
    setDraftSchedules(draft);
  };

  const schedulesToShow = draftSchedules || activeSchedules;
  const hasUnsaved = !!draftSchedules;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col items-center bg-white p-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <div className="w-full max-w-2xl flex flex-col gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4 shadow">
            <div className="font-semibold mb-2">Quick Actions</div>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={() => setShowDeleteAll(true)}>Delete All Schedules</button>
              <select className="bg-gray-100 text-gray-800 px-4 py-2 rounded" value={showDeleteDay || ""} onChange={e => setShowDeleteDay(e.target.value)}>
                <option value="">Delete Day&apos;s Schedules</option>
                {days.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow">
            <div className="font-semibold mb-2">Active Schedules</div>
            {schedulesToShow.length === 0 ? (
              <div className="text-gray-500">No active schedules yet.</div>
            ) : (
              <ul className="text-sm text-gray-700">
                {days.map(day => (
                  <li key={day} className="mb-1">
                    <span className="font-medium">{day}:</span> {schedulesToShow.filter(s => s.day_of_week === day).map(s => `${s.start_time}-${s.end_time} (${truncateName(s.video_name)})`).join(", ") || <span className="text-gray-400">No videos</span>}
                  </li>
                ))}
              </ul>
            )}
            {hasUnsaved && (
              <button className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition" onClick={() => handleSaveSchedules(draftSchedules!)} disabled={loading}>Save Schedule</button>
            )}
          </div>
        </div>
        <ScheduleCalendar schedules={schedulesToShow} onDraftChange={handleDraftChange} restaurantId={restaurantId} />
        {showDeleteAll && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Are you sure you want to delete all schedules?</h3>
              <button className="w-full bg-red-600 text-white py-2 rounded mb-2" onClick={handleDeleteAll} disabled={loading}>Yes, delete all</button>
              <button className="w-full bg-gray-200 text-gray-700 py-2 rounded" onClick={() => setShowDeleteAll(false)} disabled={loading}>Cancel</button>
            </div>
          </div>
        )}
        {showDeleteDay && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Are you sure you want to delete all schedules for {showDeleteDay}?</h3>
              <button className="w-full bg-red-600 text-white py-2 rounded mb-2" onClick={() => handleDeleteDay(showDeleteDay)} disabled={loading}>Yes, delete {showDeleteDay}</button>
              <button className="w-full bg-gray-200 text-gray-700 py-2 rounded" onClick={() => setShowDeleteDay(null)} disabled={loading}>Cancel</button>
            </div>
          </div>
        )}
        {message && <div className="mt-4 text-center text-green-700 font-medium">{message}</div>}
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition mt-8"
        >
          Logout
        </button>
      </div>
    </RequireAuth>
  );
} 