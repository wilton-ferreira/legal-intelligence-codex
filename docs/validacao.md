# Validação e alcance dos testes

## Verificação local — 23/09/2026

- Build TypeScript → bundle MCP com dependências incluídas.
- Checagem de tipos e estrutura do plugin, manifesto, MCP, metadados e links.
- Validador de plugin Codex e validador de skills executados na autoria.
- 48 testes automatizados de adapters, contratos, falhas, HTTP e MCP.
- Inicialização do bundle copiado para diretório temporário com espaços e
  Unicode, sem `node_modules`: handshake, listagem e chamada MCP bem-sucedidos.
- ZIP final: checksum conferido, extração em caminho com espaços e Unicode,
  manifesto e 17 habilidades presentes, inicialização MCP a partir do pacote
  extraído e chamada de ferramenta sem instalação de dependências nesse pacote.
- Testes de DNS privado/IPv6, host permitido, credenciais em redirecionamentos,
  limites de bytes, timeout, sigilo, paginação, XML e bloqueios interativos.
- Smoke real pequeno: DJEN, Câmara e Senado responderam conforme os contratos.
  O DJEN foi consultado com número sintético (zero resultados); Câmara e Senado
  retornaram uma proposição cada. Nenhuma conclusão jurídica foi inferida.
- PDF Landin: 19 páginas lidas e inspecionadas; hash preservado; sete habilidades
  derivadas validadas estruturalmente, com cobertura por página documentada.

Ambiente de autoria: macOS, Node.js 26.7.0. Isso não é apresentado como execução
nativa local em Windows/Linux. O runtime mínimo declarado para o pacote é
Node.js 22, verificado pela matriz automatizada abaixo.

## Exercício comportamental de revisão de pasta

Uma execução independente de `landin-revisar-processos` utilizou seis arquivos
sintéticos, dois casos, versões divergentes de uma peça e pesquisa sem caso
identificado. Produziu oito artefatos, incluindo versões revisadas e relatórios.
Os seis originais conservaram os hashes. A revisão distinguiu valores de
R$ 1.200 e R$ 2.100 sem presumir que a última versão fosse correta, sinalizou
R$ 900 sem suporte e manteve um tema jurisprudencial como não verificado.
Descrição de assinatura não foi tratada como prova da assinatura. Esse
exercício qualitativo não é certificação de resultados jurídicos nem substitui
os testes automatizados.

## Matriz nativa no GitHub Actions

O workflow [Plugin e MCP](https://github.com/wilton-ferreira/legal-intelligence-codex/actions/workflows/validate.yml)
executa instalação de dependências, build, checagem, testes e empacotamento com
Node.js 22 em `ubuntu-latest`, `macos-latest` e `windows-latest`.
Consulte a execução vinculada ao commit/tag instalado para seu resultado real.
A release por tag só publica os arquivos depois do sucesso das três plataformas.
Os testes de CI usam fixtures e não dependem de acesso aos tribunais.

## Limites

DataJud não foi consultado ao vivo por ausência de chave; seus contratos foram
testados com fixtures. LexML apresentou challenge, STJ timeout e TSE bloqueio
no teste externo. Isso não impede instalar ou iniciar o plugin, mas limita a
consulta dessas fontes naquele ambiente. Os demais portais listados como
manuais não são apresentados como APIs implementadas.

Os testes não avaliam exaustivamente decisões jurídicas, anonimização de todos
os formatos, detecção integral de sigilo ou competência profissional. Não há
corpus de jurisprudência indexado, OCR/PDF embutido no MCP, verificação automática
de vigência/precedente, protocolo judicial ou envio externo.

O bundle é testado por um cliente MCP padrão e seu empacotamento é validado.
A instalação na conta pessoal do usuário não foi realizada automaticamente.
