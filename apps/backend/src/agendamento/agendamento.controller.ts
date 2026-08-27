import {
  Usuario,
  Agendamento,
  NovoAgendamento,
  TEMPO_SLOT,
} from '@barbabrutal/core';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';

import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { AgendamentoPrisma } from './agendamento.prisma';
import { AvaliarAgendamentoDto, CriarAgendamentoDto } from './agendamento.dto';
import {
  validarData,
  validarNumeroInteiroPositivo,
} from 'src/shared/validacao';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';
import { TenantService } from 'src/shared/tenant.service';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    private readonly repo: AgendamentoPrisma,
    private readonly limites: PlanoLimitesService,
    private readonly tenant: TenantService,
  ) {}

  @Post()
  async novoAgendamento(
    @Body() dados: CriarAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    this.validarNovoAgendamento(dados);
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    await this.limites.validarBarbeariaOperacional(barbeariaId);

    const agendamento: Agendamento = {
      ...(dados as any),
      barbeariaId,
      data: new Date(dados.data),
      usuario: { ...usuario, barbeariaId },
    };

    try {
      const casoDeUso = new NovoAgendamento(this.repo);
      await casoDeUso.executar({ agendamento, usuario });
    } catch (error: any) {
      throw new ConflictException(error?.message ?? 'Não foi possível criar o agendamento');
    }
  }

  @Get()
  async buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario, @Req() req: any) {
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    return this.repo.buscarPorEmail(usuario.email, barbeariaId);
  }

  @Post(':id/avaliacao')
  async avaliarAgendamento(
    @Param('id') id: string,
    @Body() dados: AvaliarAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');
    this.validarAvaliacao(dados);

    try {
      const avaliacao = await this.repo.avaliar(
        Number(id),
        usuario.id!,
        Number(dados.nota),
        dados.comentario,
      );

      if (!avaliacao) throw new NotFoundException('Agendamento não encontrado');
      return avaliacao;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      if (error?.message?.includes('já foi avaliado')) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error?.message ?? 'Não foi possível avaliar o atendimento');
    }
  }

  @Get(':profissional/:data')
  async buscarAgendaProfissionalPorDia(
    @Param('profissional') profissional: string,
    @Param('data') data: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(data);
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);

    return this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(data),
      barbeariaId,
    );
  }

  @Get('ocupacao/:profissional/:data')
  async buscarOcupacaoPorProfissionalEData(
    @Param('profissional') profissional: string,
    @Param('data') dataParam: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(dataParam);
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);

    const agendamentos = await this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(dataParam),
      barbeariaId,
    );

    return agendamentos
      .map((agendamento) => {
        return {
          data: agendamento.data,
          slots: agendamento.servicos.reduce((total, s) => total + s.qtdeSlots, 0),
        };
      })
      .reduce((horariosOcupados: Date[], dados: any) => {
        const horario = dados.data;
        const slots = dados.slots;
        const horarios = Array.from({ length: slots }, (_, i) =>
          new Date(horario.getTime() + i * TEMPO_SLOT * 60000),
        );
        return [...horariosOcupados, ...horarios];
      }, [])
      .map((d) => d.toTimeString().slice(0, 5));
  }

  @Delete(':id')
  async excluirAgendamento(
    @Param('id') id: string,
    @UsuarioLogado() usuario: Usuario,
    @Req() req: any,
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');
    const barbeariaId = await this.resolverBarbeariaAgendamento(req, usuario);
    let agendamento: Agendamento | null;
    const podeCancelarComoBarbeiro = !!usuario.barbeiro && usuario.barbeariaId === barbeariaId;

    try {
      agendamento = await this.repo.cancelar(Number(id), usuario.id!, barbeariaId, podeCancelarComoBarbeiro);
    } catch (error: any) {
      throw new BadRequestException(error?.message ?? 'Não foi possível cancelar o agendamento');
    }

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado para cancelamento');
    }

    return agendamento;
  }

  private validarNovoAgendamento(dados: CriarAgendamentoDto) {
    validarData(dados.data);
    validarNumeroInteiroPositivo(dados.usuario?.id, 'Usuário');
    validarNumeroInteiroPositivo(dados.profissional?.id, 'Profissional');

    if (!Array.isArray(dados.servicos) || dados.servicos.length === 0) {
      throw new BadRequestException('Informe pelo menos um serviço');
    }

    dados.servicos.forEach((servico) => {
      validarNumeroInteiroPositivo(servico?.id, 'Serviço');
    });
  }

  private async resolverBarbeariaAgendamento(req: any, usuario: Usuario) {
    return this.tenant.resolverBarbeariaId(req);
  }

  private validarAvaliacao(dados: AvaliarAgendamentoDto) {
    const nota = Number(dados?.nota);

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw new BadRequestException('Nota deve ser um número inteiro entre 1 e 5');
    }

    if (dados?.comentario && dados.comentario.length > 1000) {
      throw new BadRequestException('Comentário deve ter no máximo 1000 caracteres');
    }
  }
}
