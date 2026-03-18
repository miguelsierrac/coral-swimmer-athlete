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
