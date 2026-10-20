export interface CoordenadasGeograficas {
  latitude: number;
  longitude: number;
}

const PADROES_COORDENADAS = [
  /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /[?&](?:ll|q)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
];

export function extrairCoordenadasGoogleMaps(url?: string | null): CoordenadasGeograficas | null {
  if (!url?.trim()) return null;

  let valor = url.trim();
  try { valor = decodeURIComponent(valor); } catch { /* Mantém a URL original quando houver escape inválido. */ }
  for (const padrao of PADROES_COORDENADAS) {
    const resultado = valor.match(padrao);
    if (!resultado) continue;

    const latitude = Number(resultado[1]);
    const longitude = Number(resultado[2]);
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      return { latitude, longitude };
    }
  }
  return null;
}
