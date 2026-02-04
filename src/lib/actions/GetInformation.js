export class GetInformation {
	_apiClient;

	constructor(apiClient) {
		this._apiClient = apiClient;
	}

	async handle(id) {
		let remote = await this._apiClient.get(`informacion`, { id: id });
		return this.map(remote.informacion[0]);
	}

	map(remote) {
		return {
			id: remote.id,
			total_distance: remote.distancia_total
		};
	}
}
