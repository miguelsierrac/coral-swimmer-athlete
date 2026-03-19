export class SubmitBitacora {
	_apiClient;

	constructor(apiClient) {
		this._apiClient = apiClient;
	}

	/**
	 * Submits a self-logged training session pending trainer approval.
	 *
	 * @param {object} params
	 * @param {string}  params.fecha       - Date in "DD/MM/YYYY" format
	 * @param {string}  params.hora        - Time in "HH:MM" format
	 * @param {number}  params.deportista  - Athlete numeric ID
	 * @param {Array<{description: string, repetitions: number, distance: number, times: []}>} params.ejercicios
	 * @returns {Promise<unknown>}
	 */
	async handle({ fecha, hora, deportista, ejercicios }) {
		return this._apiClient.post('entrenamientos', {
			items: [
				{
					fecha,
					hora,
					deportista,
					tipo: 'atleta_pendiente',
					ejercicios: JSON.stringify(ejercicios)
				}
			]
		});
	}
}
