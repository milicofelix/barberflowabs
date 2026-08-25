import { Injectable } from '@nestjs/common';
import { RepositorioUsuario, Usuario } from '@barberflowabs/core';
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
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }
}
