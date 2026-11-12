import { House, BookOpen, CircleDot, Compass, Ellipsis } from "lucide-react";

export const OWNER_NAVIGATION = [
  ["home", "Utama", House],
  ["doahub", "Titipan", BookOpen],
  ["zikrhub", "Ibadah", CircleDot],
  ["umrahhub", "Umrah", Compass],
  ["more", "Lain-lain", Ellipsis],
];

export function ownerSection(tab) {
  if (["submission", "dashboard", "focus", "doahub"].includes(tab))
    return "doahub";
  if (["collection", "tasbih", "zikrhub", "pagi", "petang", "solat"].includes(tab))
    return "zikrhub";
  if (["checklist", "itinerary", "timeline", "umrahhub"].includes(tab))
    return "umrahhub";
  if (["expenses", "offline", "about", "more"].includes(tab)) return "more";
  return "home";
}
