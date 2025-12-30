import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database.js';

/**
 * Base Repository Pattern
 * Provides common CRUD operations for all repositories
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get model delegate dynamically
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find a record by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options?: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }): Promise<T[]> {
    return this.model.findMany(options);
  }

  /**
   * Find one record by criteria
   */
  async findOne(where: any, include?: any): Promise<T | null> {
    return this.model.findFirst({
      where,
      include,
    });
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Count records matching criteria
   */
  async count(where?: any): Promise<number> {
    return this.model.count({
      where,
    });
  }

  /**
   * Check if a record exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({
      where,
      take: 1,
    });
    return count > 0;
  }

  /**
   * Batch create multiple records
   */
  async createMany(data: any[]): Promise<{ count: number }> {
    return this.model.createMany({
      data,
    });
  }

  /**
   * Batch update multiple records
   */
  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return this.model.updateMany({
      where,
      data,
    });
  }

  /**
   * Batch delete multiple records
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    return this.model.deleteMany({
      where,
    });
  }
}
