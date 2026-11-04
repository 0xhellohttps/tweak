// Naming is configurable per the spec. The existing tweakmo.de brand calls its
// community space "The Room", so communities are ROOMS by default.
export const COMMUNITY_NOUN = "Room";
export const COMMUNITY_NOUN_PLURAL = "Rooms";

export const ACCOUNT_ROLES = [
  "LISTENER",
  "DJ",
  "PRODUCER",
  "ARTIST",
  "LABEL",
  "COLLECTIVE",
  "PROMOTER",
  "VENUE",
  "RADIO",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const GENRES = [
  "techno",
  "house",
  "acid",
  "electro",
  "dnb",
  "jungle",
  "breaks",
  "ambient",
  "idm",
  "hardgroove",
  "trance",
  "dub",
  "gabber",
  "footwork",
  "ebm",
  "industrial",
  "rage",
  "experimental",
] as const;

// Controlled customization: users pick from these, never arbitrary CSS.
// "hot" is the tweakmo.de brand red and the default.
export const ACCENTS: Record<string, { label: string; hex: string }> = {
  hot: { label: "HOT", hex: "#ff2400" },
  acid: { label: "ACID", hex: "#c8ff00" },
  volt: { label: "VOLT", hex: "#4da6ff" },
  strobe: { label: "STROBE", hex: "#ff4dc4" },
  sodium: { label: "SODIUM", hex: "#ffb224" },
};

export const PROFILE_BGS: Record<string, { label: string }> = {
  void: { label: "VOID" },
  static: { label: "STATIC" },
  grid: { label: "GRID" },
  haze: { label: "HAZE" },
  scanline: { label: "SCANLINE" },
};

export const PROFILE_SECTIONS: Record<string, string> = {
  featured: "FEATURED TRACK",
  posts: "TRANSMISSIONS",
  tracks: "TRACKS",
  circles: "ROOMS",
  friends: "TOP FRIENDS",
  about: "ABOUT",
};

export const DEFAULT_SECTION_ORDER = "featured,posts,tracks,circles,friends,about";
