import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Product } from './products/entities/product.entity';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_ADDON_HOST ?? 'localhost',
      port: parseInt(process.env.MYSQL_ADDON_PORT ?? '3306', 10),
      username: process.env.MYSQL_ADDON_USER ?? 'root',
      password: process.env.MYSQL_ADDON_PASSWORD ?? '',
      database: process.env.MYSQL_ADDON_DB ?? 'paletizadora',
      entities: [Product],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
