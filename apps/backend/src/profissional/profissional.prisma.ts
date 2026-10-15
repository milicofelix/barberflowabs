import { Profissional, RepositorioProfissional, urlImagemProfissional } from '@uniflowabs/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_ESTABELECIMENTO_ID } from 'src/shared/tenant';
import { CriarProfissionalDto } from './profissional.dto';

@Injectable()
export class ProfissionalPrisma implements RepositorioProfissional {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(estabelecimentoId = DEFAULT_ESTABELECIMENTO_ID): Promise<Profissional[]> {
    const profissionais = await this.prisma.profissional.findMany({
      where: { estabelecimentoId },
    });
    return profissionais.map((profissional) => ({ ...profissional, imagemURL: urlImagemProfissional(profissional.imagemURL, profissional.sexo) }));
  }

  criar(estabelecimentoId: number, dados: CriarProfissionalDto): Promise<Profissional> {
    const imagemURL = urlImagemProfissional(dados.imagemURL, dados.sexo);
    return this.prisma.profissional.create({
      data: {
        ...dados,
        imagemURL,
        avaliacao: dados.avaliacao ?? 5,
        quantidadeAvaliacoes: dados.quantidadeAvaliacoes ?? 0,
        estabelecimentoId,
      },
    });
  }

  atualizar(
    id: number,
    estabelecimentoId: number,
    dados: CriarProfissionalDto,
  ): Promise<Profissional> {
    const imagemURL = urlImagemProfissional(dados.imagemURL, dados.sexo);
    return this.prisma.profissional.update({
      where: { id, estabelecimentoId },
      data: {
        ...dados,
        imagemURL,
        avaliacao: dados.avaliacao ?? 5,
        quantidadeAvaliacoes: dados.quantidadeAvaliacoes ?? 0,
      },
    });
  }

  async excluir(id: number, estabelecimentoId: number): Promise<void> {
    await this.prisma.profissional.delete({
      where: { id, estabelecimentoId },
    });
  }

}
