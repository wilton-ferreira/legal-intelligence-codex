# Incorporação do material do Escritório Landin

O conteúdo do [e-book original](ebook-escritorio-landin.pdf) foi incorporado às
habilidades e aos prompts do plugin. O PDF foi preservado, não apenas listado
como material auxiliar.

Fonte: *Escritório Landin - Codex App no contexto jurídico: guia prático para
analisar documentos, investigar processos e redigir com rastreabilidade*,
Marcio de Oliveira Landin, edição 1.0, uso declarado para treinamento interno
e capacitação de advogados. O autor é creditado como autor da fonte, não como
responsável ou aprovador presumido de casos executados pelo plugin.

- Extensão: 19 páginas, com numeração impressa correspondente à posição no PDF.
- SHA-256 do original: `50f566123d7432ac5f9fbd8d006023d8f4d3e6cf810481290a0c948b028e46ca`.
- Leitura: texto integral extraído com Poppler e conferido por contagem por página
  com pypdf; todas as páginas renderizadas e inspecionadas visualmente.
- A p. 5 continua dois campos do cadastro da p. 4; a p. 11 contém apenas
  cabeçalho e rodapé. Não foram tratadas como páginas de conteúdo faltante.
- Não foi necessário OCR: o texto e os blocos de prompts eram extraíveis; a
  inspeção visual não revelou figuras, tabelas ou trechos relevantes perdidos.

## Entradas acionáveis no Codex

Use o nome da skill com `$` no pedido. Expressões como “iniciar processo” são
intenções atendidas pelas habilidades; este plugin não declara alias de barra
como `/inicial processo`.

| Ritual ou objetivo | Entrada e exemplo | Resultado concreto |
| --- | --- | --- |
| Início | `$landin-iniciar-processo` para iniciar o caso em `[DIRETÓRIO]` | Inventário, cobertura, cronologia, matriz de fatos/provas e análise inicial |
| Provas | `$landin-iniciar-processo` para conferir os fatos e provas de `[CASO]` | Matriz com documento, localizador, contradições e lacunas |
| Revisão do diretório | `$landin-revisar-processos` para revisar os processos em `[DIRETÓRIO]` | Relatório por caso, índice do acervo e versões revisadas das minutas |
| Rascunho de recurso | `$landin-recurso-inominado` para analisar `[SENTENÇA]` e preparar a minuta | Confronto dos fundamentos, força argumentativa e minuta rastreável |
| Rascunho de impugnação | `$landin-impugnar-laudo` para confrontar `[LAUDO]` e `[PROVAS]` | Inconsistências, quesitos e impugnação quando pedida |
| Rascunho de inicial BPC | `$landin-bpc-idoso` para analisar `[DOCUMENTOS]` e preparar inicial | Requisitos, memória de renda, provas e minuta |
| Audiência | `$landin-preparar-audiencia` para preparar `[AUDIÊNCIA]` com `[DOCUMENTOS]` | Objetivos probatórios, perguntas e cenários rotulados |
| Rascunho trabalhista | `$landin-contestacao-trabalhista` para defender `[PARTE]` | Confronto dos pedidos/provas e minuta de contestação |
| Conferência | `$landin-revisar-processos` para conferir as minutas em `[DIRETÓRIO]` | Achados localizados, fontes conferidas e versões corrigidas |

As etapas acima são resultados de trabalho, não ritos obrigatórios de aprovação.
O usuário pode pedir análise e minuta na mesma solicitação. A revisão de acervo
separa múltiplos processos, preserva originais e exclui sua pasta de saída da
leitura de entradas. Fontes históricas, decisões e provas recebem análise
separada, não reescrita que pareça substituir o documento original.

## Conteúdo incorporado e localizadores

| Páginas | Conteúdo da fonte | Incorporação |
| --- | --- | --- |
| 1 | Identificação, edição, finalidade e limites profissionais | Crédito e distinção entre método e autoridade jurídica |
| 2-3 | Conhecer o processo antes de redigir; sequência; marcadores | [Método](../references/landin/metodo.md) e [iniciar processo](../skills/landin-iniciar-processo/SKILL.md) |
| 4-5 | Pastas, nomes e dados de contexto do caso | [Organização](../references/landin/organizacao.md), como convenção opcional |
| 6 | Fatos, inferências, provas, fontes, Constituição e privacidade | Método compartilhado, minimização de dados e conferência pertinente à tese |
| 7 | Prompt universal de preparação | Prompt concreto de preparação no método compartilhado |
| 8-9 | Controle de fatos/provas/jurisprudência e redação rastreável | Matriz, marcadores e ligação da narrativa aos localizadores |
| 10 | Fundamentos da sentença, erros, confronto e força recursal | [Recurso inominado](../skills/landin-recurso-inominado/SKILL.md) e [prompt](../references/landin/recurso-inominado.md) |
| 11 | Cabeçalho/rodapé sem conteúdo substantivo | Conferido; nenhuma habilidade extraída |
| 12-13 | Dois modelos de análise de laudo; contradições e quesitos | [Impugnar laudo](../skills/landin-impugnar-laudo/SKILL.md) e [dois prompts](../references/landin/impugnacao-laudo.md) |
| 14 | BPC para pessoa idosa: grupo familiar, renda, provas e inicial | [BPC idoso](../skills/landin-bpc-idoso/SKILL.md) e [prompt](../references/landin/bpc-idoso.md) |
| 15 | Objetivo probatório, depoentes, riscos, simulação e roteiro | [Preparar audiência](../skills/landin-preparar-audiencia/SKILL.md) e [prompt](../references/landin/audiencia.md) |
| 16 | Defesa trabalhista, provas perigosas e antecipação adversarial | [Contestação trabalhista](../skills/landin-contestacao-trabalhista/SKILL.md) e [prompt](../references/landin/contestacao-trabalhista.md) |
| 17 | Registro de fonte e distinção entre busca e documento | Método, pesquisa MCP e conferência do conteúdo oficial |
| 18 | Inventário e homogeneização do diretório | Organização com preservação, mapa de caminhos e verificação de cópias |
| 19 | Conferência final, pendências e limites da responsabilidade | Fechamento rastreável e revisão profissional sem bloqueio de governança |

A [revisão de diretórios](../skills/landin-revisar-processos/SKILL.md), detalhada
no [roteiro](../references/landin/revisao-diretorio.md), combina esses métodos
com o requisito adicional do usuário de revisar processos e produzir versões
concretas. Não é apresentada como um oitavo prompt transcrito do PDF.

## Adaptações deliberadas

- **Execução direta:** confirmações antes de cada etapa e antes de toda pesquisa
  pública foram substituídas pelo escopo já autorizado no pedido. O usuário
  continua podendo limitar o trabalho a fontes locais. Não há CodeSDD, cadastro
  de features, alçadas, SLA ou substituto de governança.
- **Revisão profissional:** o marcador original `[APROVACAO HUMANA PENDENTE]`
  foi traduzido em identificação da minuta para revisão, sem presumir aprovação
  e sem bloquear análise ou redação. Protocolo, assinatura e envio não decorrem
  da autorização para redigir.
- **Fatos e inferências:** a proibição genérica de inferir da p. 7 foi conciliada
  com a separação entre fatos e hipóteses das p. 6, 8, 15 e 16. Interpretações
  úteis podem ser apresentadas, com evidência e rótulo, nunca como fatos provados.
- **Arquivos:** nomes com espaço ou acento não interrompem o trabalho. A estrutura
  Landin é opcional; mudanças preservam arquivos e não misturam casos. Pedidos
  de organização autorizam operações reversíveis compreendidas no escopo, sem
  repetição de aprovação de fase.
- **Laudos:** “atue como PERITO” virou assistência à análise documental, sem
  fingir credencial nem emitir perícia/diagnóstico. Três falhas e cinco quesitos
  são limites úteis do modelo focal, não quotas que justifiquem inventar itens.
- **Recurso:** “chance de reforma” foi mantida como força argumentativa explicada,
  sem estimativa de probabilidade de êxito.
- **Trabalhista:** a expressão “estratégia recursal” no item final da p. 16 foi
  corrigida para estratégia defensiva, coerente com a contestação solicitada.
  O exame de “provas perigosas” identifica para qual parte a prova traz risco.
- **Constituição:** a conferência é dos dispositivos pertinentes à tese, quando
  necessários, sem certificação abstrata de constitucionalidade da entrega.
- **Formatos:** DOCX permanece opção quando solicitado e suportado na sessão;
  não se promete gerar DOCX por simples existência do prompt. Se indisponível,
  a entrega é identificada como texto/Markdown editável.
- **Dados pessoais:** os prompts usam placeholders para partes, documentos,
  números, saúde e endereços; não copiam pessoas de exemplos para modelos.

## Base de estratégia, portabilidade e limites

A base `legal-intelligence-strategy`, indicada pelo usuário, também foi consultada
nas referências metodológicas de prompting jurídico, resumo/triagem de autos e
redação assistida em `mentoria-continuada/01-ia-dados/skills/`. Foram aproveitados
contexto/tarefa/formato/restrições, processamento por blocos com localizadores e
redação fiel às provas. Restrições de governança ou aprovação não foram importadas.
Os conteúdos necessários estão no plugin: não há dependência de caminho absoluto
para o repositório de estratégia ou para o PDF fora do pacote.

As habilidades e referências usam links relativos e placeholders de diretório.
Não exigem bash, Python ou comandos específicos de macOS para executar os
rituais; o agente usa as ferramentas disponíveis no ambiente para ler e produzir
arquivos. Python/Poppler foram ferramentas de autoria e validação desta
incorporação, não dependências de execução das habilidades. Compatibilidade de
empacotamento/MCP é tratada na documentação geral do plugin. Não foram executados
testes nativos Windows ou Linux nesta frente.

Não foram certificados direito vigente, cabimento, prazos, critérios atuais
de BPC, jurisprudência ou normas médicas neste trabalho de incorporação. Esses
conteúdos devem ser verificados em fontes oficiais ao aplicar a habilidade ao
caso. Uma fonte fornecida é referência documental; busca MCP ou semelhança
textual não equivale a inteiro teor, vigência ou precedente atual confirmado.

## Verificação da incorporação

As sete habilidades passaram pelo `quick_validate.py` da skill-creator, e seus
metadados `agents/openai.yaml` foram gerados com título, descrição curta e exemplo
de invocação `$nome-da-skill`. A validação estrutural não equivale a validação
jurídica nem a teste de resultado em processo real. O PDF permaneceu com o hash
registrado acima. A revisão de cobertura mapeou as 19 páginas e os sete prompts
originais (incluindo os dois modelos de laudo) para os arquivos indicados.

Não há página pendente de leitura nem ambiguidade que impeça a incorporação.
As expressões contraditórias do original e suas resoluções estão registradas
nas adaptações. Dados concretos, teses e decisões profissionais de futuros casos
continuam dependentes dos documentos e do pedido de cada usuário.
