export const getInitialAvatar = (name = "M") => {
  const initial = String(name || "M").trim().charAt(0).toUpperCase() || "M";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="320" height="320" fill="#071126"/>
      <circle cx="160" cy="116" r="72" fill="#00f7ff" opacity="0.92"/>
      <path d="M48 305c15-72 59-108 112-108s97 36 112 108" fill="#0f172a"/>
      <text x="160" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="#020617">${initial}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
