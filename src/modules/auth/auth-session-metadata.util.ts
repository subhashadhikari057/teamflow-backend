import type { Request } from 'express';
import type { SessionMetadata } from './interfaces/auth.interface';

type MetadataOverrides = {
  deviceName?: string;
  deviceToken?: string;
  deviceType?: string;
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveIpAddress(request: Request): string | null {
  const forwardedFor = firstHeaderValue(request.headers['x-forwarded-for']);

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return request.ip || request.socket.remoteAddress || null;
}

export function buildSessionMetadata(
  request: Request,
  overrides?: MetadataOverrides,
): SessionMetadata {
  const headerDeviceType = firstHeaderValue(request.headers['x-device-type']);
  const headerDeviceName = firstHeaderValue(request.headers['x-device-name']);
  const headerDeviceToken = firstHeaderValue(request.headers['x-device-token']);
  const userAgent = firstHeaderValue(request.headers['user-agent']) || null;

  return {
    deviceToken: overrides?.deviceToken || headerDeviceToken || null,
    deviceType: overrides?.deviceType || headerDeviceType || (userAgent ? 'web' : null),
    deviceName: overrides?.deviceName || headerDeviceName || null,
    ipAddress: resolveIpAddress(request),
    userAgent,
    location: null,
  };
}
