/**
 * @typedef {Object} Grade
 * @property {string} criterio
 * @property {number} puntos
 * @property {boolean} es_requisito
 */

/**
 * @typedef {Object} Objective
 * @property {string} id
 * @property {string} nombre
 * @property {string} icono
 * @property {string} descripcion
 * @property {{bronce: Grade, plata: Grade, oro: Grade}} grados
 */

/**
 * @typedef {'kids' | 'adults'} Plan
 */

/**
 * @typedef {Object} Level
 * @property {number} id
 * @property {string} nombre
 * @property {Plan} plan
 * @property {number | null} nivel_anterior
 * @property {number | null} nivel_siguiente
 * @property {number} puntaje_base
 * @property {string} icono
 * @property {string} color
 * @property {string} descripcion
 * @property {string | Objective[]} objetivos - Serialized JSON string or parsed array
 */

/**
 * @typedef {Record<string, 'bronce' | 'plata' | 'oro' | null>} ObjectiveProgress
 */

/**
 * @typedef {import('./MeasurementNormalizer').NormalizedMeasurement} MeasurementValues
 *
 * Flat measurement shape consumed by buildGameState and $lastMeasurement comparisons.
 * Both V1 (legacy flat) and V2 (nested biometria/tecnica) on-disk formats are
 * transparently normalized to this shape by MeasurementNormalizer.
 */

/**
 * @typedef {Object} Measurement
 * @property {number} id
 * @property {string} fecha
 * @property {string} deportista_id
 * @property {string} valores // JSON string
 */

import { normalizeMeasurement } from './MeasurementNormalizer.js';

export class GetGamificationData {
	_apiClient;

	/**
	 * @param {import('../infrastructure/APIClient').default} apiClient
	 */
	constructor(apiClient) {
		this._apiClient = apiClient;
	}

	/**
	 * Fetches and parses all levels, filtering by plan.
	 * @param {Plan} plan
	 * @returns {Promise<Level[]>}
	 */
	async getLevels(plan) {
		const remoteLevels = await this._apiClient.get('niveles');
		if (!remoteLevels || !Array.isArray(remoteLevels.niveles)) {
			return [];
		}

		return remoteLevels.niveles
			.filter((level) => level.plan === plan)
			.map((level) => ({
				...level,
				objetivos: this._parseLevelObjectives(level.objetivos)
			}));
	}

	/**
	 * Fetches the latest measurement for a given athlete and parses its values.
	 * @param {string} athleteId
	 * @returns {Promise<MeasurementValues|null>}
	 */
	async getMeasurements(athleteId) {
		const remoteMeasurements = await this._apiClient.get('mediciones', { deportista: athleteId });

		if (
			!remoteMeasurements ||
			!Array.isArray(remoteMeasurements.mediciones) ||
			remoteMeasurements.mediciones.length === 0
		) {
			return null;
		}

		// Assuming the last one is the most recent
		const latestMeasurement =
			remoteMeasurements.mediciones[remoteMeasurements.mediciones.length - 1];

		return this._parseMeasurementValues(latestMeasurement.valores);
	}

	/**
	 * Fetches leaderboard data filtered by level ID.
	 * @param {number} id_nivel - The level ID to filter by.
	 * @returns {Promise<any[]>}
	 */
	async getLeaderboardData(id_nivel) {
		const remoteData = await this._apiClient.get('clasificacion', { id_nivel: id_nivel });
		if (!remoteData || !Array.isArray(remoteData.clasificacion)) {
			return [];
		}
		// Assuming the data is already in the correct format
		return remoteData.clasificacion;
	}

	/**
	 * Safely parses the JSON string for level objectives.
	 * @param {string} jsonString
	 * @returns {Objective[]}
	 * @private
	 */
	_parseLevelObjectives(jsonString) {
		if (!jsonString || typeof jsonString !== 'string') {
			return [];
		}
		try {
			const objectives = JSON.parse(jsonString);
			return Array.isArray(objectives) ? objectives : [];
		} catch (e) {
			console.error('Failed to parse level objectives JSON:', e);
			return [];
		}
	}

	/**
	 * Normalizes the `valores` JSON string into a flat NormalizedMeasurement.
	 * Handles both V1 (legacy flat) and V2 (nested biometria/tecnica) formats.
	 * Never throws — returns a safe default on any error.
	 *
	 * @param {string} jsonString
	 * @returns {MeasurementValues}
	 * @private
	 */
	_parseMeasurementValues(jsonString) {
		return normalizeMeasurement(jsonString);
	}
}
