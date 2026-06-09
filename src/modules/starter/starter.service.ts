import { Injectable } from '@nestjs/common';

@Injectable()
export class StarterService {
  getAdminHello() {
    return {
      message: 'Hello from Teamflow admin starter API',
      scope: 'admin',
    };
  }

  getMobileHello() {
    return {
      message: 'Hello from Teamflow mobile starter API',
      scope: 'mobile',
    };
  }
}
