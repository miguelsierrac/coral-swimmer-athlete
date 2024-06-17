import { GetAthlete } from "./actions/GetAthlete";
import ApiClient from "./infrastructure/APIClient";
import { Request } from "./infrastructure/Request";

const fetch = new Request()
const apiClient = new ApiClient(fetch)

export default {
    getAthlete: new GetAthlete(apiClient)
}