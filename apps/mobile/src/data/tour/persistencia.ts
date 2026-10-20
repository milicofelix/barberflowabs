import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PersistenciaTour } from '@uniflowabs/core'

export const persistenciaTourMobile: PersistenciaTour = {
    ler: chave => AsyncStorage.getItem(chave),
    salvar: (chave, valor) => AsyncStorage.setItem(chave, valor),
}
