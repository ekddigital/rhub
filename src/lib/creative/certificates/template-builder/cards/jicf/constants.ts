/**
 * JICF Brand Colors and Decorations
 */

// JICF Brand Colors
export const JICF_COLORS = {
  red: "#ed1c24",
  blue: "#190570",
  yellow: "#efe31e",
  white: "#ffffff",
  lightGray: "#f8f9fa",
  darkGray: "#343a40",
  gold: "#ffd700",
  lightBlue: "#e3f2fd",
  lightRed: "#ffebee",
  lightYellow: "#fffde7",
  purple: "#8e24aa",
  green: "#4caf50",
  darkBlue: "#0d47a1",
};

// Beautiful floral SVG decorations
export const FLORAL_DECORATIONS = {
  roseCorner: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.7">
      <!-- Rose petals -->
      <path d="M20,50 Q30,30 50,40 Q70,30 80,50 Q70,70 50,60 Q30,70 20,50" fill="${JICF_COLORS.red}" opacity="0.8"/>
      <path d="M25,50 Q35,35 50,45 Q65,35 75,50 Q65,65 50,55 Q35,65 25,50" fill="${JICF_COLORS.red}" opacity="0.6"/>
      <path d="M30,50 Q40,40 50,50 Q60,40 70,50 Q60,60 50,50 Q40,60 30,50" fill="${JICF_COLORS.red}" opacity="0.4"/>
      <!-- Leaves -->
      <path d="M15,60 Q25,70 35,65 Q30,55 15,60" fill="#4caf50" opacity="0.6"/>
      <path d="M65,35 Q75,25 85,30 Q80,40 65,35" fill="#4caf50" opacity="0.6"/>
      <!-- Stems -->
      <line x1="50" y1="50" x2="45" y2="80" stroke="#4caf50" stroke-width="2" opacity="0.6"/>
    </g>
  </svg>`,

  floralBorder: `<svg viewBox="0 0 400 50" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.6">
      <!-- Repeating floral pattern -->
      <g>
        <circle cx="25" cy="25" r="8" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
        <circle cx="20" cy="20" r="6" fill="${JICF_COLORS.red}" opacity="0.8"/>
        <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="#4caf50" opacity="0.6"/>
      </g>
      <g transform="translate(80,0)">
        <circle cx="25" cy="25" r="8" fill="${JICF_COLORS.red}" opacity="0.7"/>
        <circle cx="30" cy="20" r="6" fill="${JICF_COLORS.yellow}" opacity="0.8"/>
        <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="#4caf50" opacity="0.6"/>
      </g>
      <g transform="translate(160,0)">
        <circle cx="25" cy="25" r="8" fill="${JICF_COLORS.blue}" opacity="0.7"/>
        <circle cx="20" cy="30" r="6" fill="${JICF_COLORS.yellow}" opacity="0.8"/>
        <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="#4caf50" opacity="0.6"/>
      </g>
      <g transform="translate(240,0)">
        <circle cx="25" cy="25" r="8" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
        <circle cx="30" cy="30" r="6" fill="${JICF_COLORS.red}" opacity="0.8"/>
        <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="#4caf50" opacity="0.6"/>
      </g>
      <g transform="translate(320,0)">
        <circle cx="25" cy="25" r="8" fill="${JICF_COLORS.red}" opacity="0.7"/>
        <circle cx="20" cy="20" r="6" fill="${JICF_COLORS.blue}" opacity="0.8"/>
        <path d="M15,25 Q25,15 35,25 Q25,35 15,25" fill="#4caf50" opacity="0.6"/>
      </g>
    </g>
  </svg>`,

  elegantRoses: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.8">
      <!-- Large rose -->
      <g transform="translate(100,100)">
        <circle cx="0" cy="0" r="25" fill="${JICF_COLORS.red}" opacity="0.3"/>
        <circle cx="0" cy="0" r="20" fill="${JICF_COLORS.red}" opacity="0.5"/>
        <circle cx="0" cy="0" r="15" fill="${JICF_COLORS.red}" opacity="0.7"/>
        <circle cx="0" cy="0" r="10" fill="${JICF_COLORS.red}" opacity="0.9"/>
      </g>
      <!-- Smaller roses -->
      <g transform="translate(150,50)">
        <circle cx="0" cy="0" r="15" fill="${JICF_COLORS.yellow}" opacity="0.7"/>
        <circle cx="0" cy="0" r="10" fill="${JICF_COLORS.yellow}" opacity="0.9"/>
      </g>
      <g transform="translate(50,150)">
        <circle cx="0" cy="0" r="12" fill="${JICF_COLORS.blue}" opacity="0.7"/>
        <circle cx="0" cy="0" r="8" fill="${JICF_COLORS.blue}" opacity="0.9"/>
      </g>
      <!-- Leaves and stems -->
      <path d="M100,125 Q80,160 60,180" stroke="#4caf50" stroke-width="3" fill="none" opacity="0.6"/>
      <path d="M100,125 Q120,160 140,180" stroke="#4caf50" stroke-width="3" fill="none" opacity="0.6"/>
      <ellipse cx="85" cy="140" rx="8" ry="15" fill="#4caf50" opacity="0.6" transform="rotate(-30 85 140)"/>
      <ellipse cx="115" cy="140" rx="8" ry="15" fill="#4caf50" opacity="0.6" transform="rotate(30 115 140)"/>
    </g>
  </svg>`,
};
