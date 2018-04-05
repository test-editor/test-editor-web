import { Injectable } from '@angular/core';
import { OidcSecurityStorage } from 'angular-auth-oidc-client';

@Injectable()
export class AppTokenStorage implements OidcSecurityStorage {

  public read(key: string): any {
    return sessionStorage.getItem(key);
  }

  public write(key: string, value: any): void {
    sessionStorage.setItem(key, value);
  }

}
