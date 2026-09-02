export function AIAvatarIcon({
  className = "h-8 w-8",
  size,
  streaming = false,
}: {
  className?: string;
  size?: number;
  streaming?: boolean;
}) {
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      style={sizeStyle}
      className={`relative inline-flex items-center justify-center rounded-2xl transition-transform duration-300 select-none ${className}`}
    >
      {/* Outer ambient cosmic glow */}
      <div
        className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 opacity-40 blur-sm transition-opacity duration-500 ${
          streaming ? "opacity-90 animate-pulse" : "group-hover:opacity-75"
        }`}
      />

      {/* Orbiting halo ring when streaming */}
      {streaming && (
        <div className="absolute -inset-1.5 rounded-2xl border border-cyan-400/60 animate-spin [animation-duration:3s]" />
      )}

      {/* Main Glass Icon Vessel */}
      <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#1c1836] via-[#101026] to-[#0c0a1a] shadow-inner backdrop-blur-md overflow-hidden">
        {/* Subtle internal aurora mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.3),transparent_60%)]" />

        {/* Neural Prism Sparkle SVG */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 h-[68%] w-[68%] transition-transform duration-300 ${
            streaming ? "animate-pulse" : ""
          }`}
        >
          {/* Main 4-Point Neural Star */}
          <path
            d="M16 2.5 C16 9.5 9.5 16 2.5 16 C9.5 16 16 22.5 16 29.5 C16 22.5 22.5 16 29.5 16 C22.5 16 16 9.5 16 2.5 Z"
            fill="url(#cosmicPrismGrad)"
            stroke="url(#prismStrokeGrad)"
            strokeWidth="0.75"
          />

          {/* Central Luminous Core */}
          <circle cx="16" cy="16" r="3" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="16" cy="16" r="1.5" fill="#E0E7FF" />

          {/* Top-Right Secondary Sparkle */}
          <path
            d="M24.5 4 C24.5 6.8 22.3 9 19.5 9 C22.3 9 24.5 11.2 24.5 14 C24.5 11.2 26.7 9 29.5 9 C26.7 9 24.5 6.8 24.5 4 Z"
            fill="url(#cyanSparkGrad)"
          />

          {/* Bottom-Left Micro Sparkle */}
          <path
            d="M7.5 22 C7.5 23.8 6.2 25 4.5 25 C6.2 25 7.5 26.2 7.5 28 C7.5 26.2 8.8 25 10.5 25 C8.8 25 7.5 23.8 7.5 22 Z"
            fill="url(#purpleSparkGrad)"
          />

          {/* Color Gradients */}
          <defs>
            <linearGradient id="cosmicPrismGrad" x1="2.5" y1="2.5" x2="29.5" y2="29.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="35%" stopColor="#818CF8" />
              <stop offset="70%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="prismStrokeGrad" x1="16" y1="2.5" x2="16" y2="29.5" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="cyanSparkGrad" x1="19.5" y1="4" x2="29.5" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="purpleSparkGrad" x1="4.5" y1="22" x2="10.5" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

