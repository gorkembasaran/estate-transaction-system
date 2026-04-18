import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Get()
  getAllTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.transactionsService.getAllTransactions(query);
  }

  @Get(':id')
  getTransactionById(@Param('id') id: string) {
    return this.transactionsService.getTransactionById(id);
  }

  @Get(':id/breakdown')
  getTransactionBreakdown(@Param('id') id: string) {
    return this.transactionsService.getTransactionBreakdown(id);
  }

  @Patch(':id/stage')
  updateTransactionStage(
    @Param('id') id: string,
    @Body() updateStageDto: UpdateTransactionStageDto,
  ) {
    return this.transactionsService.updateTransactionStage(id, updateStageDto);
  }
}
