export default class ApiClient {
    _baseURL = 'https://script.google.com/macros/s/AKfycby6v3FxPRC8uoXcJijh8VbQ-3e3X3Jm3PU348tq9A3MpVXXlhURSxhzAvQYwqX_R-nUQg/exec?spreadsheetId=1M_FAHTJTo-7JZ0LZ9ZwPV8P1I1ynOTdywdv_a6RJ150'
    _fetch

    constructor(fetch) {
        this._fetch = fetch
    }

    async get(endpoint, data) {
        const requestData = this.prepareRequest(data, endpoint)
        return this._fetch.request(
            () => {},
            `${requestData.url}&` + new URLSearchParams(data).toString(),
            'GET',
            requestData.headers
        )
    }

    async post(endpoint, body) {
        const requestData = this.prepareRequest(
            {}, 
            endpoint, 
            {
                "Content-Type": "text/plain;charset=utf-8"
            }
        )
        return this._fetch.request(
            () => {},
            requestData.url,
            'POST',
            requestData.headers,
            JSON.stringify(body),
            'follow'
        )
    }

    prepareRequest(body, endpoint, headers = {}) {
        const request = {}
        const formData = new FormData()
        const requestHeaders = new Headers(headers)

        if (body === undefined) {
            body = {}
        }
        this.removeKeyWhenValueIsNull(body)
        Object.keys(body).forEach((key) => formData.append(key, body[key]))
        if (endpoint.substr(endpoint.length - 1) == '/') {
            endpoint = endpoint.slice(0, -1)
        }
        request['url'] = this._baseURL + `&sheet=${endpoint}`
        request['headers'] = requestHeaders
        request['body'] = formData
        return request
    }

    removeKeyWhenValueIsNull = (obj) => {
        if (obj === undefined) return obj
        Object.keys(obj).forEach((key) => obj[key] == null && delete obj[key])
        return obj
    }

}