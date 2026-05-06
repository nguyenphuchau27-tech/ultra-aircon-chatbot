import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Technician } from '../../database/entities/technician.entity';
import { CacheService } from '../cache/cache.service';
import { QueryOptimizationService } from '../../common/query-optimization.service';
import { SocketGateway } from '../realtime/socket.gateway';

export type TechnicianLocationPayload = {
  id: number;
  lat: number;
  lng: number;
};

@Injectable()
export class TechniciansService {
  private readonly techRepo: Repository<Technician>;
  private readonly cacheService: CacheService;
  private readonly queryOptimization: QueryOptimizationService;
  private readonly socketGateway: SocketGateway;

  constructor(
    @InjectRepository(Technician)
    techRepo: Repository<Technician>,
    cacheService: CacheService,
    queryOptimization: QueryOptimizationService,
    socketGateway: SocketGateway,
  ) {
    this.techRepo = techRepo;
    this.cacheService = cacheService;
    this.queryOptimization = queryOptimization;
    this.socketGateway = socketGateway;
  }

  async create(data: Partial<Technician>): Promise<Technician> {
    const tech = this.techRepo.create(data);
    const saved = await this.techRepo.save(tech);

    await this.cacheService.delPattern('technicians:*');

    return saved;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<Technician[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('technicians:all', {
      page,
      limit,
    });

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findAllTechnicians', async () => {
        const queryBuilder = this.techRepo.createQueryBuilder('technician');

        return this.queryOptimization.applyPagination(queryBuilder, page, limit).getMany();
      });
    });
  }

  async findAvailable(
    lat?: number,
    lng?: number,
    radius: number = 10,
  ): Promise<Technician[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('technicians:available', {
      lat,
      lng,
      radius,
    });

    return this.queryOptimization.cachedQuery(
      cacheKey,
      async () => {
        return this.queryOptimization.executeWithMonitoring(
          'findAvailableTechnicians',
          async () => {
            let query = this.techRepo
              .createQueryBuilder('technician')
              .where('technician.isAvailable = :available', { available: true });

            if (lat !== undefined && lng !== undefined) {
              query = query.andWhere(
                `6371 * acos(
                  cos(radians(:lat)) * cos(radians(technician.latitude)) *
                  cos(radians(technician.longitude) - radians(:lng)) +
                  sin(radians(:lat)) * sin(radians(technician.latitude))
                ) <= :radius`,
                { lat, lng, radius },
              );
            }

            return query.orderBy('technician.rating', 'DESC').getMany();
          },
        );
      },
      60,
    );
  }

  async findBySkill(skill: string, page: number = 1, limit: number = 10): Promise<Technician[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('technicians:skill', {
      skill,
      page,
      limit,
    });

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findTechniciansBySkill', async () => {
        const queryBuilder = this.techRepo
          .createQueryBuilder('technician')
          .where('technician.skill = :skill', { skill });

        return this.queryOptimization.applyPagination(queryBuilder, page, limit).getMany();
      });
    });
  }

  async findOne(id: number): Promise<Technician> {
    const cacheKey = `technician:${id}`;

    return this.queryOptimization.cachedQuery(cacheKey, async () => {
      return this.queryOptimization.executeWithMonitoring('findOneTechnician', async () => {
        const technician = await this.techRepo.findOne({ where: { id } });

        if (!technician) {
          throw new NotFoundException('Technician not found');
        }

        return technician;
      });
    });
  }

  async updateLocation(id: number, lat: number, lng: number): Promise<Technician> {
    const result = await this.queryOptimization.executeWithMonitoring(
      'updateTechnicianLocation',
      async () => {
        return this.techRepo.update(id, {
          latitude: lat,
          longitude: lng,
        });
      },
    );

    if (!result.affected) {
      throw new NotFoundException('Technician not found');
    }

    await this.cacheService.del(`technician:${id}`);
    await this.cacheService.delPattern('technicians:*');

    const technician = await this.findOne(id);
    const payload = this.toLocationPayload(technician);

    this.socketGateway.emitTechnicianLocationUpdate(payload);

    return technician;
  }

  async getNearbyTechnicians(
    lat: number,
    lng: number,
    radius: number = 5,
    limit: number = 10,
  ): Promise<Technician[]> {
    const cacheKey = this.queryOptimization.generateCacheKey('technicians:nearby', {
      lat,
      lng,
      radius,
      limit,
    });

    return this.queryOptimization.cachedQuery(
      cacheKey,
      async () => {
        return this.queryOptimization.executeWithMonitoring('getNearbyTechnicians', async () => {
          return this.techRepo
            .createQueryBuilder('technician')
            .where('technician.isAvailable = :available', { available: true })
            .andWhere(
              `6371 * acos(
                cos(radians(:lat)) * cos(radians(technician.latitude)) *
                cos(radians(technician.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(technician.latitude))
              ) <= :radius`,
              { lat, lng, radius },
            )
            .orderBy('technician.rating', 'DESC')
            .limit(limit)
            .getMany();
        });
      },
      120,
    );
  }

  async updateAvailability(id: number, status: boolean): Promise<void> {
    await this.queryOptimization.executeWithMonitoring(
      'updateTechnicianAvailability',
      async () => {
        return this.techRepo.update(id, { isAvailable: status });
      },
    );

    await this.cacheService.del(`technician:${id}`);
    await this.cacheService.delPattern('technicians:*');
  }

  async findAllLocations(): Promise<TechnicianLocationPayload[]> {
    const cacheKey = 'technicians:locations';

    return this.queryOptimization.cachedQuery(
      cacheKey,
      async () => {
        return this.queryOptimization.executeWithMonitoring(
          'findAllTechnicianLocations',
          async () => {
            const technicians = await this.techRepo
              .createQueryBuilder('technician')
              .select([
                'technician.id',
                'technician.latitude',
                'technician.longitude',
              ])
              .getMany();

            return technicians
              .filter(
                technician =>
                  typeof technician.latitude === 'number' &&
                  typeof technician.longitude === 'number',
              )
              .map(technician => this.toLocationPayload(technician));
          },
        );
      },
      15,
    );
  }

  private toLocationPayload(
    technician: Pick<Technician, 'id' | 'latitude' | 'longitude'>,
  ): TechnicianLocationPayload {
    return {
      id: technician.id,
      lat: technician.latitude,
      lng: technician.longitude,
    };
  }
}