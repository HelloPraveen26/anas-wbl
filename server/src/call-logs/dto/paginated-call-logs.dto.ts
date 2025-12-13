import { ApiProperty } from '@nestjs/swagger';
import { CallLogResponseDto } from './call-log-response.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 125
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false
  })
  hasPreviousPage: boolean;
}

export class PaginatedCallLogsResponseDto {
  @ApiProperty({
    description: 'Array of call logs',
    type: [CallLogResponseDto]
  })
  data: CallLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto
  })
  pagination: PaginationMetaDto;

  constructor(
    data: CallLogResponseDto[],
    currentPage: number,
    itemsPerPage: number,
    totalItems: number
  ) {
    this.data = data;

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    this.pagination = {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }
}
