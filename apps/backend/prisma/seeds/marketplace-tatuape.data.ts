export interface EstabelecimentoMarketplaceSeed {
  nome: string;
  slug: string;
  tipoEstabelecimento: string;
  segmento: { slug: string; nome: string; descricao: string };
  endereco: string;
  latitude: number;
  longitude: number;
  telefone: string;
  destaque: boolean;
  profissional: string;
  servicos: Array<{ nome: string; descricao: string; preco: number; duracaoMinutos: number; imagemURL: string }>;
}

export const estabelecimentosMarketplaceTatuape: EstabelecimentoMarketplaceSeed[] = [
  estabelecimento('Barbearia Neon Tatuapé', 'barbearia-neon-tatuape', 'BARBEARIA', segmento('barbearia', 'Barbearia'), 'Rua Tuiuti, 1200', -23.53905, -46.5759, '1101', true, 'Rafael Monteiro', [
    servico('Corte masculino', 'Corte com máquina e tesoura.', 55, 30, 'corte-de-cabelo.jpg'),
    servico('Barba completa', 'Modelagem de barba com acabamento.', 45, 30, 'corte-de-barba.jpg'),
  ]),
  estabelecimento('Barber Club Itapura', 'barber-club-itapura', 'BARBEARIA', segmento('barbearia', 'Barbearia'), 'Rua Itapura, 980', -23.54418, -46.56621, '1102', false, 'Bruno Nogueira', [
    servico('Corte degradê', 'Degradê personalizado e finalização.', 65, 45, 'corte-de-cabelo.jpg'),
    servico('Combo corte e barba', 'Corte e barba no mesmo atendimento.', 95, 60, 'combo.jpg'),
  ]),
  estabelecimento('Studio Cabelo Tatuapé', 'studio-cabelo-tatuape', 'SALAO_BELEZA', segmento('salao-beleza', 'Salão de beleza'), 'Rua Serra de Japi, 860', -23.54802, -46.56683, '1201', true, 'Camila Duarte', [
    servico('Corte feminino', 'Corte personalizado com finalização.', 110, 60, 'corte-de-cabelo.jpg'),
    servico('Escova modeladora', 'Escova com proteção térmica.', 75, 45, 'combo.jpg'),
  ]),
  estabelecimento('Salão Violeta', 'salao-violeta-tatuape', 'SALAO_BELEZA', segmento('salao-beleza', 'Salão de beleza'), 'Rua Apucarana, 740', -23.54314, -46.55891, '1202', false, 'Juliana Freitas', [
    servico('Hidratação capilar', 'Tratamento nutritivo para os fios.', 90, 45, 'combo.jpg'),
    servico('Corte e escova', 'Corte completo com escova.', 145, 75, 'corte-de-cabelo.jpg'),
  ]),
  estabelecimento('Esmalteria Neon', 'esmalteria-neon-tatuape', 'ESMALTERIA', segmento('manicure-pedicure', 'Manicure e pedicure'), 'Rua Emília Marengo, 620', -23.55219, -46.55987, '1301', true, 'Larissa Campos', [
    servico('Manicure', 'Cuidado completo das unhas das mãos.', 45, 45, 'manicure-pedicure.jpg'),
    servico('Pedicure', 'Cuidado completo das unhas dos pés.', 55, 60, 'manicure-pedicure.jpg'),
  ]),
  estabelecimento('Nails Tatuapé', 'nails-tatuape', 'ESMALTERIA', segmento('manicure-pedicure', 'Manicure e pedicure'), 'Rua Azevedo Soares, 1080', -23.54246, -46.57031, '1302', false, 'Priscila Lima', [
    servico('Esmaltação em gel', 'Esmaltação duradoura em gel.', 85, 60, 'manicure-pedicure.jpg'),
    servico('Spa dos pés', 'Esfoliação, hidratação e pedicure.', 95, 75, 'manicure-pedicure.jpg'),
  ]),
  estabelecimento('Clínica Lumina Estética', 'clinica-lumina-estetica', 'CLINICA_ESTETICA', segmento('clinica-estetica', 'Clínica de estética'), 'Rua Coelho Lisboa, 520', -23.54067, -46.57098, '1401', true, 'Dra. Marina Lopes', [
    servico('Limpeza de pele', 'Higienização profunda e hidratação facial.', 160, 90, 'dia-de-noivo.jpg'),
    servico('Peeling facial', 'Renovação suave da pele com avaliação prévia.', 190, 60, 'dia-de-noivo.jpg'),
  ]),
  estabelecimento('Estética Azul', 'estetica-azul-tatuape', 'CLINICA_ESTETICA', segmento('clinica-estetica', 'Clínica de estética'), 'Rua Cantagalo, 1320', -23.54729, -46.57473, '1402', false, 'Bianca Moreira', [
    servico('Drenagem linfática', 'Massagem corporal para estimular a circulação.', 140, 60, 'dia-de-noivo.jpg'),
    servico('Tratamento facial', 'Protocolo facial personalizado.', 175, 75, 'dia-de-noivo.jpg'),
  ]),
  estabelecimento('Lotus Spa Tatuapé', 'lotus-spa-tatuape', 'SPA_BEM_ESTAR', segmento('spa-bem-estar', 'Spa e bem-estar'), 'Rua Antônio Camardo, 510', -23.53686, -46.56838, '1501', true, 'Renata Silveira', [
    servico('Massagem relaxante', 'Massagem corporal para relaxamento profundo.', 180, 60, 'dia-de-noivo.jpg'),
    servico('Ritual com pedras quentes', 'Terapia relaxante com pedras aquecidas.', 240, 90, 'dia-de-noivo.jpg'),
  ]),
  estabelecimento('Serenity Bem-Estar', 'serenity-bem-estar-tatuape', 'SPA_BEM_ESTAR', segmento('spa-bem-estar', 'Spa e bem-estar'), 'Rua Monte Serrat, 760', -23.54608, -46.58013, '1502', false, 'Aline Castro', [
    servico('Aromaterapia', 'Sessão de relaxamento com óleos essenciais.', 150, 60, 'dia-de-noivo.jpg'),
    servico('Day spa', 'Circuito de cuidados e relaxamento.', 390, 180, 'dia-de-noivo.jpg'),
  ]),
  estabelecimento('Ateliê Uni Beauty', 'atelie-uni-beauty', 'ESTUDIO_BELEZA', segmento('beleza', 'Beleza'), 'Rua Euclides Pacheco, 720', -23.53491, -46.57362, '1601', true, 'Isabela Martins', [
    servico('Maquiagem social', 'Maquiagem para festas e eventos.', 180, 75, 'combo.jpg'),
    servico('Design de sobrancelhas', 'Design personalizado com acabamento.', 65, 45, 'combo.jpg'),
  ]),
  estabelecimento('Espaço Bela Vilela', 'espaco-bela-vilela', 'ESTUDIO_BELEZA', segmento('beleza', 'Beleza'), 'Rua Vilela, 650', -23.53827, -46.56172, '1602', false, 'Nathalia Rocha', [
    servico('Maquiagem express', 'Produção leve para compromissos do dia.', 120, 45, 'combo.jpg'),
    servico('Produção completa', 'Maquiagem e penteado para eventos.', 320, 120, 'dia-de-noivo.jpg'),
  ]),
];

function segmento(slug: string, nome: string) {
  return { slug, nome, descricao: `Serviços de ${nome.toLowerCase()} disponíveis no marketplace UniFlow ABS.` };
}

function servico(nome: string, descricao: string, preco: number, duracaoMinutos: number, imagem: string) {
  return { nome, descricao, preco, duracaoMinutos, imagemURL: `/servicos/${imagem}` };
}

function estabelecimento(
  nome: string, slug: string, tipoEstabelecimento: string,
  segmentoPrincipal: EstabelecimentoMarketplaceSeed['segmento'], endereco: string,
  latitude: number, longitude: number, telefoneFinal: string, destaque: boolean,
  profissional: string, servicos: EstabelecimentoMarketplaceSeed['servicos'],
): EstabelecimentoMarketplaceSeed {
  return {
    nome, slug, tipoEstabelecimento, segmento: segmentoPrincipal, endereco, latitude, longitude,
    telefone: `(11) 9${telefoneFinal}-0000`, destaque, profissional, servicos,
  };
}
