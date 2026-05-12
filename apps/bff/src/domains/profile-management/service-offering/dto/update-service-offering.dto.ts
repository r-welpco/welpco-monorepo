import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceOfferingDto } from './create-service-offering.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceArea } from '../../../../common/types';
import { IsValidGeoJSON } from '../../common/validators/geojson.validator';

export class UpdateServiceOfferingDto extends PartialType(
  CreateServiceOfferingDto,
) {}

