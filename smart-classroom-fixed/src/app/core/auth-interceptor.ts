import { HttpInterceptorFn } from '@angular/common/http';

// Automatically adds the JWT token to every HTTP request
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (!token) return next(req);

  // Clone the request and add the Authorization header
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authReq);
};
