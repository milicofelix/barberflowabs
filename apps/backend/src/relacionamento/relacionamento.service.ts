import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { validarTextoObrigatorio } from 'src/shared/validacao';
import { CANAIS_COMUNICACAO, EVENTOS_TEMPLATE, STATUS_ENVIO_COMUNICACAO, TIPOS_CALLBACK_COMUNICACAO } from './relacionamento.constants';
import { AtualizarClienteDto, CallbackComunicacaoDto, EnfileirarComunicacaoDto, ListarEnviosDto, ReprocessarEnvioDto, SalvarPreferenciasDto, SalvarTemplateDto } from './relacionamento.dto';
import { RelacionamentoRepository } from './relacionamento.repository';

@Injectable()
export class RelacionamentoService {
  constructor(private readonly repository: RelacionamentoRepository) {}

  listarClientes(estabelecimentoId: number, busca?: string) { return this.repository.listarClientes(estabelecimentoId, busca); }
  obterCliente(id: number, estabelecimentoId: number) { return this.repository.obterCliente(id, estabelecimentoId); }

  atualizarCliente(id: number, estabelecimentoId: number, dados: AtualizarClienteDto) {
    if (dados.status && !['ATIVO', 'INATIVO', 'BLOQUEADO'].includes(dados.status)) throw new BadRequestException('Status do cliente inválido');
    if (dados.tags && (!Array.isArray(dados.tags) || dados.tags.some((tag) => typeof tag !== 'string' || !tag.trim()))) {
      throw new BadRequestException('Tags inválidas');
    }
    return this.repository.atualizarCliente(id, estabelecimentoId, { ...dados, tags: dados.tags?.map((tag) => tag.trim()) });
  }

  listarPreferencias(clienteId: number, estabelecimentoId: number) { return this.repository.listarPreferencias(clienteId, estabelecimentoId); }

  salvarPreferencias(clienteId: number, estabelecimentoId: number, dados: SalvarPreferenciasDto) {
    if (!Array.isArray(dados?.preferencias) || !dados.preferencias.length) throw new BadRequestException('Preferências são obrigatórias');
    if (dados.preferencias.some((item) => !CANAIS_COMUNICACAO.includes(item.canal) || typeof item.consentido !== 'boolean')) {
      throw new BadRequestException('Preferência de comunicação inválida');
    }
    if (new Set(dados.preferencias.map((item) => item.canal)).size !== dados.preferencias.length) {
      throw new BadRequestException('Canal de comunicação duplicado');
    }
    return this.repository.salvarPreferencias(clienteId, estabelecimentoId, dados.preferencias);
  }

  listarTemplates(estabelecimentoId: number) { return this.repository.listarTemplates(estabelecimentoId); }

  salvarTemplate(estabelecimentoId: number, dados: SalvarTemplateDto, id?: number) {
    validarTextoObrigatorio(dados?.nome, 'Nome'); validarTextoObrigatorio(dados?.conteudo, 'Conteúdo');
    if (!CANAIS_COMUNICACAO.includes(dados?.canal as any)) throw new BadRequestException('Canal inválido');
    if (!EVENTOS_TEMPLATE.includes(dados?.evento as any)) throw new BadRequestException('Evento inválido');
    if (dados.canal === 'EMAIL') validarTextoObrigatorio(dados?.assunto, 'Assunto');
    return this.repository.salvarTemplate(estabelecimentoId, dados, id);
  }

  async enfileirar(estabelecimentoId: number, dados: EnfileirarComunicacaoDto) {
    if (!Number.isInteger(Number(dados?.clienteId)) || Number(dados.clienteId) <= 0) throw new BadRequestException('Cliente inválido');
    if (!Number.isInteger(Number(dados?.templateId)) || Number(dados.templateId) <= 0) throw new BadRequestException('Template inválido');
    validarTextoObrigatorio(dados?.chaveIdempotencia, 'Chave de idempotência');
    if (dados.chaveIdempotencia.trim().length > 191) throw new BadRequestException('Chave de idempotência excede 191 caracteres');
    const agendadoPara = dados.agendadoPara ? new Date(dados.agendadoPara) : new Date();
    if (Number.isNaN(agendadoPara.getTime())) throw new BadRequestException('Data de agendamento inválida');
    const maximoTentativas = dados.maximoTentativas === undefined ? 3 : Number(dados.maximoTentativas);
    if (!Number.isInteger(maximoTentativas) || maximoTentativas < 1 || maximoTentativas > 10) throw new BadRequestException('Máximo de tentativas deve ficar entre 1 e 10');
    const { cliente, template, preferencia } = await this.repository.prepararEnvio(estabelecimentoId, dados);
    if (!preferencia?.consentido) throw new ConflictException(`Cliente não consentiu comunicações por ${template.canal}`);
    const destinatario = template.canal === 'EMAIL'
      ? cliente.usuario.email
      : template.canal === 'WHATSAPP' ? cliente.usuario.telefone : `push:usuario:${cliente.usuario.id}`;
    if (!destinatario) throw new ConflictException(`Cliente sem destino cadastrado para ${template.canal}`);
    const variaveis = dados.variaveis && typeof dados.variaveis === 'object' ? dados.variaveis : {};
    const renderizar = (texto: string | null) => texto?.replace(/{{\s*([\w.-]+)\s*}}/g, (_, chave) => String(variaveis[chave] ?? `{{${chave}}}`)) ?? null;
    try {
      return await this.repository.criarEnvio({
        estabelecimentoId, usuarioId: cliente.usuarioId, templateId: template.id,
        canal: template.canal, tipo: dados.tipo?.trim() || template.evento,
        destinatario, assunto: renderizar(template.assunto), conteudo: renderizar(template.conteudo),
        status: 'AGENDADO', chaveIdempotencia: dados.chaveIdempotencia.trim(), agendadoPara,
        maximoTentativas, metadados: { variaveis, origem: 'API_MANUAL' },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Já existe um envio com esta chave de idempotência');
      throw error;
    }
  }

  listarEnvios(estabelecimentoId: number, filtros: ListarEnviosDto) {
    if (filtros.status && !STATUS_ENVIO_COMUNICACAO.includes(filtros.status as any)) throw new BadRequestException('Status de envio inválido');
    if (filtros.canal && !CANAIS_COMUNICACAO.includes(filtros.canal)) throw new BadRequestException('Canal inválido');
    return this.repository.listarEnvios(estabelecimentoId, filtros);
  }

  obterEnvio(id: number, estabelecimentoId: number) { return this.repository.obterEnvio(id, estabelecimentoId); }

  reprocessarEnvio(id: number, estabelecimentoId: number, dados: ReprocessarEnvioDto) {
    const adicionais = dados?.tentativasAdicionais === undefined ? 3 : Number(dados.tentativasAdicionais);
    if (!Number.isInteger(adicionais) || adicionais < 1 || adicionais > 10) throw new BadRequestException('Tentativas adicionais devem ficar entre 1 e 10');
    return this.repository.reprocessarEnvio(id, estabelecimentoId, adicionais);
  }

  registrarCallback(provedor: string, dados: CallbackComunicacaoDto) {
    validarTextoObrigatorio(provedor, 'Provedor'); validarTextoObrigatorio(dados?.eventoId, 'Evento');
    if (!TIPOS_CALLBACK_COMUNICACAO.includes(dados?.tipo as any)) throw new BadRequestException('Tipo de callback inválido');
    if (dados.payload !== undefined && (typeof dados.payload !== 'object' || Array.isArray(dados.payload))) throw new BadRequestException('Payload inválido');
    return this.repository.registrarCallback(provedor.trim().toLowerCase(), dados);
  }
}
