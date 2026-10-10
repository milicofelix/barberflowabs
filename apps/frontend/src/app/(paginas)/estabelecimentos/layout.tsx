import Rodape from '@/components/shared/Rodape'
import type { PropsWithChildren } from 'react'

export default function EstabelecimentosLayout({ children }: PropsWithChildren) {
    return (
        <>
            {children}
            <Rodape />
        </>
    )
}
