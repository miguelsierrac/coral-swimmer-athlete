import { GetAthlete } from "$lib/actions/GetAthlete";
import { SaveToken } from "$lib/actions/SaveToken";
import ApiClient from "$lib/infrastructure/APIClient";
import { Request } from "$lib/infrastructure/Request";

const fetch = new Request()
const apiClient = new ApiClient(fetch)

export default {
    getAthlete: new GetAthlete(apiClient),
    saveToken: new SaveToken(apiClient)
}