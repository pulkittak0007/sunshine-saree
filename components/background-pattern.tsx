export default function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/5 via-transparent to-gold-500/5"></div>
      <svg
        className="absolute top-0 left-0 w-full h-full opacity-5"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern
            id="saree-pattern"
            patternUnits="userSpaceOnUse"
            width="100"
            height="100"
            patternTransform="rotate(45)"
          >
            <path d="M0 50 L100 50 M50 0 L50 100" stroke="#7C1A34" strokeWidth="1" fill="none" />
            <path d="M25 25 L75 75 M75 25 L25 75" stroke="#D19E1F" strokeWidth="0.5" fill="none" />
            <circle cx="50" cy="50" r="10" fill="#7C1A34" fillOpacity="0.1" />
            <circle cx="50" cy="50" r="5" fill="#D19E1F" fillOpacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#saree-pattern)" />
      </svg>
    </div>
  )
}

