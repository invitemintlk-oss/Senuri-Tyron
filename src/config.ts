export const INVITATION = {
  couple: {
    bride: "Senuri",
    groom: "Tyron",
    brideParents: "Mr. & Mrs. Alwis",
    groomParents: "Mr. & Mrs. Antony",
  },
  date: {
    displayNumeric: "16 . 01 . 2027",
    displayLong: "January 16",
    countdownTarget: "January 16, 2027 15:30:00",
  },
  time: {
    ceremony: "3.30 PM",
    reception: "7.00 PM",
  },
  church: {
    name: "St. Joseph's Church",
    city: "Grandpass",
    googleMapsLink: "https://maps.google.com/?q=St.+Joseph's+Church,+Grandpass,+Colombo",
  },
  venue: {
    name: "Hotel Royal Ramesses",
    hall: "Nefertiti Queen Ballroom",
    address: "Negombo - Colombo Main Road, Seeduwa",
    city: "Seeduwa",
    mapQuery: "Hotel Royal Ramesses, Seeduwa",
    googleMapsLink: "https://maps.google.com/?q=Hotel+Royal+Ramesses,+Seeduwa",
  },
  rsvpBy: "31 December 2026",
  rsvpContacts: [
    "Tyron - 075 600 9837 / 071 234 4006",
    "Senuri - 071 410 6398 / 076 343 0300",
  ],
} as const;

/**
 * Google Apps Script Web App URL (see code.gs).
 * Set VITE_GOOGLE_SCRIPT_URL in .env / Vercel env vars after deploying the script.
 */
export const GOOGLE_SCRIPT_URL =
  import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwcajHelaqARkvE1KU8wHoPGpaXiI5zFqBHJWz694WKc3B_LJs68Wr8HkgCMBOufIQ/exec";

export const GUEST_PREFIXES = ["Mr.", "Mrs.", "Miss", "Mr. & Mrs.", "Family", "Dear"] as const;
export type GuestPrefix = (typeof GUEST_PREFIXES)[number];

/** Collapse repeated whitespace and trim. */
export const cleanName = (name: string) => name.replace(/\s+/g, " ").trim();

/**
 * Combine prefix + name into the guest display name.
 * "Dear" is a message style only, so it is never part of the display name.
 */
export function buildDisplayName(prefix: GuestPrefix, guestName: string): string {
  const name = cleanName(guestName);
  if (!name) return "";
  switch (prefix) {
    case "Family":
      return `${name} and Family`;
    case "Dear":
      return name;
    default:
      return `${prefix} ${name}`;
  }
}

/** Personalized invitation link: {baseURL}/{displayName}, safely URL-encoded. */
export function buildInviteLink(baseUrl: string, displayName: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(displayName)}`;
}

/** Paths that belong to the app itself and must never be read as a guest name. */
const RESERVED_PATHS = new Set(["admin", "index.html"]);

/**
 * Read the guest display name from the current URL.
 * Supports the new path format (/Mr.%20Sanjaya) and the legacy
 * query format (?prefix=Mr.&name=Sanjaya).
 */
export function getGuestDisplayNameFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const legacyName = params.get("name");
  if (legacyName) {
    const legacyPrefix = params.get("prefix") as GuestPrefix | null;
    return legacyPrefix && (GUEST_PREFIXES as readonly string[]).includes(legacyPrefix)
      ? buildDisplayName(legacyPrefix, legacyName)
      : cleanName(legacyName);
  }

  const segment = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (!segment || segment.includes("/") || RESERVED_PATHS.has(segment.toLowerCase())) return "";

  try {
    return cleanName(decodeURIComponent(segment.replace(/\+/g, " ")));
  } catch {
    return "";
  }
}
