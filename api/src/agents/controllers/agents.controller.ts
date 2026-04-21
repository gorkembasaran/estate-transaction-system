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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AgentsService } from '../services';
import {
  AgentResponseDto,
  PaginatedAgentsResponseDto,
} from '../dto/agent-response.dto';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { AGENT_STATUS_FILTERS } from '../dto/get-agents-query.dto';
import { GetAgentsQueryDto } from '../dto/get-agents-query.dto';
import { UpdateAgentDto } from '../dto/update-agent.dto';

@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an agent' })
  @ApiCreatedResponse({ type: AgentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload.' })
  @ApiConflictResponse({ description: 'Agent email already exists.' })
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.createAgent(createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List agents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    enum: AGENT_STATUS_FILTERS,
    name: 'status',
    required: false,
  })
  @ApiOkResponse({ type: PaginatedAgentsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameter.' })
  getAllAgents(@Query() query: GetAgentsQueryDto) {
    return this.agentsService.getAllAgents(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agent by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: AgentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid agent id.' })
  @ApiNotFoundResponse({ description: 'Agent was not found.' })
  getAgentById(@Param('id') id: string) {
    return this.agentsService.getAgentById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agent by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: AgentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid agent id or payload.' })
  @ApiConflictResponse({ description: 'Agent email already exists.' })
  @ApiNotFoundResponse({ description: 'Agent was not found.' })
  updateAgent(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.updateAgent(id, updateAgentDto);
  }
}
