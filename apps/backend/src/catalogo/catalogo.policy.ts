import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  MODELOS_ATENDIMENTO,
  ModeloAtendimento,
  TIPOS_ESTABELECIMENTO,
} from 'src/estabelecimento/estabelecimento.constants';
import {
  AtualizarCatalogoEstabelecimentoDto,
  AtualizarCatalogoServicoDto,
  AtualizarEspecialidadesProfissionalDto,
} from './catalogo.dto';

@Injectable()
export class CatalogoPolicy {
  validarGestor(usuario: any) {
    const papeisPermitidos = ['BARBER', 'BARBERSHOP_OWNER'];
    const permitido = usuario?.barbeariaId && (usuario.barbeiro || papeisPermitidos.includes(usuario.papel));
    if (!permitido) throw new ForbiddenException('Usuário sem permissão para gerenciar o catálogo');
  }

  validarEstabelecimento(dados: AtualizarCatalogoEstabelecimentoDto) {
    if (!TIPOS_ESTABELECIMENTO.includes(dados?.tipoEstabelecimento as any)) {
      throw new BadRequestException('Tipo de estabelecimento inválido');
    }
    this.validarModeloAtendimento(dados?.modeloAtendimento);
    this.validarIds(dados?.segmentoIds, 'Segmentos', true);
    this.validarIds(dados?.especialidadeIds, 'Especialidades');
  }

  validarProfissional(dados: AtualizarEspecialidadesProfissionalDto) {
    const ids = this.validarIds(dados?.especialidadeIds, 'Especialidades');
    if (dados?.especialidadePrincipalId && !ids.includes(Number(dados.especialidadePrincipalId))) {
      throw new BadRequestException('A especialidade principal deve estar entre as especialidades selecionadas');
    }
    if (dados.servicoIds !== undefined) this.validarIds(dados.servicoIds, 'Serviços');
  }

  validarServico(dados: AtualizarCatalogoServicoDto) {
    this.validarModeloAtendimento(dados?.modeloAtendimento);
    this.validarIds(dados?.especialidadeIds, 'Especialidades');

    if (!Array.isArray(dados?.requisitos)) throw new BadRequestException('Requisitos inválidos');
    this.validarIds(dados.requisitos.map((item) => item?.requisitoId), 'Requisitos');
    if (dados.observacoes && dados.observacoes.trim().length > 2000) {
      throw new BadRequestException('Observações devem ter no máximo 2000 caracteres');
    }
    this.validarMinutosPositivos(dados.duracaoMinutos, 'Duração');
    this.validarMinutosNaoNegativos(dados.preparoAntesMinutos, 'Preparação anterior');
    this.validarMinutosNaoNegativos(dados.preparoDepoisMinutos, 'Preparação posterior');
    this.validarMinutosNaoNegativos(dados.deslocamentoMinutos, 'Deslocamento');
    if (dados.recursosNecessarios !== undefined) {
      if (!Array.isArray(dados.recursosNecessarios)) throw new BadRequestException('Recursos inválidos');
      const tipos = dados.recursosNecessarios
        .map((recurso) => recurso?.tipoRecurso?.trim().toUpperCase())
        .filter(Boolean);
      if (tipos.length !== dados.recursosNecessarios.length || new Set(tipos).size !== tipos.length) {
        throw new BadRequestException('Tipos de recurso inválidos ou repetidos');
      }
      dados.recursosNecessarios.forEach((recurso) =>
        this.validarMinutosPositivos(recurso.quantidade, 'Quantidade do recurso'),
      );
    }
  }

  validarCompatibilidadeModelo(estabelecimento: ModeloAtendimento, servico: ModeloAtendimento) {
    if (estabelecimento !== 'HIBRIDO' && estabelecimento !== servico) {
      throw new BadRequestException('O modelo do serviço não é oferecido pelo estabelecimento');
    }
  }

  private validarModeloAtendimento(modelo: ModeloAtendimento) {
    if (!MODELOS_ATENDIMENTO.includes(modelo as any)) {
      throw new BadRequestException('Modelo de atendimento inválido');
    }
  }

  private validarIds(valores: unknown, campo: string, obrigatorio = false) {
    if (!Array.isArray(valores) || (obrigatorio && valores.length === 0)) {
      throw new BadRequestException(`${campo} inválidos`);
    }

    const ids = valores.map(Number);
    if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
      throw new BadRequestException(`${campo} inválidos`);
    }
    return ids;
  }

  private validarMinutosPositivos(valor: unknown, campo: string) {
    if (!Number.isInteger(Number(valor)) || Number(valor) <= 0) {
      throw new BadRequestException(`${campo} inválida`);
    }
  }

  private validarMinutosNaoNegativos(valor: unknown, campo: string) {
    if (valor === undefined) return;
    if (!Number.isInteger(Number(valor)) || Number(valor) < 0) {
      throw new BadRequestException(`${campo} inválido`);
    }
  }
}
