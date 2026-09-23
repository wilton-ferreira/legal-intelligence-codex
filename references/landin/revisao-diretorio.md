# Revisão concreta de um acervo jurídico

Base metodológica: [e-book](../../docs/ebook-escritorio-landin.pdf), p. 2-9,
17-19. O processamento de múltiplos casos e a entrega de versões revisadas são
extensões expressamente pedidas para o plugin.

## Entradas e separação

Use inventário recursivo de caminhos, tipos, tamanhos, datas e legibilidade.
Agrupe por número de processo documentado, pasta e contexto confirmado. Mesmo
cliente não significa mesmo processo. Arquivos de identidade incerta ficam em
grupo não classificado; use-os no caso apenas após evidência suficiente.

Antes da leitura, escolha uma pasta de saída distinta, por exemplo
`revisao-landin-[data]/`, e exclua essa pasta e saídas anteriores equivalentes
da enumeração recursiva. Se saída anterior for objeto expresso da revisão,
inclua-a como versão derivada identificada, nunca como prova primária. Não copie
automaticamente a base de entrada inteira para a saída.

Registre versões por conteúdo, nome e contexto. Datas do sistema e sufixos
`final`/`v2` são indícios, não prova de protocolo ou versão final. Diferencie
peça protocolada, minuta editável, modelo genérico, prova e pesquisa prévia.
Modelos e textos de pesquisa não comprovam fatos do caso. Links de pesquisas
anteriores precisam ser abertos e conferidos quando sustentarem conclusões atuais.

## Trabalho por caso

1. **Início:** inventário, documentos centrais, parte representada, pedido e
   estágio demonstrado. Indique ausências, páginas não lidas e limites de OCR.
2. **Provas:** cronologia e matriz de alegação, prova/localizador, contradição,
   fundamento, fonte e lacuna. Não derive fato de uma minuta repetida em versões.
3. **Rascunho:** revise a minuta identificada pelo usuário ou documentadamente
   principal. Corrija referências erradas verificáveis, contradições internas,
   narrativa sem suporte e pedidos incompatíveis com o objetivo demonstrado.
   Remova citação falsa confirmada; para referência apenas não localizada,
   deixe a questão explícita sem declarar falsidade. Se mudar a tese exigir
   uma escolha estratégica não determinada, preserve a linha existente e
   apresente alternativas concretas, sem inventar uma decisão do advogado.
4. **Conferência:** compare a versão revisada com original e provas; confira
   citações novas em fontes oficiais e relate alterações materiais. Confirme
   que as correções não criaram fatos, valores, cronologia ou citações novos
   sem suporte. Peças históricas e provas recebem relatório separado.

Não transforme esses resultados em fases com autorização intermediária.
O pedido de revisar é autorização para produzir os artefatos derivados locais.

## Pesquisa oficial

Formule consultas por questão e fatos abstratos, sem enviar peças inteiras ou
dados pessoais desnecessários. Use os recursos MCP efetivamente expostos na
sessão. DataJud pode contextualizar metadados; não substitui autos. Publicação
não demonstra automaticamente ciência nem prazo. Descoberta de jurisprudência
exige consulta ao documento oficial antes de incorporar a tese à versão revisada.
Registre também entendimentos contrários e distinções relevantes. Se MCP ou
portal estiver indisponível, indique a fonte e a consulta tentada e mantenha
a fundamentação como pendente, continuando correções documentais possíveis.

## Saídas úteis

Para cada caso, entregue inventário/cobertura, relatório de achados com
localizadores, matriz de fatos/provas, fontes consultadas e arquivos revisados
quando houver minutas pertinentes. Um relatório pode reunir inventário e matriz
em seções; evite criar arquivos sem função. Para múltiplos processos, acrescente
índice do diretório apontando cada caso, entregas e material não classificado.

Cada versão deve ter mapa `original | resultado | natureza | mudanças materiais`.
Preserve formato editável quando o recurso estiver disponível; se não estiver,
entregue Markdown/texto editável e registre a limitação, sem chamar o arquivo
de DOCX. Não altere originais nem apresente uma minuta revisada como protocolada.

## Prompt de entrada

```text
Use $landin-revisar-processos para revisar os processos em [DIRETÓRIO]. Meu
objetivo é [OBJETIVO] e represento [PARTE/PAPEL, SE CONHECIDO]. Considere as peças,
provas, versões e pesquisas anteriores. Separe os casos, confira os fundamentos
necessários em fontes oficiais usando o MCP disponível e produza relatórios
rastreáveis e versões revisadas das minutas. Preserve os originais e exclua a
pasta de saída das entradas. Informe documentos não lidos e referências pendentes.
```
