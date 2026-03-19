import { describe, it, expect } from 'vitest';
import { normalizeMeasurement, daysSince, LEGACY_DATE } from '../src/lib/actions/MeasurementNormalizer.js';

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const V2_JSON = JSON.stringify({
	_version: 2,
	biometrics: {
		weight: 72.5,
		height: 175.0,
		fat_percentage: 14.2,
		muscle_percentage: 41.0,
		waist: 80.0,
		hip: 90.0,
		visceral: 5.0,
		last_updated: '15/01/2026'
	},
	technique: {
		nivel_actual_id: 3,
		progreso_objetivos: { obj1: 'bronce', obj2: 'plata', obj3: null },
		specialty: { tool: 'Monoaleta', mode: 'Velocidad' },
		last_updated: '01/03/2026'
	}
});

const V1_JSON = JSON.stringify({
	weight: 68.0,
	height: 170.0,
	fat_percentage: 16.5,
	muscle_percentage: 38.0,
	biometrics: { waist: 75.0, hip: 88.0, visceral: 4.0 },
	nivel_actual_id: 2,
	progreso_objetivos: { patada: 'bronce', brazada: 'plata' },
	specialty: { tool: 'Bialetas', mode: 'Fondo' }
});

const V1_MINIMAL_JSON = JSON.stringify({
	weight: 60.0,
	height: 165.0,
	nivel_actual_id: 1,
	progreso_objetivos: {}
});

// ─────────────────────────────────────────────
// normalizeMeasurement — V2 input
// ─────────────────────────────────────────────

describe('normalizeMeasurement — V2 input', () => {
	it('maps biometria fields to flat weight/height/etc.', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r.weight).toBe(72.5);
		expect(r.height).toBe(175.0);
		expect(r.fat_percentage).toBe(14.2);
		expect(r.muscle_percentage).toBe(41.0);
	});

	it('maps biometria sub-fields to biometrics object', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r.biometrics).toEqual({ waist: 80.0, hip: 90.0, visceral: 5.0 });
	});

	it('maps tecnica.nivel_actual_id', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r.nivel_actual_id).toBe(3);
	});

	it('maps tecnica.progreso_objetivos preserving null values', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r.progreso_objetivos).toEqual({ obj1: 'bronce', obj2: 'plata', obj3: null });
	});

	it('maps tecnica.specialty', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r.specialty).toEqual({ tool: 'Monoaleta', mode: 'Velocidad' });
	});

	it('exposes biometria timestamp in _biometrics_last_updated', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r._biometrics_last_updated).toBe('15/01/2026');
	});

	it('exposes tecnica timestamp in _technique_last_updated', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r._technique_last_updated).toBe('01/03/2026');
	});

	it('always sets _version to 2', () => {
		const r = normalizeMeasurement(V2_JSON);
		expect(r._version).toBe(2);
	});
});

// ─────────────────────────────────────────────
// normalizeMeasurement — V1 input
// ─────────────────────────────────────────────

describe('normalizeMeasurement — V1 input', () => {
	it('passes through weight and height unchanged', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r.weight).toBe(68.0);
		expect(r.height).toBe(170.0);
	});

	it('passes through fat/muscle percentages', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r.fat_percentage).toBe(16.5);
		expect(r.muscle_percentage).toBe(38.0);
	});

	it('passes through biometrics object', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r.biometrics).toEqual({ waist: 75.0, hip: 88.0, visceral: 4.0 });
	});

	it('passes through nivel_actual_id and progreso_objetivos', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r.nivel_actual_id).toBe(2);
		expect(r.progreso_objetivos).toEqual({ patada: 'bronce', brazada: 'plata' });
	});

	it('passes through specialty', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r.specialty).toEqual({ tool: 'Bialetas', mode: 'Fondo' });
	});

	it('assigns LEGACY_DATE to both timestamp fields', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r._biometrics_last_updated).toBe(LEGACY_DATE);
		expect(r._technique_last_updated).toBe(LEGACY_DATE);
	});

	it('sets _version to 2', () => {
		const r = normalizeMeasurement(V1_JSON);
		expect(r._version).toBe(2);
	});

	it('handles V1 without optional fields gracefully', () => {
		const r = normalizeMeasurement(V1_MINIMAL_JSON);
		expect(r.fat_percentage).toBeNull();
		expect(r.biometrics).toBeNull();
		expect(r.specialty).toBeNull();
		expect(r.nivel_actual_id).toBe(1);
	});
});

// ─────────────────────────────────────────────
// normalizeMeasurement — edge cases
// ─────────────────────────────────────────────

describe('normalizeMeasurement — edge cases', () => {
	it('returns safe default for null input', () => {
		const r = normalizeMeasurement(null);
		expect(r.weight).toBeNull();
		expect(r.nivel_actual_id).toBeNull();
		expect(r.progreso_objetivos).toEqual({});
		expect(r._biometrics_last_updated).toBe(LEGACY_DATE);
		expect(r._technique_last_updated).toBe(LEGACY_DATE);
		expect(r._version).toBe(2);
	});

	it('returns safe default for empty string', () => {
		const r = normalizeMeasurement('');
		expect(r.weight).toBeNull();
		expect(r._biometrics_last_updated).toBe(LEGACY_DATE);
	});

	it('returns safe default for malformed JSON', () => {
		const r = normalizeMeasurement('{not valid!!!}');
		expect(r.weight).toBeNull();
		expect(r._version).toBe(2);
	});

	it('returns safe default for non-string input', () => {
		const r = normalizeMeasurement(42);
		expect(r.weight).toBeNull();
	});

	it('V2 with missing biometria block still returns safe defaults for those fields', () => {
		const json = JSON.stringify({
			_version: 2,
			technique: {
				nivel_actual_id: 4,
				progreso_objetivos: {},
				last_updated: '01/03/2026'
			}
		});
		const r = normalizeMeasurement(json);
		expect(r.weight).toBeNull();
		expect(r.biometrics).toBeNull();
		expect(r._biometrics_last_updated).toBe(LEGACY_DATE);
		expect(r.nivel_actual_id).toBe(4);
	});

	it('V2 with missing tecnica block still returns safe defaults for those fields', () => {
		const json = JSON.stringify({
			_version: 2,
			biometrics: { weight: 70, height: 172, last_updated: '10/03/2026' }
		});
		const r = normalizeMeasurement(json);
		expect(r.weight).toBe(70);
		expect(r.nivel_actual_id).toBeNull();
		expect(r.progreso_objetivos).toEqual({});
		expect(r._technique_last_updated).toBe(LEGACY_DATE);
	});
});

// ─────────────────────────────────────────────
// daysSince
// ─────────────────────────────────────────────

describe('daysSince', () => {
	it('returns Infinity for LEGACY_DATE (very old)', () => {
		// LEGACY_DATE is 01/01/2000 — well over 30 days ago
		const days = daysSince(LEGACY_DATE);
		expect(days).toBeGreaterThan(30);
	});

	it('returns a small number for today', () => {
		const today = new Date();
		const dd = String(today.getDate()).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const yyyy = today.getFullYear();
		const todayStr = `${dd}/${mm}/${yyyy}`;
		expect(daysSince(todayStr)).toBe(0);
	});

	it('returns Infinity for null/undefined/empty', () => {
		expect(daysSince(null)).toBe(Infinity);
		expect(daysSince(undefined)).toBe(Infinity);
		expect(daysSince('')).toBe(Infinity);
	});

	it('returns Infinity for unparseable date string', () => {
		expect(daysSince('not-a-date')).toBe(Infinity);
	});
});
