import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { SalvarEscalasDto, SalvarMembroEquipeDto } from './equipe.dto';
import { EquipePolicy } from './equipe.policy';
import { EquipePrisma } from './equipe.prisma';

@Controller('equipe')
export class EquipeController {
  constructor(private readonly repo: EquipePrisma, private readonly policy: EquipePolicy) {}

  @Get('minhas-permissoes')
  minhasPermissoes(@UsuarioLogado() usuario: any) {
    return this.policy.obterPermissoes(usuario);
  }

  @Get()
  async listar(@UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listar(usuario.barbeariaId);
  }

  @Get('usuarios-disponiveis')
  async usuariosDisponiveis(@UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listarUsuariosDisponiveis(usuario.barbeariaId);
  }

  @Post()
  async criar(@Body() dados: SalvarMembroEquipeDto, @UsuarioLogado() usuario: any) {
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.policy.validarMembro(dados);
    return this.repo.criar(usuario.barbeariaId, dados);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: SalvarMembroEquipeDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Membro');
    await this.policy.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.policy.validarMembro(dados);
    return this.repo.atualizar(Number(id), usuario.barbeariaId, dados);
  }

  @Get('profissionais/:id/escalas')
  async listarEscalas(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.policy.validarPermissao(usuario, 'ESCALAS_GERENCIAR');
    return this.repo.listarEscalas(Number(id), usuario.barbeariaId);
  }

  @Put('profissionais/:id/escalas')
  async salvarEscalas(@Param('id') id: string, @Body() dados: SalvarEscalasDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Profissional');
    await this.policy.validarPermissao(usuario, 'ESCALAS_GERENCIAR');
    this.policy.validarEscalas(dados?.escalas);
    return this.repo.salvarEscalas(Number(id), usuario.barbeariaId, dados.escalas);
  }
}

