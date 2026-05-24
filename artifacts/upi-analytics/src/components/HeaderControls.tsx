import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ChevronDown, Check, Sun, Moon, Printer } from "lucide-react";
import { useTheme } from "next-themes";

const INTERVAL_OPTIONS = [
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
  { label: "Every 24 hours", ms: 24 * 60 * 60 * 1000 },
];

export function HeaderControls({ loading }: { loading: boolean }) {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIntervalMs, setSelectedIntervalMs] = useState(5 * 60 * 1000);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
      return;
    }
    const t = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries();
    }, selectedIntervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedIntervalMs, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
            color: isDark ? "#c8c9cc" : "#4b5563",
          }}
        >
          <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
          <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-md z-50 py-1 text-sm">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(a => !a)}
                className={`w-8 h-4 rounded-full relative transition-colors ${autoRefresh ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            {INTERVAL_OPTIONS.map(opt => (
              <button
                key={opt.ms}
                onClick={() => {
                  setSelectedIntervalMs(opt.ms);
                  setAutoRefresh(true);
                  setDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent flex items-center justify-between"
              >
                <span>{opt.label}</span>
                {selectedIntervalMs === opt.ms && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => window.print()}
        disabled={loading}
        className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-50"
        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        aria-label="Export as PDF"
      >
        <Printer className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
      >
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
