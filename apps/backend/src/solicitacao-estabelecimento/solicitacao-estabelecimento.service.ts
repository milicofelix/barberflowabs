import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { MODELOS_ATENDIMENTO, TIPOS_ESTABELECIMENTO } from 'src/estabelecimento/estabelecimento.constants';
import { validarEmail, validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { STATUS_SOLICITACAO_EDITAVEIS, TERMOS_CADASTRO_ESTABELECIMENTO_VERSAO } from './solicitacao-estabelecimento.constants';
import { EnviarSolicitacaoEstabelecimentoDto, SalvarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';
import { SolicitacaoEstabelecimentoRepository } from './solicitacao-estabelecimento.repository';

@Injectable()
export class SolicitacaoEstabelecimentoService {
  constructor(private readonly repository: SolicitacaoEstabelecimentoRepository) {}

  listar(usuarioId: number) { return this.repository.listarDoUsuario(usuarioId); }
  configuracao() {
    return {
      termosVersao: TERMOS_CADASTRO_ESTABELECIMENTO_VERSAO,
      tiposEstabelecimento: [...TIPOS_ESTABELECIMENTO],
      modelosAtendimento: [...MODELOS_ATENDIMENTO],
    };
  }
  obter(id: number, usuarioId: number) { return this.repository.buscarDoUsuarioOuFalhar(id, usuarioId); }
  criarRascunho(usuarioId: number) { return this.repository.criarOuObterRascunho(usuarioId); }

  async salvar(id: number, usuarioId: number, dados: SalvarSolicitacaoEstabelecimentoDto) {
    validarNumeroInteiroPositivo(dados?.versao, 'Versão');
    this.validarFormatosParciais(dados);
    if (dados.segmentoIds || dados.especialidadeIds) {
      const atual = await this.repository.buscarDoUsuarioOuFalhar(id, usuarioId);
      const segmentoIds = dados.segmentoIds ?? atual.segmentos.map((item: any) => item.segmentoId);
      const especialidadeIds = dados.especialidadeIds ?? atual.especialidades.map((item: any) => item.especialidadeId);
      this.validarIds(segmentoIds, 'Segmentos'); this.validarIds(especialidadeIds, 'Especialidades');
      if (!(await this.repository.validarCatalogo(segmentoIds, especialidadeIds))) {
        throw new BadRequestException('Segmentos ou especialidades incompatíveis');
      }
    }
    return this.repository.salvar(id, usuarioId, this.normalizar(dados));
  }

  async enviar(id: number, usuarioId: number, dados: EnviarSolicitacaoEstabelecimentoDto) {
    validarNumeroInteiroPositivo(dados?.versao, 'Versão');
    if (dados?.aceitouTermos !== true || dados?.termosVersao !== TERMOS_CADASTRO_ESTABELECIMENTO_VERSAO) {
      throw new BadRequestException('É necessário aceitar a versão atual dos termos');
    }
    const solicitacao = await this.repository.buscarDoUsuarioOuFalhar(id, usuarioId);
    if (solicitacao.status === 'PENDING_REVIEW') return solicitacao;
    if (!STATUS_SOLICITACAO_EDITAVEIS.includes(solicitacao.status)) throw new ConflictException('Solicitação não pode ser enviada neste estado');
    await this.validarParaEnvio(solicitacao);
    return this.repository.enviar(id, usuarioId, dados.versao, dados.termosVersao);
  }

  private async validarParaEnvio(solicitacao: any) {
    validarTextoObrigatorio(solicitacao.nomePublico, 'Nome público'); validarEmail(solicitacao.emailComercial, 'E-mail comercial');
    validarTextoObrigatorio(solicitacao.telefoneComercial, 'Telefone comercial');
    if (!/^\d{10,11}$/.test(solicitacao.telefoneComercial)) throw new BadRequestException('Telefone comercial inválido');
    if (!TIPOS_ESTABELECIMENTO.includes(solicitacao.tipoEstabelecimento)) throw new BadRequestException('Tipo de estabelecimento inválido');
    if (!MODELOS_ATENDIMENTO.includes(solicitacao.modeloAtendimento)) throw new BadRequestException('Modelo de atendimento inválido');
    if (!solicitacao.segmentos.length || !solicitacao.especialidades.length) throw new BadRequestException('Selecione segmento e especialidade');
    validarTextoObrigatorio(solicitacao.planoSlug, 'Plano');
    if (!(await this.repository.planoExiste(solicitacao.planoSlug))) throw new BadRequestException('Plano inválido');
    if (solicitacao.modeloAtendimento !== 'DOMICILIAR') {
      ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'].forEach((campo) => validarTextoObrigatorio(solicitacao[campo], this.rotulo(campo)));
      if (!/^\d{8}$/.test(solicitacao.cep) || !/^[A-Z]{2}$/.test(solicitacao.estado)) throw new BadRequestException('Endereço inválido');
    }
  }

  private validarFormatosParciais(dados: SalvarSolicitacaoEstabelecimentoDto) {
    if (dados.emailComercial) validarEmail(dados.emailComercial, 'E-mail comercial');
    if (dados.telefoneComercial && !/^\d{10,11}$/.test(dados.telefoneComercial.replace(/\D/g, ''))) throw new BadRequestException('Telefone comercial inválido');
    if (dados.tipoEstabelecimento && !TIPOS_ESTABELECIMENTO.includes(dados.tipoEstabelecimento as any)) throw new BadRequestException('Tipo de estabelecimento inválido');
    if (dados.modeloAtendimento && !MODELOS_ATENDIMENTO.includes(dados.modeloAtendimento as any)) throw new BadRequestException('Modelo de atendimento inválido');
    if (dados.cep && !/^\d{8}$/.test(dados.cep.replace(/\D/g, ''))) throw new BadRequestException('CEP inválido');
    if (dados.estado && !/^[A-Za-z]{2}$/.test(dados.estado.trim())) throw new BadRequestException('UF inválida');
  }

  private validarIds(ids: number[], campo: string) {
    if (!Array.isArray(ids) || ids.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) throw new BadRequestException(`${campo} inválidos`);
    if (new Set(ids.map(Number)).size !== ids.length) throw new BadRequestException(`${campo} repetidos`);
  }

  private normalizar(dados: SalvarSolicitacaoEstabelecimentoDto) {
    const texto = (valor?: string | null) => valor === undefined ? undefined : valor?.trim() || null;
    return {
      ...dados, nomePublico: texto(dados.nomePublico), emailComercial: texto(dados.emailComercial)?.toLowerCase(),
      telefoneComercial: dados.telefoneComercial === undefined ? undefined : dados.telefoneComercial?.replace(/\D/g, '') || null,
      cep: dados.cep === undefined ? undefined : dados.cep?.replace(/\D/g, '') || null,
      logradouro: texto(dados.logradouro), numero: texto(dados.numero), complemento: texto(dados.complemento),
      pontoReferencia: texto(dados.pontoReferencia), bairro: texto(dados.bairro), cidade: texto(dados.cidade),
      estado: texto(dados.estado)?.toUpperCase(), planoSlug: texto(dados.planoSlug),
      segmentoIds: dados.segmentoIds?.map(Number), especialidadeIds: dados.especialidadeIds?.map(Number),
    };
  }

  private rotulo(campo: string) {
    return ({ cep: 'CEP', logradouro: 'Logradouro', numero: 'Número', bairro: 'Bairro', cidade: 'Cidade', estado: 'UF' } as Record<string, string>)[campo];
  }
}
