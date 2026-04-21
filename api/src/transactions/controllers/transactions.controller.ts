import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import {
  GetTransactionsQueryDto,
  SORT_ORDERS,
  TRANSACTION_SORT_FIELDS,
} from '../dto/get-transactions-query.dto';
import {
  FinancialBreakdownResponseDto,
  PaginatedTransactionsResponseDto,
  TRANSACTION_RESPONSE_EXTRA_MODELS,
  TransactionResponseDto,
} from '../dto/transaction-response.dto';
import { UpdateTransactionStageDto } from '../dto/update-transaction-stage.dto';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import { TransactionsService } from '../services';

@ApiTags('Transactions')
@ApiExtraModels(...TRANSACTION_RESPONSE_EXTRA_MODELS)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid payload or referenced agent id.',
  })
  @ApiNotFoundResponse({ description: 'Referenced agent was not found.' })
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    enum: TRANSACTION_STAGES,
    name: 'stage',
    required: false,
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    description: 'Inclusive createdAt start date filter.',
    name: 'dateFrom',
    required: false,
    type: String,
  })
  @ApiQuery({
    description: 'Inclusive createdAt end date filter.',
    name: 'dateTo',
    required: false,
    type: String,
  })
  @ApiQuery({
    enum: TRANSACTION_SORT_FIELDS,
    name: 'sortBy',
    required: false,
  })
  @ApiQuery({
    enum: SORT_ORDERS,
    name: 'sortOrder',
    required: false,
  })
  @ApiOkResponse({ type: PaginatedTransactionsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameter.' })
  getAllTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.transactionsService.getAllTransactions(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid transaction id.' })
  @ApiNotFoundResponse({ description: 'Transaction was not found.' })
  getTransactionById(@Param('id') id: string) {
    return this.transactionsService.getTransactionById(id);
  }

  @Get(':id/breakdown')
  @ApiOperation({ summary: 'Get a transaction financial breakdown' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(FinancialBreakdownResponseDto) }],
      nullable: true,
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid transaction id.' })
  @ApiNotFoundResponse({ description: 'Transaction was not found.' })
  getTransactionBreakdown(@Param('id') id: string) {
    return this.transactionsService.getTransactionBreakdown(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update a transaction stage' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid transaction id, stage, or lifecycle transition.',
  })
  @ApiNotFoundResponse({ description: 'Transaction was not found.' })
  updateTransactionStage(
    @Param('id') id: string,
    @Body() updateStageDto: UpdateTransactionStageDto,
  ) {
    return this.transactionsService.updateTransactionStage(id, updateStageDto);
  }
}
