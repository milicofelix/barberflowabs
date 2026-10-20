import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { MODELOS_ATENDIMENTO, TIPOS_ESTABELECIMENTO } from 'src/estabelecimento/estabelecimento.constants';
import { validarEmail, validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { GeocodificacaoEnderecoService } from 'src/geocodificacao/geocodificacao-endereco.service';
import { STATUS_SOLICITACAO_EDITAVEIS, TERMOS_CADASTRO_ESTABELECIMENTO_VERSAO } from './solicitacao-estabelecimento.constants';
import { EnviarSolicitacaoEstabelecimentoDto, RevisarSolicitacaoEstabelecimentoDto, SalvarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';
import { SolicitacaoEstabelecimentoRepository } from './solicitacao-estabelecimento.repository';

@Injectable()
export class SolicitacaoEstabelecimentoService {
  constructor(
    private readonly repository: SolicitacaoEstabelecimentoRepository,
    private readonly geocodificacao: GeocodificacaoEnderecoService,
  ) {}

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

  async listarPendentes(usuarioId: number) { await this.validarAdministrador(usuarioId); return this.repository.listarPendentes(); }
  async obterParaRevisao(id: number, usuarioId: number) {
    await this.validarAdministrador(usuarioId);
    const solicitacao = await this.repository.buscarParaRevisao(id);
    if (!solicitacao) throw new BadRequestException('Solicitação não encontrada');
    return solicitacao;
  }
  async resolverCoordenadas(id: number, usuarioId: number, googleMapsUrl?: string | null) {
    const solicitacao = await this.obterParaRevisao(id, usuarioId);
    if (solicitacao.modeloAtendimento === 'DOMICILIAR') {
      throw new BadRequestException('Atendimento exclusivamente domiciliar não exige coordenadas do estabelecimento');
    }
    return this.geocodificacao.resolver(solicitacao, googleMapsUrl);
  }
  async revisar(id: number, usuarioId: number, decisao: 'APPROVED' | 'CORRECTION_REQUESTED' | 'REJECTED', dados: RevisarSolicitacaoEstabelecimentoDto = {}) {
    await this.validarAdministrador(usuarioId);
    const texto = dados.motivo?.trim();
    if (decisao !== 'APPROVED' && !texto) throw new BadRequestException('Informe o motivo da decisão');
    const solicitacao = await this.repository.buscarParaRevisao(id);
    if (!solicitacao) throw new BadRequestException('Solicitação não encontrada');
    const latitude = this.coordenada(dados.latitude, -90, 90, 'Latitude');
    const longitude = this.coordenada(dados.longitude, -180, 180, 'Longitude');
    if (decisao === 'APPROVED' && solicitacao.modeloAtendimento !== 'DOMICILIAR' && (latitude === null || longitude === null)) {
      throw new BadRequestException('Latitude e longitude devem ser validadas pelo superadmin antes da aprovação');
    }
    return this.repository.revisar(id, usuarioId, decisao, texto, latitude, longitude);
  }

  private coordenada(valor: unknown, minimo: number, maximo: number, campo: string) {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) throw new BadRequestException(`${campo} inválida`);
    return numero;
  }

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

  private async validarAdministrador(usuarioId: number) {
    const usuario = await this.repository.buscarPapelUsuario(usuarioId);
    if (!usuario || !['SUPER_ADMIN', 'APP_OWNER'].includes(usuario.papel)) throw new ForbiddenException('Acesso restrito à administração da plataforma');
  }
}
