import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(activoOnly = true): Promise<Product[]> {
    const qb = this.productRepository.createQueryBuilder('p').orderBy(
      'p.codigo',
      'ASC',
    );
    if (activoOnly) {
      qb.andWhere('p.activo = :activo', { activo: true });
    }
    return qb.getMany();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return product;
  }

  async findByCodigo(codigo: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { codigo: codigo.trim(), activo: true },
    });
  }

  /** Busca por código sin filtrar por activo (para validar unicidad). */
  async findExistingByCodigo(codigo: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { codigo: codigo.trim() },
    });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.findExistingByCodigo(dto.codigo);
    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con código "${dto.codigo}"`,
      );
    }
    const product = this.productRepository.create({
      codigo: dto.codigo.trim(),
      filas: dto.filas ?? 0,
      camadas: dto.camadas ?? 0,
      detalle: dto.detalle?.trim() ?? null,
      activo: dto.activo ?? true,
    });
    return this.productRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.codigo !== undefined && dto.codigo.trim() !== product.codigo) {
      const existing = await this.findExistingByCodigo(dto.codigo);
      if (existing) {
        throw new ConflictException(
          `Ya existe un producto con código "${dto.codigo}"`,
        );
      }
      product.codigo = dto.codigo.trim();
    }
    if (dto.filas !== undefined) product.filas = dto.filas;
    if (dto.camadas !== undefined) product.camadas = dto.camadas;
    if (dto.detalle !== undefined) product.detalle = dto.detalle?.trim() ?? null;
    if (dto.activo !== undefined) product.activo = dto.activo;
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
