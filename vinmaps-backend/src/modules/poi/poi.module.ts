import { Module } from '@nestjs/common';
import { FoursquareProvider } from './foursquare.provider';
import { TomtomProvider } from './tomtom.provider';
import { PoiAggregator } from './poi.aggregator';
import { PoiController } from './poi.controller';

@Module({
  providers: [FoursquareProvider, TomtomProvider, OverpassProvider, PoiAggregator],
  controllers: [PoiController],
  exports: [PoiAggregator],
})
export class PoiModule {}
