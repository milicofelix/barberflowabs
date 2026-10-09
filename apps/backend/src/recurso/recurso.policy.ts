import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SalvarRecursoDto } from './recurso.dto';

@Injectable()
export class RecursoPolicy {
  validarGestor(usuario: any) {
    const gestor = usuario?.barbeariaId && (usuario.barbeiro || usuario.papel === 'BARBERSHOP_OWNER');
    if (!gestor) throw new ForbiddenException('Usuário sem permissão para gerenciar recursos');
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
}
