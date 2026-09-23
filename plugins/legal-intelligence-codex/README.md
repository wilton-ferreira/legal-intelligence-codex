# Legal Intelligence Codex

Plugin para trabalhar com **Direito brasileiro no Codex**, com habilidades em
português, métodos do Escritório Landin e um servidor MCP local para fontes
oficiais. Identificador: `legal-intelligence-codex` · versão inicial `0.1.0`.

## Instalar

Tenha Node.js 22+ e Codex com suporte a plugins. No PowerShell do Windows ou no
terminal do macOS/Linux:

```text
codex plugin marketplace add wilton-ferreira/legal-intelligence-codex
codex plugin add legal-intelligence-codex@legal-intelligence-brasil
```

Abra uma nova tarefa. O servidor já vem compilado, sem instalação de pacotes
npm pelo usuário final. Alternativa por ZIP, configuração opcional DataJud e
diagnóstico estão no [guia de instalação](docs/instalacao.md).

## Começar pelo trabalho que você precisa fazer

| Entrega | Entrada no Codex |
|---|---|
| Iniciar análise e organização de um processo | `$landin-iniciar-processo` |
| Revisar processos de uma pasta e produzir versões melhoradas | `$landin-revisar-processos` |
| Pesquisar legislação, jurisprudência e fundamentos | `$pesquisar-direito-brasileiro` |
| Conferir citações ou integridade de uma peça | `$verificar-citacoes` · `$auditar-peca` |
| Entender autos e confrontar documentos | `$triagem-de-autos` |
| Revisar contrato, risco e redação | `$revisar-contrato` · `$matriz-de-risco` · `$redigir-documento-juridico` |
| Preparar cópia com identificadores reduzidos | `$anonimizar` |
| Consultar publicações processuais | `$consultar-comunicacoes` |
| Escolher a habilidade adequada | `$legal-intelligence` |

Os rituais especializados Landin cobrem recurso inominado, impugnação de laudo,
BPC do idoso, preparação de audiência e contestação trabalhista. O
[mapa de rituais e páginas de origem](docs/landin-incorporacao.md) explica suas
entradas e entregas.

Exemplo: “Use `$landin-revisar-processos` para revisar os processos da pasta
indicada, confrontar as provas, conferir a jurisprudência e produzir versões
melhoradas.” A habilidade inventaria o material, separa os casos, preserva
originais e produz relatórios e documentos em uma pasta de saída. Lacunas
materiais são identificadas sem inventar fatos, provas ou citações.

No CLI, `/skills` e `$` permitem selecionar habilidades. Este plugin não
registra aliases como `/inicial processo`; os exemplos acima usam o mecanismo
real de skills. Instalação e disponibilidade das interfaces podem variar por
superfície do Codex — veja o guia.

## O que as ferramentas fazem

O MCP distingue metadados processuais (DataJud), publicações (DJEN), descoberta
de referências (LexML), proposições legislativas (Câmara/Senado) e catálogos de
datasets (STJ/TSE). Cada resposta bem-sucedida inclui origem, instante da
consulta, hash do corpo obtido e limites de cobertura.

STJ/TSE **não** têm busca no conteúdo de todos os acórdãos nesta versão: a
integração encontra conjuntos de dados. STF, SCON, BNP, TST, CJF, TCU, CARF e
Receita têm referências oficiais para conferência, sem promessa de API
automatizada. As ferramentas de verificação organizam evidências e pendências;
não certificam vigência, trânsito em julgado ou status atual de precedente.
PDFs obtidos pelo MCP não têm o texto extraído automaticamente.

A [matriz de fontes](docs/fontes-oficiais.md) distingue implementação,
testes locais, consultas reais, bloqueios de rede e credenciais. Sem MCP, as
skills continuam úteis com arquivos e ferramentas disponíveis na sessão.

## Desenvolvimento e distribuição

```text
npm ci --ignore-scripts
npm run build
npm run check
npm test
npm run package
```

`npm run smoke` faz três consultas externas pequenas e opcionais; não faz parte
dos testes offline. O build gera `mcp/server.bundle.mjs`. O empacotamento gera
o snapshot instalável em `plugins/legal-intelligence-codex/`, o catálogo em
`.agents/plugins/marketplace.json` e ZIP com SHA-256 em `dist/`. Edite as fontes
da raiz; o snapshot é regenerado. Os scripts de build/teste/pacote usam Node e
funcionam sem Bash ou Python.

Há testes automatizados de contratos, erros, acesso HTTP, limites, sigilo e
inicialização MCP, além de CI para Windows, macOS e Linux. O resultado efetivo
da validação fica em [validação](docs/validacao.md). Testes técnicos não
certificam resultados jurídicos em casos reais.

## Origem e limites

A base `legal-intelligence-strategy`, a [pesquisa de fontes](docs/deep-research-report.md)
e o [e-book Landin](docs/ebook-escritorio-landin.pdf) orientam as habilidades.
As [adaptações e suas origens](docs/origem-das-habilidades.md) distinguem métodos
de trabalho de afirmações jurídicas a conferir na fonte oficial.

O plugin não exige CodeSDD, hooks ou processos auxiliares de governança. Não
protocola peças, envia comunicações, assina documentos ou cria serviços cloud.
Não altera as condições de privacidade do Codex. Chaves opcionais permanecem
fora do código. Os avisos de licenças das dependências acompanham o bundle em
`mcp/THIRD_PARTY_NOTICES.md`.
