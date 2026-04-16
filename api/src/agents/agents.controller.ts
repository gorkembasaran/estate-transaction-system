import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  createAgent(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.createAgent(createAgentDto);
  }

  @Get()
  getAllAgents() {
    return this.agentsService.getAllAgents();
  }

  @Get(':id')
  getAgentById(@Param('id') id: string) {
    return this.agentsService.getAgentById(id);
  }
}
