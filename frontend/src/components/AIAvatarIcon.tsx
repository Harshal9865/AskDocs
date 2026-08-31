export function AIAvatarIcon({ className, streaming = false }: { className?: string, streaming?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 ${className}`}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#121214]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-[60%] w-[60%] text-white ${streaming ? 'animate-spin' : ''}`}
        >
          <path
            d="M12 2L13.1 8.9L20 10L13.1 11.1L12 18L10.9 11.1L4 10L10.9 8.9L12 2Z"
            fill="url(#aiSparkGrad)"
          />
          <path
            d="M19 18L19.5 20.5L22 21L19.5 21.5L19 24L18.5 21.5L16 21L18.5 20.5L19 18Z"
            fill="url(#aiSparkGrad)"
          />
          <path
            d="M6 18L6.3 19.5L7.8 19.8L6.3 20.1L6 21.6L5.7 20.1L4.2 19.8L5.7 19.5L6 18Z"
            fill="url(#aiSparkGrad)"
          />
          <defs>
            <linearGradient id="aiSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {streaming && (
        <span className="absolute -inset-1 animate-pulse rounded-full border border-purple-500/50" />
      )}
    </div>
  );
}
