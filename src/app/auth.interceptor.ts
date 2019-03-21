import { Injectable, Injector } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private oidcSecurityService: OidcSecurityService;

  // see https://github.com/damienbod/angular-auth-oidc-client/#http-interceptor
  // Keep in mind that injecting OidcSecurityService into the interceptor via the constructor
  // results in a cyclic dependency. To avoid this use the injector instead.
  constructor(private injector: Injector) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let requestToForward = req;

    if (this.oidcSecurityService === undefined) {
      this.oidcSecurityService = this.injector.get(OidcSecurityService);
    }
    if (this.oidcSecurityService !== undefined) {
      const idToken = this.oidcSecurityService.getIdToken();
      if (idToken !== '') {
        const tokenValue = 'Bearer ' + idToken;
        requestToForward = req.clone({ setHeaders: { 'Authorization': tokenValue } });
      }
    } else {
      console.log('OidcSecurityService undefined: NO auth header!');
    }

    return next.handle(requestToForward);
  }
}
