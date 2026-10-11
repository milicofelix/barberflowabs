import { BadRequestException, Injectable } from '@nestjs/common';
import { validarTextoObrigatorio } from 'src/shared/validacao';
import { CANAIS_COMUNICACAO, EVENTOS_TEMPLATE } from './relacionamento.constants';
import { AtualizarClienteDto, SalvarPreferenciasDto, SalvarTemplateDto } from './relacionamento.dto';
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
}
