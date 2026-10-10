import { BadRequestException, Injectable } from '@nestjs/common';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { SalvarIndisponibilidadeRecursoDto, SalvarRecursoDto } from './recurso.dto';

@Injectable()
export class RecursoPolicy {
  constructor(private readonly equipePolicy: EquipePolicy) {}

  validarGestor(usuario: any) {
    return this.equipePolicy.validarPermissao(usuario, 'RECURSOS_GERENCIAR');
  }

  validar(dados: SalvarRecursoDto) {
    if (!dados?.nome?.trim()) throw new BadRequestException('Nome do recurso é obrigatório');
    if (!dados?.tipo?.trim()) throw new BadRequestException('Tipo do recurso é obrigatório');
    if (!Number.isInteger(Number(dados?.capacidade)) || Number(dados.capacidade) <= 0) {
      throw new BadRequestException('Capacidade do recurso é inválida');
    }
    if (dados.unidadeId && (!Number.isInteger(Number(dados.unidadeId)) || Number(dados.unidadeId) <= 0)) {
      throw new BadRequestException('Unidade inválida');
    }
  }

  validarIndisponibilidade(dados: SalvarIndisponibilidadeRecursoDto) {
    const inicio = new Date(dados?.inicio);
    const fim = new Date(dados?.fim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Período de indisponibilidade inválido');
    }
    if (inicio >= fim) throw new BadRequestException('Início deve ser anterior ao fim');
  }
}
