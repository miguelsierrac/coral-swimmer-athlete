export class GetAthlete {
    _apiClient

    constructor(apiClient) {
        this._apiClient = apiClient
    }

    async handle(id) {
        let remote = await this._apiClient.get(`deportistas`, {'documento': id})
        return this.map(remote.deportistas[0])
    }

    map(remote) {
        return {
            "id": remote.id,
            "forename": remote.nombre,
            "surname": remote.apellido,
            "identification": remote.documento,
            "phone": remote.telefono
        }
    }
}