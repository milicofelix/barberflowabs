export const CONTROLE_ATENDIMENTO_INCLUDE = {
  controleManualPor: { select: { id: true, nome: true } },
  estabelecimento: { select: {
    fluxoAtendimentoAutomaticoAtivo: true,
    inicioAtendimentoAutomaticoAtivo: true,
    finalizacaoAtendimentoAutomaticaAtiva: true,
    avisoAtendimentoAntecedenciaMinutos: true,
    fusoHorario: true,
  } },
} as const;
