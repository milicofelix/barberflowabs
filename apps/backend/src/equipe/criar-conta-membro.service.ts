import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { BcryptProvider } from 'src/auth/bcrypt.provider';
import { EquipePolicy } from './equipe.policy';
import { CriarContaMembroDto } from './equipe.dto';
import { validarEmail, validarNumeroInteiroPositivo, validarSenha, validarTextoObrigatorio } from 'src/shared/validacao';

@Injectable()
export class CriarContaMembroService {
  constructor(private readonly prisma: PrismaService, private readonly cripto: BcryptProvider, private readonly policy: EquipePolicy) {}

  async executar(operador: { id: number; estabelecimentoId: number }, dados: CriarContaMembroDto) {
    await this.policy.validarPermissao(operador, 'EQUIPE_GERENCIAR');
    validarEmail(dados?.email);
    validarSenha(dados?.senhaTemporaria);
    if (Buffer.byteLength(dados.senhaTemporaria, 'utf8') > 72) throw new BadRequestException('Senha deve ter no máximo 72 bytes');
    this.policy.validarAcesso(dados);
    if (dados.profissionalId != null) validarNumeroInteiroPositivo(dados.profissionalId, 'Profissional');
    else validarTextoObrigatorio(dados.nome, 'Nome');
    const email = dados.email.trim().toLowerCase();
    const reservados = (process.env.SUPER_ADMIN_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase());
    if (reservados.includes(email)) throw new BadRequestException('Este e-mail é reservado à administração da plataforma');
    const senha = await this.cripto.criptografar(dados.senhaTemporaria);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (await tx.usuario.findUnique({ where: { email }, select: { id: true } })) {
          throw new ConflictException('Este e-mail já possui uma conta. Selecione a conta existente na unidade; sua senha não será alterada.');
        }
        const profissional = dados.profissionalId == null ? null : await tx.profissional.findFirst({
          where: { id: Number(dados.profissionalId), estabelecimentoId: operador.estabelecimentoId },
          select: { id: true, nome: true, vinculoEquipe: { select: { id: true } } },
        });
        if (dados.profissionalId != null && !profissional) throw new BadRequestException('Profissional não pertence ao estabelecimento');
        if (profissional?.vinculoEquipe) throw new ConflictException('Este profissional já está vinculado a um membro. Edite o acesso existente.');
        const usuario = await tx.usuario.create({ data: {
          nome: profissional?.nome ?? dados.nome!.trim(), email, senha,
          estabelecimentoId: operador.estabelecimentoId, membroEstabelecimento: true,
          papel: 'ESTABLISHMENT_MEMBER', trocarSenhaObrigatoria: true,
        }, select: { id: true } });
        const membro = await tx.membroEquipe.create({ data: {
          usuarioId: usuario.id, estabelecimentoId: operador.estabelecimentoId,
          profissionalId: profissional?.id ?? null, papel: dados.papel,
          permissoes: dados.permissoes, ativo: true,
        }, select: { id: true, usuarioId: true, profissionalId: true } });
        await tx.logAuditoria.create({ data: {
          usuarioId: operador.id, estabelecimentoId: operador.estabelecimentoId,
          acao: 'CRIAR_CONTA_MEMBRO', entidade: 'MEMBRO_EQUIPE', entidadeId: String(membro.id),
          detalhes: { usuarioId: usuario.id, profissionalId: membro.profissionalId, papel: dados.papel, permissoes: dados.permissoes },
        } });
        return membro;
      });
    } catch (erro) {
      if ((erro as { code?: string }).code === 'P2002') {
        throw new ConflictException('A conta ou o vínculo profissional já existe. Atualize a equipe antes de tentar novamente.');
      }
      throw erro;
    }
  }
}
