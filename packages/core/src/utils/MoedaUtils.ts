export default class MoedaUtils {
    static formatar(valor: number, locale: string = 'pt-BR', moeda: string = 'BRL'): string {
        return Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moeda,
            minimumFractionDigits: 2,
        }).format(valor)
    }
}
