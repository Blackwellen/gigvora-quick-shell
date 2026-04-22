import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { SearchMlService } from './search.ml.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SearchIndexingAdminService } from './search-indexing.admin.service';
import { BooleanParserService } from './boolean-parser.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository, SearchMlService, SearchIndexingAdminService, BooleanParserService, JwtStrategy],
  exports: [SearchService, SearchMlService],
})
export class SearchModule {}