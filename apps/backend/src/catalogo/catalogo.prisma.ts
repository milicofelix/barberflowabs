import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  AtualizarCatalogoEstabelecimentoDto,
  AtualizarCatalogoServicoDto,
  AtualizarEspecialidadesProfissionalDto,
} from './catalogo.dto';
import { CatalogoIntegridadePrisma } from './catalogo-integridade.prisma';

@Injectable()
export class CatalogoPrisma {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integridade: CatalogoIntegridadePrisma,
  ) {}

  async atualizarEstabelecimento(barbeariaId: number, dados: AtualizarCatalogoEstabelecimentoDto) {
    await this.integridade.validarClassificacao(dados.segmentoIds, dados.especialidadeIds);
    await this.integridade.validarServicosCompativeis(barbeariaId, dados.modeloAtendimento);

    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      const filtroEspecialidadesRemovidas = dados.especialidadeIds.length
        ? { especialidadeId: { notIn: dados.especialidadeIds } }
        : {};
      await tx.profissionalEspecialidade.deleteMany({
        where: { barbeariaId, ...filtroEspecialidadesRemovidas },
      });
      await tx.servicoEspecialidade.deleteMany({
        where: { barbeariaId, ...filtroEspecialidadesRemovidas },
      });
      await tx.estabelecimentoEspecialidade.deleteMany({ where: { barbeariaId } });
      await tx.estabelecimentoSegmento.deleteMany({ where: { barbeariaId } });
      await tx.barbearia.update({
        where: { id: barbeariaId },
        data: {
          tipoEstabelecimento: dados.tipoEstabelecimento,
          modeloAtendimento: dados.modeloAtendimento,
          segmentos: {
            create: dados.segmentoIds.map((segmentoId, indice) => ({ segmentoId, principal: indice === 0 })),
          },
          especialidades: {
            create: dados.especialidadeIds.map((especialidadeId) => ({ especialidadeId })),
          },
        },
      });
      return this.obterConfiguracaoComCliente(tx, barbeariaId);
    });
  }

  async atualizarProfissional(
    barbeariaId: number,
    profissionalId: number,
    dados: AtualizarEspecialidadesProfissionalDto,
  ) {
    await this.integridade.validarEntidadeTenant('profissional', profissionalId, barbeariaId);
    await this.integridade.validarEspecialidades(barbeariaId, dados.especialidadeIds);
    if (dados.servicoIds !== undefined) await this.integridade.validarServicos(barbeariaId, dados.servicoIds);

    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.profissionalEspecialidade.deleteMany({ where: { barbeariaId, profissionalId } });
      if (dados.especialidadeIds.length) {
        await tx.profissionalEspecialidade.createMany({
          data: dados.especialidadeIds.map((especialidadeId) => ({
            barbeariaId,
            profissionalId,
            especialidadeId,
            principal: especialidadeId === Number(dados.especialidadePrincipalId),
          })),
        });
      }
      if (dados.servicoIds !== undefined) {
        await tx.profissionalServico.deleteMany({ where: { barbeariaId, profissionalId } });
        if (dados.servicoIds.length) {
          await tx.profissionalServico.createMany({
            data: dados.servicoIds.map((servicoId) => ({
              barbeariaId,
              profissionalId,
              servicoId,
              ativo: true,
            })),
          });
        }
      }
      return tx.profissional.findUnique({
        where: { id: profissionalId },
        include: {
          especialidades: { include: { especialidade: true } },
          servicosHabilitados: { include: { servico: true } },
        },
      });
    });
  }

  async atualizarServico(barbeariaId: number, servicoId: number, dados: AtualizarCatalogoServicoDto) {
    await this.integridade.validarEntidadeTenant('servico', servicoId, barbeariaId);
    await this.integridade.validarEspecialidades(barbeariaId, dados.especialidadeIds);
    await this.integridade.validarRequisitos(dados.requisitos.map((item) => item.requisitoId));

    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.servicoEspecialidade.deleteMany({ where: { barbeariaId, servicoId } });
      await tx.servicoRequisito.deleteMany({ where: { servicoId } });
      if (dados.recursosNecessarios !== undefined) {
        await tx.servicoRecurso.deleteMany({ where: { servicoId } });
      }
      if (dados.especialidadeIds.length) {
        await tx.servicoEspecialidade.createMany({
          data: dados.especialidadeIds.map((especialidadeId) => ({ barbeariaId, servicoId, especialidadeId })),
        });
      }
      if (dados.requisitos.length) {
        await tx.servicoRequisito.createMany({
          data: dados.requisitos.map((item) => ({
            servicoId,
            requisitoId: item.requisitoId,
            obrigatorio: item.obrigatorio ?? true,
            observacao: item.observacao?.trim() || null,
          })),
        });
      }
      if (dados.recursosNecessarios?.length) {
        await tx.servicoRecurso.createMany({
          data: dados.recursosNecessarios.map((recurso) => ({
            servicoId,
            tipoRecurso: recurso.tipoRecurso.trim().toUpperCase(),
            quantidade: recurso.quantidade,
          })),
        });
      }
      return tx.servico.update({
        where: { id: servicoId, barbeariaId },
        data: {
          observacoes: dados.observacoes?.trim() || null,
          modeloAtendimento: dados.modeloAtendimento,
          duracaoMinutos: dados.duracaoMinutos,
          qtdeSlots: Math.ceil(dados.duracaoMinutos / 15),
          preparoAntesMinutos: dados.preparoAntesMinutos ?? 0,
          preparoDepoisMinutos: dados.preparoDepoisMinutos ?? 0,
          deslocamentoMinutos: dados.deslocamentoMinutos ?? 0,
        },
        include: {
          especialidades: { include: { especialidade: true } },
          requisitos: { include: { requisito: true } },
          recursosNecessarios: true,
        },
      });
    });
  }

  private obterConfiguracaoComCliente(cliente: any, barbeariaId: number) {
    return cliente.barbearia.findUnique({
      where: { id: barbeariaId },
      select: {
        id: true,
        nome: true,
        slug: true,
        tipoEstabelecimento: true,
        modeloAtendimento: true,
        segmentos: { include: { segmento: true } },
        especialidades: { include: { especialidade: { include: { segmento: true } } } },
      },
    });
  }
}
