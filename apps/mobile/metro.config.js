const { getDefaultConfig } = require('expo/metro-config')
// SDK 52+ configura o monorepo e a resolução nativa automaticamente.
module.exports = getDefaultConfig(__dirname)
