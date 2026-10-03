import type { CSSProperties } from "react";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  book: "M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1m0-15c3-2 6-2 9-1v15c-3-1-6-1-9 1V6",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  users:
    "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-2a6 6 0 0 1 12 0v2 M16 4a4 4 0 0 1 0 8 M17 15a5 5 0 0 1 5 5v1",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  upload: "M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 5-5 5-13 0-18",
  logout: "M9 4H4v16h5 M10 12h11 M16 7l5 5-5 5",
  shield: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  close: "M6 6l12 12 M6 18L18 6",
  check: "M5 12l4 4L19 6",
  spark: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  search: "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M16 16l6 6",
  file: "M14 2H4v20h16V8z M14 2v6h6 M8 12h8 M8 16h5",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  eyeOff:
    "M3 3l18 18 M10 5c6-1 12 7 12 7s-2 3-5 5 M6 6c-3 2-4 6-4 6s4 7 10 7c1 0 2 0 3-1",
  folder: "M3 5h6l2 3h10v12H3z",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
  layers: "M12 3l10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5",
  save: "M5 3h12l4 4v14H3V3z M7 3v6h10V3 M7 21v-7h10v7",
  play: "M7 3l14 9-14 9z",
  archive: "M3 3h18v5H3z M5 8v13h14V8 M10 12h4",
  moveUp: "M12 20V4 M6 10l6-6 6 6",
  moveDown: "M12 4v16 M6 14l6 6 6-6",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  edit: "M15 4l5 5 M3 21l5-1L21 7l-5-5L3 15z",
  download: "M12 3v13 M7 11l5 5 5-5 M3 17v4h18v-4",
  mail: "M3 5h18v14H3z M3 5l9 8 9-8",
  lock: "M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z M12 14v3",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  className = "",
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`icon ${className}`}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <path
        d="M11 27V14c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1Z"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M20 15v13" stroke="white" strokeWidth="1.8" />
      <circle cx="28" cy="11" r="5" fill="#c8e99b" />
      <path
        d="m26 11 1.3 1.3L30 9.5"
        stroke="#163b32"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function PathArtwork() {
  return (
    <svg
      className="path-artwork"
      viewBox="0 0 420 310"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="213" cy="153" r="128" fill="#ffffff" fillOpacity=".05" />
      <circle
        cx="213"
        cy="153"
        r="101"
        stroke="#ffffff"
        strokeOpacity=".13"
        strokeDasharray="4 8"
      />
      <path
        d="M85 231c100 0 18-151 130-151s-1 152 119 152"
        stroke="#b8dca2"
        strokeWidth="2.5"
        strokeDasharray="6 7"
      />
      <rect
        x="40"
        y="182"
        width="140"
        height="84"
        rx="18"
        fill="#fff"
        transform="rotate(-8 40 182)"
      />
      <rect x="61" y="194" width="30" height="30" rx="9" fill="#e4f2e9" />
      <path d="M69 211h15m-7-8v16" stroke="#277c63" strokeWidth="2" />
      <path
        d="M102 201h48M102 211h31M61 241h77"
        stroke="#c7d8d0"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect
        x="142"
        y="37"
        width="154"
        height="100"
        rx="18"
        fill="#c8e99b"
        transform="rotate(5 142 37)"
      />
      <rect x="162" y="58" width="32" height="32" rx="10" fill="#163b32" />
      <path
        d="m170 74 6 6 10-13"
        stroke="#dff2d7"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M207 67h64M207 80h46M164 109h93"
        stroke="#78a35c"
        strokeOpacity=".55"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect
        x="257"
        y="184"
        width="128"
        height="85"
        rx="18"
        fill="#fff"
        transform="rotate(8 257 184)"
      />
      <path
        d="M283 209h70M283 225h45M283 241h59"
        stroke="#c7d8d0"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="330" cy="144" r="23" fill="#ebb87a" />
      <path
        d="m322 144 6 6 11-13"
        stroke="#573a1d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="78" cy="116" r="7" fill="#a8cfc0" />
      <path
        d="M357 57v16m-8-8h16"
        stroke="#a8cfc0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
