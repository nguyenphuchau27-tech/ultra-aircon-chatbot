import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DBRouterService {
  private readonly primaryDB: DataSource;
  private readonly replicaDB: DataSource;

  constructor(primaryDB: DataSource, replicaDB: DataSource) {
    this.primaryDB = primaryDB;
    this.replicaDB = replicaDB;
  }

  getWriteDB() {
    return this.primaryDB;
  }

  getReadDB() {
    return this.replicaDB;
  }
}



