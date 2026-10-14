import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { CriarContaMembroDto, SalvarEscalasDto, SalvarMembroEquipeDto } from './equipe.dto';
import { CriarContaMembroService } from './criar-conta-membro.service';
import { EquipePolicy } from './equipe.policy';
import { EquipePrisma } from './equipe.prisma';

@Controller('equipe')
export class EquipeController {
  constructor(private readonly repo: EquipePrisma, private readonly policy: EquipePolicy, private readonly criarConta: CriarContaMembroService) {}

  @Post('com-conta')
  criarComConta(@Body() dados: CriarContaMembroDto, @UsuarioLogado() usuario: any) {
    return this.criarConta.executar(usuario, dados);
  }

  @Get('minhas-permissoes')
  minhasPermissoes(@UsuarioLogado() usuario: any) {
    return this.policy.obterPermissoes(usuario);
  }

  @Get()
  async listar(@UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listar(usuario.estabelecimentoId);
  }

  @Get('usuarios-disponiveis')
  async usuariosDisponiveis(@UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listarUsuariosDisponiveis(usuario.estabelecimentoId);
  }

  @Post()
  async criar(@Body() dados: SalvarMembroEquipeDto, @UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.policy.validarMembro(dados);
    return this.repo.criar(usuario.estabelecimentoId, dados);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: SalvarMembroEquipeDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Membro');
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.policy.validarMembro(dados);
    await this.policy.validarAtualizacaoMembroProtegido(Number(id), usuario.estabelecimentoId, dados);
    return this.repo.atualizar(Number(id), usuario.estabelecimentoId, dados);
  }

  @Delete(':id')
  async remover(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Membro');
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    await this.policy.validarRemocaoMembroProtegido(Number(id), usuario.estabelecimentoId);
    return this.repo.remover(Number(id), usuario.estabelecimentoId);
  }

  @Get('profissionais/:id/escalas')
  async listarEscalas(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.policy.validarPermissao(usuario, 'ESCALAS_GERENCIAR');
    return this.repo.listarEscalas(Number(id), usuario.estabelecimentoId);
  }

  @Put('profissionais/:id/escalas')
  async salvarEscalas(@Param('id') id: string, @Body() dados: SalvarEscalasDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.policy.validarPermissao(usuario, 'ESCALAS_GERENCIAR');
    this.policy.validarEscalas(dados?.escalas);
    return this.repo.salvarEscalas(Number(id), usuario.estabelecimentoId, dados.escalas);
  }
}

