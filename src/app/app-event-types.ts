import { HttpClient } from '@angular/common/http';

export const HTTP_CLIENT_NEEDED = 'httpClient.needed';
export const HTTP_CLIENT_SUPPLIED = 'httpClient.supplied';

export interface HttpClientPayload {
  httpClient: HttpClient;
}
