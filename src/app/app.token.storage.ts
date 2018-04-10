import { Injectable, isDevMode } from '@angular/core';
import { OidcSecurityStorage } from 'angular-auth-oidc-client';

/*
 * Basic token storage implementation using session storage
 */
@Injectable()
export class AppTokenStorage implements OidcSecurityStorage {

  static readonly MINIMAL_ID_TOKEN = '.e30=';

  public read(key: string): any {
    const got = sessionStorage.getItem(key);

    // current auth-oidc-client library does not handle null or empty values of authorizationDataIdToken well
    // => provide dummy if yet unknown
    if (key === 'authorizationDataIdToken' && !got) {
      if (isDevMode()) {
        console.log('return crafted token');
      }
      return AppTokenStorage.MINIMAL_ID_TOKEN;
    }

    return got;
  }

  public write(key: string, value: any): void {
    sessionStorage.setItem(key, value);
  }

}
