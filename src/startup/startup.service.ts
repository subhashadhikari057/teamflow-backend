import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Socket } from 'node:net';
import { databaseConfig } from '../config/database.config';
import { mailConfig } from '../config/mail.config';
import { redisConfig } from '../config/redis.config';

type StartupDependency = {
  host?: string;
  name: string;
  port?: string;
};

@Injectable()
export class StartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupService.name);

  async onApplicationBootstrap() {
    await this.logDependencyStatus({
      name: 'Postgres',
      host: databaseConfig.host,
      port: String(databaseConfig.port),
    });

    await this.logDependencyStatus({
      name: 'Redis',
      host: redisConfig.host,
      port: String(redisConfig.port),
    });

    await this.logDependencyStatus({
      name: 'SMTP',
      host: mailConfig.host,
      port: String(mailConfig.port),
    });

    this.logUiUrl('Redis UI', redisConfig.uiUrl);
    this.logUiUrl('Mailpit UI', mailConfig.mailpitUiUrl);
  }

  private async logDependencyStatus(dependency: StartupDependency) {
    const host = dependency.host?.trim();
    const port = Number(dependency.port);

    if (!host || !Number.isInteger(port) || port <= 0) {
      this.logger.warn(
        `${dependency.name} config missing or invalid (host=${host ?? 'undefined'}, port=${dependency.port ?? 'undefined'})`,
      );
      return;
    }

    const isReachable = await this.probeTcpPort(host, port);

    if (isReachable) {
      this.logger.log(`${dependency.name} connected at ${host}:${port}`);
      return;
    }

    this.logger.error(`${dependency.name} connection failed at ${host}:${port}`);
  }

  private async probeTcpPort(host: string, port: number) {
    return new Promise<boolean>((resolve) => {
      const socket = new Socket();

      const finish = (result: boolean) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(2000);
      socket.once('connect', () => finish(true));
      socket.once('timeout', () => finish(false));
      socket.once('error', () => finish(false));
      socket.connect(port, host);
    });
  }

  private logUiUrl(name: string, url?: string) {
    const value = url?.trim();

    if (!value) {
      this.logger.warn(`${name} URL is not configured`);
      return;
    }

    this.logger.log(`${name} available at ${value}`);
  }
}
