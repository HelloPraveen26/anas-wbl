import { ApiProperty } from '@nestjs/swagger';
import { ChatLogResponseDto } from './chat-log-response.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  currentPage: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 45
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5
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

export class PaginatedChatLogsResponseDto {
  @ApiProperty({
    description: 'Array of chat logs',
    type: [ChatLogResponseDto]
  })
  data: ChatLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto
  })
  pagination: PaginationMetaDto;

  constructor(
    data: ChatLogResponseDto[],
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
