// Mantém app.json como base; nenhuma chave real precisa ser versionada.
module.exports = ({ config }) => {
  const chave = process.env.GOOGLE_MAPS_API_KEY;
  if (!chave) return config;
  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: chave },
      },
    },
  };
};
