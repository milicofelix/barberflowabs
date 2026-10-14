import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { MidiaService } from './midia.service';
import { AssociarMidiaDto, LIMITE_UPLOAD } from './midia.dto';

@Controller('midias')
export class MidiaController {
  constructor(private readonly midias: MidiaService) {}
  @Get('admin')
  global(@UsuarioLogado() usuario: any) { return this.midias.listarGlobal(usuario); }
  @Put('admin/:id')
  atualizarGlobal(@UsuarioLogado() usuario: any, @Param('id') id: string, @Body() dados: any) { return this.midias.atualizarGlobal(usuario, id, dados); }
  @Post('admin/upload')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: LIMITE_UPLOAD, files: 1, fields: 2 }, storage: undefined }))
  uploadGlobal(@UsuarioLogado() usuario: any, @Body('finalidade') finalidade: string, @UploadedFile() arquivo: any) { return this.midias.upload(usuario, finalidade, arquivo, true); }
  @Get('galeria')
  listar(@UsuarioLogado() usuario: any, @Query('finalidade') finalidade: string, @Query('segmentoSlug') segmento?: string) { return this.midias.listar(usuario, finalidade, segmento); }
  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo', { limits: { fileSize: LIMITE_UPLOAD, files: 1, fields: 2 }, storage: undefined }))
  upload(@UsuarioLogado() usuario: any, @Body('finalidade') finalidade: string, @UploadedFile() arquivo: any) { return this.midias.upload(usuario, finalidade, arquivo); }
  @Put('associacao')
  associar(@UsuarioLogado() usuario: any, @Body() dados: AssociarMidiaDto) { return this.midias.associar(usuario, dados); }
  @Post('limpar-orfas')
  limpar(@UsuarioLogado() usuario: any, @Body() dados: { executar?: boolean }) {
    if (dados?.executar !== undefined && typeof dados.executar !== 'boolean') throw new BadRequestException('Opção executar inválida');
    return this.midias.limparOrfas(usuario, dados?.executar === true);
  }
}

@Controller('midias/arquivos')
export class MidiaArquivoController {
  constructor(private readonly midias: MidiaService) {}
  @Get(':id/:versao')
  async obter(@Param('id') id: string, @Param('versao') versao: string, @Res() res: any) {
    const arquivo = await this.midias.arquivo(id, versao);
    res.setHeader('Content-Type', arquivo.mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(arquivo.buffer);
  }
}
