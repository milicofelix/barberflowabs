'use client'
import { useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function useLocalStorage() {
    const get = useCallback(async (chave: string) => {
        const valorLocal = await AsyncStorage.getItem(chave)
        if (!valorLocal) return null

        try {
            return JSON.parse(valorLocal)
        } catch {
            await AsyncStorage.removeItem(chave)
            return null
        }
    }, [])

    const set = useCallback(async (chave: string, valor: any) => {
        await AsyncStorage.setItem(chave, JSON.stringify(valor))
    }, [])

    const remove = useCallback(async (chave: string) => {
        await AsyncStorage.removeItem(chave)
    }, [])

    return { get, set, remove }
}
