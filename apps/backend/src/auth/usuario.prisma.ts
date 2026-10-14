import { Injectable } from '@nestjs/common';
import { RepositorioUsuario, Usuario } from '@uniflowabs/core';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class UsuarioPrisma implements RepositorioUsuario {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(usuario: Usuario): Promise<void> {
    const dados = {
      ...usuario,
      estabelecimentoId: usuario.estabelecimentoId ?? null,
      papel: usuario.papel ?? 'CUSTOMER',
    };

    await this.prisma.usuario.upsert({
      where: { id: usuario.id ?? -1 },
      update: dados,
      create: dados as any,
    });
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        estabelecimentoId: true,
        nome: true,
        email: true,
        senha: true,
        trocarSenhaObrigatoria: true,
        telefone: true,
        fotoURL: true,
        membroEstabelecimento: true,
        papel: true,
      },
    });

    if (!usuario) return null;

    return {
      ...usuario,
      estabelecimentoId: usuario.estabelecimentoId ?? undefined,
      papel: this.normalizarPapel(usuario.papel, usuario.membroEstabelecimento),
    };
  }

  private normalizarPapel(papel: string | null | undefined, membroEstabelecimento: boolean): Usuario['papel'] {
    if (['SUPER_ADMIN', 'APP_OWNER', 'ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER', 'CUSTOMER'].includes(String(papel))) {
      return papel as Usuario['papel'];
    }

    return membroEstabelecimento ? 'ESTABLISHMENT_MEMBER' : 'CUSTOMER';
  }

  async alterarSenha(id: number, hashAtual: string, hashNovo: string) {
    const resultado = await this.prisma.usuario.updateMany({
      where: { id, senha: hashAtual },
      data: { senha: hashNovo, trocarSenhaObrigatoria: false },
    });
    return resultado.count === 1;
  }
}
