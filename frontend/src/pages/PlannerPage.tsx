import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { generatePlan } from "../api/index";
import { Sidebar } from "../components/Sidebar";

export default function PlannerPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(2);
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [textbook, setTextbook] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addTopic = () => {
    const trimmed = currentTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
      setCurrentTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTopic();
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTopics = [...topics];
    const draggedTopic = newTopics[draggedIndex];
    newTopics.splice(draggedIndex, 1);
    newTopics.splice(index, 0, draggedTopic);

    setTopics(newTopics);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (topics.length === 0) {
      setError("Please add at least one topic");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        course_name: courseName,
        exam_date: examDate,
        topics: topics,
        daily_study_hours: dailyStudyHours,
        ...(textbook.trim() ? { textbook: textbook.trim() } : {}),
      };

      const data = await generatePlan(payload);
      navigate(`/planner/${data.course_id}`, {
        state: {
          generatedWarning: data.warning ?? null,
          unscheduled: data.unscheduled ?? [],
        },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0e0e0e]">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col">
        <header className="flex flex-col pt-8 pb-6 px-12 max-w-screen-2xl">
          <div className="space-y-2">
            <span className="text-[#8fa1a1] text-sm tracking-widest uppercase">AI-Powered Planning</span>
            <h2 className="font-['Manrope'] text-[3rem] leading-tight font-light text-[#cdc0ec]">
              Create Study Plan
            </h2>
            <p className="text-[#acabaa] text-sm">Let Sensei's AI design your personalized learning path</p>
          </div>
        </header>

        <div className="px-12 pb-8 max-w-screen-2xl">
          <form onSubmit={onGenerate} className="bg-[#131313] border border-[#484848]/20 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Course Name
                </label>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  placeholder="e.g. Organic Chemistry"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="block text-sm font-medium text-[#e7e5e5]">
                    Target Date
                  </label>
                  <p className="text-xs text-[#767575]">(When do you want to be ready by?)</p>
                </div>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Daily Study Hours
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={dailyStudyHours}
                  onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                  className="w-full bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 pl-2">
                  <label className="block text-sm font-medium text-[#e7e5e5]">
                    Relevant Documents
                  </label>
                  <p className="text-xs text-[#767575]">(optional - used to personalize your plan)</p>
                </div>
                <input
                  value={textbook}
                  onChange={(e) => setTextbook(e.target.value)}
                  disabled
                  className="w-full cursor-not-allowed bg-[#181919] border border-[#484848]/20 rounded-lg px-4 py-3 text-[#767575] placeholder:text-[#5f5f5f] transition-colors opacity-70"
                  placeholder="Document uploads will be available soon"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#e7e5e5] mb-2">
                  Topics <span className="text-[#767575]">(in order)</span>
                </label>
                
                {/* Display added topics as chips */}
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#1f2020] border border-[#484848]/30 rounded-lg">
                    {topics.map((topic, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`inline-flex items-center gap-2 bg-[#4b4166]/40 border border-[#cdc0ec]/30 rounded-full px-3 py-1.5 text-sm text-[#cdc0ec] group hover:bg-[#4b4166]/60 transition-all cursor-move ${
                          draggedIndex === index ? "opacity-50 scale-95" : ""
                        }`}
                      >
                        <span className="material-symbols-outlined text-base text-[#cdc0ec]/40">drag_indicator</span>
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="text-[#cdc0ec]/60 hover:text-[#ec7c8a] transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input field with + button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    onKeyDown={handleTopicKeyDown}
                    className="flex-1 bg-[#1f2020] border border-[#484848]/30 rounded-lg px-4 py-3 text-[#e7e5e5] placeholder:text-[#767575] focus:outline-none focus:border-[#cdc0ec] focus:ring-1 focus:ring-[#cdc0ec] transition-colors"
                    placeholder="Add a topic (e.g., Limits, Derivatives)"
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    disabled={!currentTopic.trim()}
                    className="bg-[#cdc0ec] text-[#443b5f] px-4 py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span>Add Topic</span>
                  </button>
                </div>
                
                {topics.length === 0 && (
                  <p className="text-xs text-[#767575] mt-2">Add at least one topic to continue</p>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-[#7f2737]/20 border border-[#ec7c8a]/30 rounded-lg p-3">
                <p className="text-sm text-[#ec7c8a]">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#cdc0ec] to-[#bfb2de] text-[#443b5f] font-medium py-2.5 px-5 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>Generating AI Plan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>Generate Plan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="text-[#acabaa] hover:text-[#e7e5e5] font-medium transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
