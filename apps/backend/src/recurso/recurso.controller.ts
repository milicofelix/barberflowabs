import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { validarNumeroInteiroPositivo } from 'src/shared/validacao';
import { SalvarRecursoDto } from './recurso.dto';
import { RecursoPolicy } from './recurso.policy';
import { RecursoPrisma } from './recurso.prisma';

@Controller('recursos')
export class RecursoController {
  constructor(
    private readonly repo: RecursoPrisma,
    private readonly policy: RecursoPolicy,
  ) {}

  @Get()
  listar(@UsuarioLogado() usuario: any) {
    this.policy.validarGestor(usuario);
    return this.repo.listar(usuario.barbeariaId);
  }

  @Post()
  criar(@Body() dados: SalvarRecursoDto, @UsuarioLogado() usuario: any) {
    this.policy.validarGestor(usuario);
    this.policy.validar(dados);
    return this.repo.criar(usuario.barbeariaId, dados);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() dados: SalvarRecursoDto, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    this.policy.validarGestor(usuario);
    this.policy.validar(dados);
    return this.repo.atualizar(Number(id), usuario.barbeariaId, dados);
  }

  @Delete(':id')
  excluir(@Param('id') id: string, @UsuarioLogado() usuario: any) {
    validarNumeroInteiroPositivo(id, 'Recurso');
    this.policy.validarGestor(usuario);
    return this.repo.excluir(Number(id), usuario.barbeariaId);
  }
}
