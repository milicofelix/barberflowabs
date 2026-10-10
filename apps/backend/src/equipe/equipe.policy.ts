import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { validarHorario } from 'src/shared/validacao';
import { PAPEIS_EQUIPE, PERMISSOES_EQUIPE, PermissaoEquipe } from './equipe.constants';
import { SalvarEscalaDto, SalvarMembroEquipeDto } from './equipe.dto';

@Injectable()
export class EquipePolicy {
  constructor(private readonly prisma: PrismaService) {}

  async validarPermissao(usuario: any, permissao: PermissaoEquipe) {
    if (!usuario?.estabelecimentoId) throw new ForbiddenException('Usuário sem estabelecimento');
    const permissoes = await this.obterPermissoes(usuario);
    if (!permissoes.includes(permissao)) {
      throw new ForbiddenException('Usuário sem permissão para esta operação');
    }
  }

  async obterPermissoes(usuario: any): Promise<PermissaoEquipe[]> {
    if (!usuario?.estabelecimentoId) return [];
    if (usuario.papel === 'ESTABLISHMENT_OWNER') return [...PERMISSOES_EQUIPE];
    const membro = await (this.prisma as any).membroEquipe.findFirst({
      where: { estabelecimentoId: usuario.estabelecimentoId, usuarioId: usuario.id, ativo: true },
      select: { permissoes: true },
    });
    if (!membro && usuario.membroEstabelecimento) return [...PERMISSOES_EQUIPE];
    const permissoes = Array.isArray(membro?.permissoes) ? membro.permissoes : [];
    return permissoes.filter((item: string) => PERMISSOES_EQUIPE.includes(item as PermissaoEquipe));
  }

  validarMembro(dados: SalvarMembroEquipeDto) {
    if (!Number.isInteger(Number(dados?.usuarioId)) || Number(dados.usuarioId) <= 0) {
      throw new BadRequestException('Usuário inválido');
    }
    if (!PAPEIS_EQUIPE.includes(dados?.papel as any)) throw new BadRequestException('Papel de equipe inválido');
    if (!Array.isArray(dados?.permissoes) || dados.permissoes.some((item) => !PERMISSOES_EQUIPE.includes(item))) {
      throw new BadRequestException('Permissões de equipe inválidas');
    }
  }

  validarEscalas(escalas: SalvarEscalaDto[]) {
    if (!Array.isArray(escalas)) throw new BadRequestException('Escalas são obrigatórias');
    escalas.forEach((escala) => {
      if (!Number.isInteger(Number(escala.diaSemana)) || escala.diaSemana < 0 || escala.diaSemana > 6) {
        throw new BadRequestException('Dia da semana inválido');
      }
      validarHorario(escala.inicio, 'Início da escala');
      validarHorario(escala.fim, 'Fim da escala');
      if (escala.inicio >= escala.fim) throw new BadRequestException('Início da escala deve ser menor que o fim');
      if (escala.intervaloInicio || escala.intervaloFim) {
        validarHorario(escala.intervaloInicio, 'Início do intervalo');
        validarHorario(escala.intervaloFim, 'Fim do intervalo');
      }
    });
  }
}

