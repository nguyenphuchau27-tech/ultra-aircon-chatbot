import { Injectable } from '@nestjs/common';

@Injectable()
export class GlobalCacheService {
  cache: Record<string, unknown> = {};

  set(key: string, value: unknown) {
    this.cache[key] = value;
  }

  get(key: string) {
    return this.cache[key];
  }
}



