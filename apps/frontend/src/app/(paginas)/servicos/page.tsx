import CatalogoPublico from '@/components/publico/CatalogoPublico'
import NavegacaoPublica from '@/components/shared/NavegacaoPublica'
import Rodape from '@/components/shared/Rodape'

export default function ServicosPage({ searchParams }: { searchParams: { segmento?: string } }) {
    return <><NavegacaoPublica voltarPara="/" voltarLabel="Voltar ao início" /><main className="container py-10"><CatalogoPublico tipo="servicos" completo segmentoInicial={typeof searchParams.segmento === 'string' ? searchParams.segmento : ''} /></main><Rodape /></>
}
