"use client";

import { useEffect, useState } from "react";

import { getLanguages } from "../lib/api";

export default function LanguageSelector({
  language,
  onChange,
}) {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch((error) => console.error("Failed to load languages:", error));
  }, []);

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:border-[#8E288D] focus:border-[#8E288D] focus:ring-2 focus:ring-[#8E288D]/10"
      >
        <option value="Auto-detect">🌐 Auto-detect</option>
        {languages.map((item) => (
          <option key={item.name} value={item.name}>
            {item.flag} {item.native}
          </option>
        ))}
      </select>
    </div>
  );
}