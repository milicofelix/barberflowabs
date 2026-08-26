import { Injectable } from '@nestjs/common';
import { RepositorioUsuario, Usuario } from '@barbabrutal/core';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';

@Injectable()
export class UsuarioPrisma implements RepositorioUsuario {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(usuario: Usuario): Promise<void> {
    const dados = {
      ...usuario,
      barbeariaId: usuario.barbeariaId ?? DEFAULT_BARBEARIA_ID,
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
        barbeariaId: true,
        nome: true,
        email: true,
        senha: true,
        telefone: true,
        barbeiro: true,
        papel: true,
      },
    });

    if (!usuario) return null;

    return {
      ...usuario,
      papel: this.normalizarPapel(usuario.papel, usuario.barbeiro),
    };
  }

  private normalizarPapel(papel: string | null | undefined, barbeiro: boolean): Usuario['papel'] {
    if (papel === 'SUPER_ADMIN' || papel === 'BARBER' || papel === 'CUSTOMER') {
      return papel;
    }

    return barbeiro ? 'BARBER' : 'CUSTOMER';
  }
}
