import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { SalvarIndisponibilidadeRecursoDto, SalvarRecursoDto } from './recurso.dto';
import { RecursoPolicy } from './recurso.policy';
import { RecursoPrisma } from './recurso.prisma';

@Controller('recursos')
export class RecursoController {
  constructor(
    private readonly repo: RecursoPrisma,
    private readonly policy: RecursoPolicy,
  ) {}

  @Get()
  async listar(@UsuarioLogado() usuario: any) {
    await this.policy.validarGestor(usuario);
    return this.repo.listar(usuario.barbeariaId);
  }

  @Post()
  async criar(@Body() dados: SalvarRecursoDto, @UsuarioLogado() usuario: any) {
    await this.policy.validarGestor(usuario);
    this.policy.validar(dados);
    return this.repo.criar(usuario.barbeariaId, dados);
  }

  @Put(':id')
  async atualizar(@Param('id') id: string, @Body() dados: SalvarRecursoDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    await this.policy.validarGestor(usuario);
    this.policy.validar(dados);
    return this.repo.atualizar(Number(id), usuario.barbeariaId, dados);
  }

  @Delete(':id')
  async excluir(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    await this.policy.validarGestor(usuario);
    return this.repo.excluir(Number(id), usuario.barbeariaId);
  }

  @Get(':id/indisponibilidades')
  async listarIndisponibilidades(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    await this.policy.validarGestor(usuario);
    return this.repo.listarIndisponibilidades(Number(id), usuario.barbeariaId);
  }

  @Post(':id/indisponibilidades')
  async criarIndisponibilidade(@Param('id') id: string, @Body() dados: SalvarIndisponibilidadeRecursoDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    await this.policy.validarGestor(usuario);
    this.policy.validarIndisponibilidade(dados);
    return this.repo.criarIndisponibilidade(Number(id), usuario.barbeariaId, dados);
  }

  @Delete(':id/indisponibilidades/:indisponibilidadeId')
  async removerIndisponibilidade(@Param('id') id: string, @Param('indisponibilidadeId') indisponibilidadeId: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    validarNumeroInteiroPositivo(indisponibilidadeId, 'Indisponibilidade');
    await this.policy.validarGestor(usuario);
    return this.repo.removerIndisponibilidade(Number(id), Number(indisponibilidadeId), usuario.barbeariaId);
  }
}
