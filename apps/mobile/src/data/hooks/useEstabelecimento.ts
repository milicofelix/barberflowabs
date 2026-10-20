import { useContext } from 'react'
import ContextoEstabelecimento from '../contexts/ContextoEstabelecimento'

export default function useEstabelecimento() {
    return useContext(ContextoEstabelecimento)
}
