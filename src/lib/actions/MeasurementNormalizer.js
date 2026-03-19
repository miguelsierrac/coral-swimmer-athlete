/**
 * MeasurementNormalizer
 *
 * Normalizes the `valores` JSON string from the `mediciones` table into the
 * flat shape the rest of the app already reads.
 *
 * Two on-disk formats exist:
 *
 * V1 (legacy flat — no `_version` key):
 *   { weight, height, fat_percentage, muscle_percentage,
 *     biometrics: {waist, hip, visceral},
 *     nivel_actual_id, progreso_objetivos, specialty: {tool, mode} }
 *
 * V2 (versioned nested — `_version: 2`):
 *   { _version: 2,
 *     biometria: { peso, talla, porcentaje_grasa, porcentaje_musculo,
 *                  cintura, cadera, visceral, ultima_actualizacion },
 *     tecnica:   { nivel_actual_id, progreso_objetivos, specialty,
 *                  ultima_actualizacion } }
 *
 * Output — NormalizedMeasurement — always has the same flat keys so that
 * consumers (buildGameState, $lastMeasurement comparisons, etc.) never need
 * to change. Two extra timestamp fields are added transparently so callers
 * can optionally show "last updated X days ago" without breaking old code.
 *
 * @typedef {Object} NormalizedMeasurement
 * @property {number|null}  weight
 * @property {number|null}  height
 * @property {number|null}  fat_percentage
 * @property {number|null}  muscle_percentage
 * @property {{waist:number|null, hip:number|null, visceral:number|null}|null} biometrics
 * @property {number|null}  nivel_actual_id
 * @property {Record<string, string|null>} progreso_objetivos
 * @property {{tool:string, mode:string}|null} specialty
 * @property {string} _biometrics_last_updated  - dd/MM/yyyy
 * @property {string} _technique_last_updated   - dd/MM/yyyy
 * @property {number} _version  - always 2 after normalization
 */

/** Sentinel date used for records with no known timestamp (V1 migration). */
export const LEGACY_DATE = '01/01/2000';

/**
 * Parses and normalizes a raw `valores` JSON string.
 * Never throws — returns a safe null-filled default on any error.
 *
 * @param {string|null|undefined} jsonString
 * @returns {NormalizedMeasurement}
 */
export function normalizeMeasurement(jsonString) {
	if (!jsonString || typeof jsonString !== 'string') {
		return _safeDefault();
	}

	let parsed;
	try {
		parsed = JSON.parse(jsonString);
	} catch (_) {
		return _safeDefault();
	}

	if (!parsed || typeof parsed !== 'object') {
		return _safeDefault();
	}

	if (parsed._version === 2) {
		return _fromV2(parsed);
	}

	return _fromV1(parsed);
}

/**
 * Returns the number of calendar days elapsed since a dd/MM/yyyy date string.
 * Returns Infinity on parse failure, ensuring alerts always fire for bad dates.
 *
 * @param {string} dateStr  - dd/MM/yyyy
 * @returns {number}
 */
export function daysSince(dateStr) {
	if (!dateStr) return Infinity;
	const [day, month, year] = dateStr.split('/').map(Number);
	if (!day || !month || !year) return Infinity;
	const past = new Date(year, month - 1, day);
	const diffMs = Date.now() - past.getTime();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────

/** Maps a parsed V2 object → NormalizedMeasurement. */
function _fromV2(v2) {
	const bio = v2.biometrics ?? {};
	const tec = v2.technique ?? {};

	const biometrics =
		bio.waist != null || bio.hip != null || bio.visceral != null
			? { waist: bio.waist ?? null, hip: bio.hip ?? null, visceral: bio.visceral ?? null }
			: null;

	return {
		weight: bio.weight ?? null,
		height: bio.height ?? null,
		fat_percentage: bio.fat_percentage ?? null,
		muscle_percentage: bio.muscle_percentage ?? null,
		biometrics,
		nivel_actual_id: tec.nivel_actual_id ?? null,
		progreso_objetivos: tec.progreso_objetivos ?? {},
		specialty: tec.specialty ?? null,
		_biometrics_last_updated: bio.last_updated ?? LEGACY_DATE,
		_technique_last_updated: tec.last_updated ?? LEGACY_DATE,
		_version: 2
	};
}

/** Passes a V1 flat object through, adding the missing timestamp fields. */
function _fromV1(v1) {
	return {
		weight: v1.weight ?? null,
		height: v1.height ?? null,
		fat_percentage: v1.fat_percentage ?? null,
		muscle_percentage: v1.muscle_percentage ?? null,
		biometrics: v1.biometrics ?? null,
		nivel_actual_id: v1.nivel_actual_id ?? null,
		progreso_objetivos: v1.progreso_objetivos ?? {},
		specialty: v1.specialty ?? null,
		// V1 records have no timestamps — use LEGACY_DATE so consumers know they're stale
		_biometrics_last_updated: LEGACY_DATE,
		_technique_last_updated: LEGACY_DATE,
		_version: 2
	};
}

/** Safe default returned when the JSON is null/empty/malformed. */
function _safeDefault() {
	return {
		weight: null,
		height: null,
		fat_percentage: null,
		muscle_percentage: null,
		biometrics: null,
		nivel_actual_id: null,
		progreso_objetivos: {},
		specialty: null,
		_biometrics_last_updated: LEGACY_DATE,
		_technique_last_updated: LEGACY_DATE,
		_version: 2
	};
}
