/** Branded 404 illustration: empty carton with open lid. */
export default function NotFoundIllustration() {
  return (
    <svg
      className="not-found-illustration"
      viewBox="0 0 320 240"
      width={320}
      height={240}
      role="img"
      aria-labelledby="not-found-illustration-title"
    >
      <title id="not-found-illustration-title">
        Empty open packaging box illustration
      </title>
      <defs>
        <linearGradient id="nf-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8edf4" />
          <stop offset="1" stopColor="#d5dde8" />
        </linearGradient>
        <radialGradient id="nf-glow" cx="50%" cy="40%" r="55%">
          <stop offset="0" stopColor="#2563eb" stopOpacity="0.14" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nf-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#dbe4ef" />
        </linearGradient>
      </defs>

      <rect width="320" height="240" rx="20" fill="url(#nf-floor)" />
      <rect width="320" height="240" rx="20" fill="url(#nf-glow)" />

      <g transform="translate(160 148)">
        <path fill="#8b6b45" d="M-72 18 L0 58 L72 18 L72 78 L0 118 L-72 78 Z" />
        <path fill="#6f5435" d="M-72 18 L-72 78 L0 118 L0 58 Z" />
        <path fill="#a88458" d="M72 18 L72 78 L0 118 L0 58 Z" />
        <path fill="#c9a56f" d="M-72 18 L0 -22 L72 18 L0 58 Z" />
        <path
          fill="none"
          stroke="#2563eb"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          d="M-72 18 L0 58 L72 18"
        />
      </g>

      <g transform="translate(228 72) rotate(18)">
        <path fill="url(#nf-lid)" stroke="#c5d0de" strokeWidth="1.5" d="M-54 -10 L54 -10 L54 34 L-54 34 Z" />
        <path fill="#eef2f7" d="M-54 -10 L0 -34 L54 -10 L0 14 Z" />
        <path
          fill="none"
          stroke="#2563eb"
          strokeOpacity="0.4"
          strokeWidth="1.25"
          d="M-54 -10 L0 14 L54 -10"
        />
      </g>

      <text
        x="160"
        y="52"
        textAnchor="middle"
        fontFamily="var(--landing-display, Outfit, system-ui, sans-serif)"
        fontSize="42"
        fontWeight="800"
        letterSpacing="-0.04em"
        fill="#0f172a"
        opacity="0.92"
      >
        404
      </text>

      <circle cx="58" cy="54" r="3" fill="#2563eb" opacity="0.35" />
      <circle cx="262" cy="176" r="4" fill="#2563eb" opacity="0.22" />
      <circle cx="278" cy="48" r="2.5" fill="#2563eb" opacity="0.28" />
    </svg>
  );
}
