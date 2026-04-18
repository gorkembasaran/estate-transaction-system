import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { GetAgentsQueryDto } from './dto/get-agents-query.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.createAgent(createAgentDto);
  }

  @Get()
  getAllAgents(@Query() query: GetAgentsQueryDto) {
    return this.agentsService.getAllAgents(query);
  }

  @Get(':id')
  getAgentById(@Param('id') id: string) {
    return this.agentsService.getAgentById(id);
  }

  @Patch(':id')
  updateAgent(
    @Param('id') id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.updateAgent(id, updateAgentDto);
  }
}
