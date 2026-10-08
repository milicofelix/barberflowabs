import { useContext } from 'react'
import ContextoBarbearia from '../contexts/ContextoBarbearia'

export default function useBarbearia() {
    return useContext(ContextoBarbearia)
}
