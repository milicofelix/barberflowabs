import { Injectable } from '@nestjs/common';
import { ModeloAtendimento } from 'src/estabelecimento/estabelecimento.constants';
import {
  AtualizarCatalogoEstabelecimentoDto,
  AtualizarCatalogoServicoDto,
  AtualizarEspecialidadesProfissionalDto,
  ListarServicosSugeridosDto,
} from './catalogo.dto';
import { CatalogoPolicy } from './catalogo.policy';
import { CatalogoPrisma } from './catalogo.prisma';
import { CatalogoConsultaPrisma } from './catalogo-consulta.prisma';

@Injectable()
export class CatalogoService {
  constructor(
    private readonly repo: CatalogoPrisma,
    private readonly consulta: CatalogoConsultaPrisma,
    private readonly policy: CatalogoPolicy,
  ) {}

  listarSegmentos() {
    return this.consulta.listarSegmentos();
  }

  listarRequisitos() {
    return this.consulta.listarRequisitos();
  }

  listarServicosSugeridos(filtros: ListarServicosSugeridosDto) {
    return this.consulta.listarServicosSugeridos(filtros);
  }

  obterConfiguracao(estabelecimentoId: number) {
    return this.consulta.obterConfiguracao(estabelecimentoId);
  }

  atualizarEstabelecimento(usuario: any, dados: AtualizarCatalogoEstabelecimentoDto) {
    this.policy.validarGestor(usuario);
    this.policy.validarEstabelecimento(dados);
    return this.repo.atualizarEstabelecimento(usuario.estabelecimentoId, dados);
  }

  atualizarProfissional(usuario: any, profissionalId: number, dados: AtualizarEspecialidadesProfissionalDto) {
    this.policy.validarGestor(usuario);
    this.policy.validarProfissional(dados);
    return this.repo.atualizarProfissional(usuario.estabelecimentoId, profissionalId, dados);
  }

  async atualizarServico(usuario: any, servicoId: number, dados: AtualizarCatalogoServicoDto) {
    this.policy.validarGestor(usuario);
    this.policy.validarServico(dados);
    const modeloEstabelecimento = await this.consulta.obterModeloAtendimento(usuario.estabelecimentoId);
    this.policy.validarCompatibilidadeModelo(
      modeloEstabelecimento as ModeloAtendimento,
      dados.modeloAtendimento,
    );
    return this.repo.atualizarServico(usuario.estabelecimentoId, servicoId, dados);
  }
}
