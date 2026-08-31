export function AIAvatarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="12" fill="url(#aiGrad)" />
      <path
        d="M8.5 10C8.5 9.17157 9.17157 8.5 10 8.5H14C14.8284 8.5 15.5 9.17157 15.5 10V14C15.5 14.8284 14.8284 15.5 14 15.5H10C9.17157 15.5 8.5 14.8284 8.5 14V10Z"
        fill="white"
        fillOpacity="0.2"
      />
      <circle cx="10" cy="11.5" r="1" fill="white" />
      <circle cx="14" cy="11.5" r="1" fill="white" />
      <path
        d="M10.5 14C10.5 14 11 14.5 12 14.5C13 14.5 13.5 14 13.5 14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 5V8.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="4" r="1" fill="white" />
      <path
        d="M6 12H8.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 12H15.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
