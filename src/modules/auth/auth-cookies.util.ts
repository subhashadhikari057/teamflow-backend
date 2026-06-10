import type { Response } from 'express';
import { appConfig } from '../../config/app.config';

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: appConfig.isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: appConfig.isProduction,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
}
