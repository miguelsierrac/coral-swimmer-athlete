export default class ApiClient {
    _baseURL = 'https://dov5.short.gy/coralswimmer'
    _fetch

    constructor(fetch) {
        this._fetch = fetch
    }

    async get(endpoint, data) {
        const requestData = this.prepareRequest(data, endpoint)
        return _fetch.request(
            `${requestData.url}&` + new URLSearchParams(data).toString(),
            'GET',
            requestData.headers
        )
    }

    prepareRequest(body, endpoint) {
        const request = {}
        const formData = new FormData()
        const headers = new Headers()

        if (body === undefined) {
            body = {}
        }
        this.removeKeyWhenValueIsNull(body)
        Object.keys(body).forEach((key) => formData.append(key, body[key]))
        if (endpoint.substr(endpoint.length - 1) == '/') {
            endpoint = endpoint.slice(0, -1)
        }
        request['url'] = _baseUrl + `?sheet=${endpoint}`
        request['headers'] = headers
        request['body'] = formData
        return request
    }

}