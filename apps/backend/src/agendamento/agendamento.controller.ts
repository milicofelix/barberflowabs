import {
  Usuario,
  Agendamento,
  NovoAgendamento,
  ExcluirAgendamento,
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
} from '@nestjs/common';

import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { AgendamentoPrisma } from './agendamento.prisma';
import { AvaliarAgendamentoDto, CriarAgendamentoDto } from './agendamento.dto';
import {
  validarData,
  validarNumeroInteiroPositivo,
} from 'src/shared/validacao';
import { PlanoLimitesService } from 'src/saas/plano-limites.service';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(
    private readonly repo: AgendamentoPrisma,
    private readonly limites: PlanoLimitesService,
  ) {}

  @Post()
  async novoAgendamento(
    @Body() dados: CriarAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarNovoAgendamento(dados);
    await this.limites.validarBarbeariaOperacional(usuario.barbeariaId);

    const agendamento: Agendamento = {
      ...(dados as any),
      barbeariaId: usuario.barbeariaId,
      data: new Date(dados.data),
      usuario,
    };
    const casoDeUso = new NovoAgendamento(this.repo);
    await casoDeUso.executar({ agendamento, usuario });
  }

  @Get()
  buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario) {
    return this.repo.buscarPorEmail(usuario.email, usuario.barbeariaId);
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
  buscarAgendaProfissionalPorDia(
    @Param('profissional') profissional: string,
    @Param('data') data: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(data);

    return this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(data),
      usuario.barbeariaId,
    );
  }

  @Get('ocupacao/:profissional/:data')
  async buscarOcupacaoPorProfissionalEData(
    @Param('profissional') profissional: string,
    @Param('data') dataParam: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    validarNumeroInteiroPositivo(profissional, 'Profissional');
    validarData(dataParam);

    const agendamentos = await this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(dataParam),
      usuario.barbeariaId,
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
  ) {
    validarNumeroInteiroPositivo(id, 'Agendamento');

    const casoDeUso = new ExcluirAgendamento(this.repo);
    await casoDeUso.executar({
      id: +id,
      usuario,
    });
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
