const COURSE_PALETTE = [
  { bg: "bg-[#cdc0ec]/10", text: "text-[#cdc0ec]", dot: "bg-[#cdc0ec]", hex: "#cdc0ec" },
  { bg: "bg-[#7fd29a]/10", text: "text-[#7fd29a]", dot: "bg-[#7fd29a]", hex: "#7fd29a" },
  { bg: "bg-[#6db8d4]/10", text: "text-[#6db8d4]", dot: "bg-[#6db8d4]", hex: "#6db8d4" },
  { bg: "bg-[#e8956d]/10", text: "text-[#e8956d]", dot: "bg-[#e8956d]", hex: "#e8956d" },
  { bg: "bg-[#edbbb1]/10", text: "text-[#edbbb1]", dot: "bg-[#edbbb1]", hex: "#edbbb1" },
  { bg: "bg-[#d4c47a]/10", text: "text-[#d4c47a]", dot: "bg-[#d4c47a]", hex: "#d4c47a" },
  { bg: "bg-[#a8d4c0]/10", text: "text-[#a8d4c0]", dot: "bg-[#a8d4c0]", hex: "#a8d4c0" },
  { bg: "bg-[#c4a8d4]/10", text: "text-[#c4a8d4]", dot: "bg-[#c4a8d4]", hex: "#c4a8d4" },
];

export function getCourseStyle(courseId: number, allCourseIds?: number[]) {
  if (allCourseIds && allCourseIds.length > 0) {
    const sorted = [...allCourseIds].sort((a, b) => a - b);
    const index = sorted.indexOf(courseId);
    return COURSE_PALETTE[(index >= 0 ? index : courseId) % COURSE_PALETTE.length];
  }
  return COURSE_PALETTE[courseId % COURSE_PALETTE.length];
}
