import { Injectable } from '@angular/core';
import { OidcSecurityStorage } from 'angular-auth-oidc-client';

@Injectable()
export class AppTokenStorage implements OidcSecurityStorage {

  public read(key: string): any {
    console.log('read ' + key);
    const got = sessionStorage.getItem(key);
    console.log(got);

    if ((key === 'authorizationDataIdToken') && (got != null) ) {
      console.log('return crafted token');
      return '.e30='; // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o';
    }
    return got;
  }

  public write(key: string, value: any): void {
    console.log('store ' + key);
    console.log(value);
    sessionStorage.setItem(key, value);
  }

}
