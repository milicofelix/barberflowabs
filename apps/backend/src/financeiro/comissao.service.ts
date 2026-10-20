import { Injectable } from '@nestjs/common';
import { chaveComissao } from './financeiro.constants';

interface ConfiguracaoComissao {
  chave: string;
  percentual: unknown;
  ativo: boolean;
}

@Injectable()
export class ComissaoService {
  percentual(configuracoes: ConfiguracaoComissao[], profissionalId: number, servicoId: number) {
    const porChave = new Map(
      configuracoes.filter((item) => item.ativo).map((item) => [item.chave, Number(item.percentual)]),
    );

    const prioridades = [
      chaveComissao(profissionalId, servicoId),
      chaveComissao(null, servicoId),
      chaveComissao(profissionalId, null),
      chaveComissao(),
    ];

    return prioridades.map((chave) => porChave.get(chave)).find((valor) => valor !== undefined) ?? 0;
  }
}
