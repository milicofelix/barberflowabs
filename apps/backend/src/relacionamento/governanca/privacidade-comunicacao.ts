import { ConflictException } from '@nestjs/common';

export async function bloquearClienteComunicacao(tx: any, estabelecimentoId: number, usuarioId: number) {
  await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM clientes_estabelecimentos WHERE estabelecimentoId=${estabelecimentoId} AND usuarioId=${usuarioId} FOR UPDATE`;
  const cliente = await tx.clienteEstabelecimento.findUnique({ where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId } } });
  if (cliente?.privacidadeRestritaEm) throw new ConflictException('Cliente com tratamento de relacionamento restrito por solicitação de privacidade');
  return cliente;
}
