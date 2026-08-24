import CasoDeUso from '../../shared/CasoDeUso'
import Usuario from '../model/Usuario'
import ProvedorCriptografia from '../provider/ProvedorCriptografia'
import RepositorioUsuario from '../provider/RepositorioUsuario'

// DDD: Application Service = Caso de Uso = Fluxo da Aplicação
export default class RegistrarUsuario implements CasoDeUso<Usuario, void> {
    constructor(
        private readonly repo: RepositorioUsuario,
        private readonly cripto: ProvedorCriptografia
    ) {}

    async executar(usuario: Usuario): Promise<void> {
        const usuarioExistente = await this.repo.buscarPorEmail(usuario.email)

        if (usuarioExistente) {
            throw new Error('Usuário já existe')
        }

        const senhaCriptografada = await this.cripto.criptografar(usuario.senha)
        const novoUsuario = {
            ...usuario,
            senha: senhaCriptografada,
            barbeiro: false,
        }

        await this.repo.salvar(novoUsuario)
    }
}
