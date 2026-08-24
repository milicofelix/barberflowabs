import FormAuth from '@/components/auth/FormAuth'
import Processando from '@/components/shared/Processando'
import { Suspense } from 'react'

export default function Page() {
    return (
        <Suspense fallback={<Processando />}>
            <FormAuth />
        </Suspense>
    )
}
