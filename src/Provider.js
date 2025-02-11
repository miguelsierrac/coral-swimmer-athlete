import { GetAthlete } from "./actions/GetAthlete";
import { SaveToken } from "./actions/SaveToken";
import ApiClient from "./infrastructure/APIClient";
import { Request } from "./infrastructure/Request";

const fetch = new Request()
const apiClient = new ApiClient(fetch)

export default {
    getAthlete: new GetAthlete(apiClient),
    saveToken: new SaveToken(apiClient)
}