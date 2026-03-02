import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only prefix if it's a relative URL starting with /api or specific services
  // For this project, we might want to automatically prefix all relative requests
  let apiReq = req;

  if (!req.url.startsWith('http') && !req.url.endsWith('.json')) {
    apiReq = req.clone({
      url: `${environment.apiUrl}/${req.url}`,
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  return next(apiReq);
};
