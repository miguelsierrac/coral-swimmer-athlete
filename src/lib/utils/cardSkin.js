/**
 * Returns card skin configuration based on level ID.
 * Kids plan:   level IDs 1–6
 * Adults plan: level IDs 7–12
 *
 * @param {number|null} levelId
 * @returns {{ gradient: string, textureClass: string, isDark: boolean, plan: 'kids'|'adults'|null, accent: string }}
 */
export function getCardSkin(levelId) {
	if (!levelId || typeof levelId !== 'number') return DEFAULT_SKIN;

	if (levelId <= 2) {
		// Kids – early stages: Burbujas (yellow → orange)
		return {
			gradient: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
			textureClass: 'texture-bubbles',
			isDark: false,
			plan: 'kids',
			accent: '#f97316'
		};
	}
	if (levelId <= 4) {
		// Kids – mid stages: Ondas (green → cyan)
		return {
			gradient: 'linear-gradient(135deg, #4ade80 0%, #06b6d4 100%)',
			textureClass: 'texture-waves',
			isDark: false,
			plan: 'kids',
			accent: '#06b6d4'
		};
	}
	if (levelId <= 6) {
		// Kids – advanced: Agua Profunda (blue → indigo)
		return {
			gradient: 'linear-gradient(135deg, #60a5fa 0%, #4338ca 100%)',
			textureClass: 'texture-deep-water',
			isDark: true,
			plan: 'kids',
			accent: '#818cf8'
		};
	}
	if (levelId <= 8) {
		// Adults – beginner: Mesh Técnico (slate → light blue)
		return {
			gradient: 'linear-gradient(135deg, #f1f5f9 0%, #bfdbfe 100%)',
			textureClass: 'texture-mesh',
			isDark: false,
			plan: 'adults',
			accent: '#3b82f6'
		};
	}
	if (levelId <= 10) {
		// Adults – intermediate: Líneas de Velocidad (blue → slate-900)
		return {
			gradient: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
			textureClass: 'texture-speed-lines',
			isDark: true,
			plan: 'adults',
			accent: '#60a5fa'
		};
	}
	// Adults – elite (11–12): Fibra de Carbono / Vortex (gray-900 → purple-950 → black)
	return {
		gradient: 'linear-gradient(135deg, #111827 0%, #581c87 50%, #000000 100%)',
		textureClass: 'texture-carbon',
		isDark: true,
		plan: 'adults',
		accent: '#a855f7'
	};
}

const DEFAULT_SKIN = {
	gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
	textureClass: '',
	isDark: false,
	plan: null,
	accent: '#4285f4'
};

/**
 * Catalog of unlockable skins keyed by reward ID from the gamification config.
 * Each entry matches the shape returned by getCardSkin().
 */
const SKIN_CATALOG = {
	// Kids plan — bright, playful
	skin_kids_sunny:     { label: 'Soleado',    gradient: 'radial-gradient(circle at top right, #6EE7FF, #00C8FF)', textureClass: 'texture-bubbles',    isDark: false, plan: null, accent: '#00C8FF' },
	skin_kids_reef:      { label: 'Arrecife',   gradient: 'linear-gradient(135deg, #00D2FF 0%, #3a7bd5 100%)',      textureClass: 'texture-waves',      isDark: true,  plan: null, accent: '#00D2FF' },
	skin_kids_ocean:     { label: 'Océano',     gradient: 'linear-gradient(180deg, #0094FF 0%, #005691 100%)',      textureClass: 'texture-ocean',    isDark: true,  plan: null, accent: '#0094FF' },
	// Adults plan — technical, professional
	skin_adults_clean:   { label: 'Hi-Tech',    gradient: 'linear-gradient(160deg, #E8F8FF 0%, #F0F9FF 50%, #D6F0FF 100%)',  textureClass: 'texture-hitech',   isDark: false, plan: null, accent: '#00C8FF' },
	skin_adults_marea:   { label: 'Cobalto',    gradient: 'linear-gradient(135deg, #005691 0%, #002D4D 100%)',      textureClass: 'texture-waves',    isDark: true,  plan: null, accent: '#00C8FF' },
	skin_adults_deep:    { label: 'Medianoche', gradient: 'linear-gradient(180deg, #002D4D 0%, #001529 100%)',      textureClass: 'texture-midnight', isDark: true,  plan: null, accent: '#3a7bd5' },
	// Élite — max contrast
	skin_adults_vortex:  { label: 'Vórtex',    gradient: 'radial-gradient(circle, #005691 0%, #000814 100%)',      textureClass: 'texture-vortex',     isDark: true,  plan: null, accent: '#00C8FF' },
	skin_adults_abyssal: { label: 'Abismo',     gradient: 'linear-gradient(135deg, #000814 0%, #050505 100%)',      textureClass: 'texture-abyssal',    isDark: true,  plan: null, accent: '#005691' },
};

/**
 * Returns a skin configuration by reward ID, or null if not found.
 * @param {string} skinId
 * @returns {{ gradient: string, textureClass: string, isDark: boolean, plan: null, accent: string }|null}
 */
export function getSkinById(skinId) {
	const s = SKIN_CATALOG[skinId];
	return s ?? null;
}

/**
 * Returns all unlockable skins as an array for use in the skin picker UI.
 * @returns {{ id: string, label: string, gradient: string, isDark: boolean, accent: string }[]}
 */
export function getAllSkins() {
	return Object.entries(SKIN_CATALOG).map(([id, s]) => ({ id, ...s }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Frame catalog — earned card border effects
// frameClass is applied as a CSS class on .card-face.card-front.
// The actual styles live in MemberCardScreen.svelte (supports @keyframes).
// ─────────────────────────────────────────────────────────────────────────────
const FRAME_CATALOG = {
	// Kids plan
	frame_kids_cyan:       { label: 'Cian',        color: '#22d3ee', frameClass: 'frame-kids-cyan' },
	frame_kids_blue:       { label: 'Azul',        color: '#2563eb', frameClass: 'frame-kids-blue' },
	frame_orca_dark:       { label: 'Orca Dark',   color: '#1e293b', frameClass: 'frame-orca-dark' },
	// Adults & élite
	frame_flow_eterno:     { label: 'Flow',        color: '#2dd4bf', frameClass: 'frame-flow-eterno' },
	frame_neon_turbo:      { label: 'Neón Turbo',  color: '#22d3ee', frameClass: 'frame-neon-turbo' },
	frame_vortex_neon:     { label: 'Vórtex',      color: '#818cf8', frameClass: 'frame-vortex-neon' },
	frame_titan_holograma: { label: 'Titán Holo',  color: '#a5f3fc', frameClass: 'frame-titan-holograma' },
};

/**
 * Returns a frame configuration by reward ID, or null if not found.
 * @param {string} frameId
 * @returns {{ label: string, color: string, frameClass: string }|null}
 */
export function getFrameById(frameId) {
	return FRAME_CATALOG[frameId] ?? null;
}

/**
 * Returns all unlockable frames as an array for use in the frame picker UI.
 * @returns {{ id: string, label: string, color: string, frameClass: string }[]}
 */
export function getAllFrames() {
	return Object.entries(FRAME_CATALOG).map(([id, f]) => ({ id, ...f }));
}
