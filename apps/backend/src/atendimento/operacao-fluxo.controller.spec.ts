import { ForbiddenException } from '@nestjs/common';
import { OperacaoFluxoController } from './operacao-fluxo.controller';

describe('Permissões do monitoramento do fluxo', () => {
  it('não consulta nem altera o fluxo sem CONFIGURACOES_GERENCIAR', async () => {
    const repo = { configuracao: jest.fn(), configurar: jest.fn(), monitorar: jest.fn(), reprocessar: jest.fn() };
    const policy = { validarPermissao: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const controller = new OperacaoFluxoController(repo as any, policy as any);
    const usuario: any = { id: 9, estabelecimentoId: 3 };
    await expect(controller.configuracao(usuario)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.monitorar(usuario)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.reprocessar(usuario, '7')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.configuracao).not.toHaveBeenCalled(); expect(repo.monitorar).not.toHaveBeenCalled(); expect(repo.reprocessar).not.toHaveBeenCalled();
  });
  it('usa o tenant da sessão, sem aceitar unidade no corpo', async () => {
    const repo = { reprocessar: jest.fn() }; const policy = { validarPermissao: jest.fn() };
    const controller = new OperacaoFluxoController(repo as any, policy as any);
    await controller.reprocessar({ id: 9, estabelecimentoId: 3 } as any, '7');
    expect(repo.reprocessar).toHaveBeenCalledWith(3, 9, 7);
  });
});
