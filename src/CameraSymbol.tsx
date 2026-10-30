export type CameraSymbolName =
  | "rehearsal"
  | "water"
  | "terrain3d"
  | "map2d"
  | "flyby"
  | "walk"
  | "overview"
  | "queue"
  | "compare"
  | "console"
  | "sources"
  | "plan"
  | "drill"
  | "satellite"
  | "dhaka";

/**
 * Icon set for the rehearsal console. Every control carries an icon so the bar reads as a
 * console rather than a row of words; the accessible name stays on the button itself.
 */
export function CameraSymbol({ name }: { name: CameraSymbolName }) {
  return (
    <svg
      className="nav-symbol"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "rehearsal" && (
        <>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 20a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-2.2-4.6" />
        </>
      )}
      {name === "water" && (
        <>
          <path d="M2 9c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" />
          <path d="M2 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 4.5-2.5 6 0" />
        </>
      )}
      {name === "terrain3d" && (
        <>
          <path d="m12 2.8 8.5 4.6v9.2L12 21.2 3.5 16.6V7.4Z" />
          <path d="M3.5 7.4 12 12l8.5-4.6M12 12v9.2" />
        </>
      )}
      {name === "map2d" && (
        <>
          <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5Z" />
          <path d="M9 4v13.5M15 6.5V20" />
        </>
      )}
      {name === "flyby" && (
        <>
          <path d="M21 3 3 10.5l7 2.5 2.5 7Z" />
          <path d="m10 13 4-4" />
        </>
      )}
      {name === "walk" && (
        <>
          <circle cx="13" cy="4" r="1.8" />
          <path d="m11 21 2-5.5-2.5-2.5.8-4.5 3.4 2 2.6 1M9 12.5 6 15M13 15.5l2.4 2.4.6 3.1" />
        </>
      )}
      {name === "overview" && (
        <>
          <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.6" />
        </>
      )}
      {name === "queue" && (
        <>
          <path d="M4 6h9M4 12h9M4 18h6" />
          <circle cx="18" cy="6" r="1.6" />
          <circle cx="18" cy="12" r="1.6" />
          <circle cx="16" cy="18" r="1.6" />
        </>
      )}
      {name === "compare" && (
        <>
          <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
        </>
      )}
      {name === "console" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1.5" />
          <path d="M7 9h10M7 13h6M7 17h4" />
        </>
      )}
      {name === "sources" && (
        <>
          <path d="M4 4.5h7l2 2.5h7v13H4Z" />
          <path d="M8 13h8M8 16.5h5" />
        </>
      )}
      {name === "plan" && (
        <>
          <path d="M9 4H5v17h14V4h-4M9 3h6v4H9Z" />
          <path d="m8.5 14 2.5 2.5 4.5-5" />
        </>
      )}
      {name === "drill" && (
        <>
          <circle cx="15" cy="4" r="2" />
          <path d="m10 10 3-3 3 4 4 1M13 7l-2 7 4 3 1 5M11 14l-3 5H3M6 8l4 2" />
        </>
      )}
      {name === "satellite" && (
        <>
          <path d="m9 7 8 8-3 3-8-8Z" />
          <path d="m3 5 3-3 4 4-3 3ZM15 17l3-3 4 4-3 3ZM14 4a7 7 0 0 1 6 6M14 8a3 3 0 0 1 2 2" />
        </>
      )}
    </svg>
  );
}
