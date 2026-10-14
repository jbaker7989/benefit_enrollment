export interface OrbitGuideProps {
  status: "idle" | "listening" | "thinking" | "success" | "warning";
  statusText: string;
}

const statusColor = {
  idle: "#9ca3af",
  listening: "#22c55e",
  thinking: "#2563eb",
  success: "#16a34a",
  warning: "#ca8a04",
};

/**
 * Restrained alien-spaceship guide. Green status lights are decorative;
 * the real status is provided as text. Stays still under reduced motion.
 */
export function OrbitGuide({ status, statusText }: OrbitGuideProps) {
  const primary = statusColor[status];

  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm"
      aria-label={`Guide status: ${statusText}`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <ellipse cx="16" cy="16" rx="14" ry="8" fill="#f8f4e9" stroke="#183143" strokeWidth="1" />
        <ellipse cx="16" cy="15" rx="7" ry="4" fill="#183143" />
        <circle cx="10" cy="16" r="2.5" fill={primary} />
        <circle className="mc-guide-light" cx="16" cy="16" r="3.5" fill="#22c55e" opacity="0.8" />
        <circle className="mc-guide-light" cx="22" cy="16" r="2" fill="#22c55e" opacity="0.65" />
      </svg>
      <span className="text-sm font-medium text-gray-700">{statusText}</span>
    </div>
  );
}
