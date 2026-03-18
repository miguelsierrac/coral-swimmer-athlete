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
	skin_kids_ocean:     { label: 'Océano',     gradient: 'linear-gradient(180deg, #0094FF 0%, #005691 100%)',      textureClass: 'texture-deep-water', isDark: true,  plan: null, accent: '#0094FF' },
	// Adults plan — technical, professional
	skin_adults_clean:   { label: 'Hi-Tech',    gradient: '#F0F9FF',                                                 textureClass: 'texture-dots',       isDark: false, plan: null, accent: '#00C8FF' },
	skin_adults_marea:   { label: 'Cobalto',    gradient: 'linear-gradient(135deg, #005691 0%, #002D4D 100%)',      textureClass: 'texture-waves',      isDark: true,  plan: null, accent: '#00C8FF' },
	skin_adults_deep:    { label: 'Medianoche', gradient: 'linear-gradient(180deg, #002D4D 0%, #001529 100%)',      textureClass: 'texture-deep-water', isDark: true,  plan: null, accent: '#3a7bd5' },
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
