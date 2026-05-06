import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DBRouterService {
  constructor(
    private primaryDB: DataSource,
    private replicaDB: DataSource,
  ) {}

  getWriteDB() {
    return this.primaryDB;
  }

  getReadDB() {
    return this.replicaDB;
  }
}
