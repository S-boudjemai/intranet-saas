import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';

// Exclut l'URL car on ne peut pas la modifier après création
export class UpdateDocumentDto extends PartialType(
  OmitType(CreateDocumentDto, ['url'] as const),
) {}
