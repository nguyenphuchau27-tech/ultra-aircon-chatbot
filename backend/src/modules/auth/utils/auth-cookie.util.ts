import { Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
  };
}

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie('access_token', token, {
    ...getCookieBaseOptions(),
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refresh_token', token, {
    ...getCookieBaseOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  const options = {
    ...getCookieBaseOptions(),
    maxAge: 0,
  };

  res.clearCookie('access_token', options);
  res.clearCookie('refresh_token', options);
}