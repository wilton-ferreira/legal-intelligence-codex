# Pesquisa aprofundada: fontes oficiais brasileiras para jurisprudência, acórdãos, legislação e evidência jurídica integráveis ao Codex

## Diagnóstico executivo

Agente Evan — a conclusão mais importante é esta: **não existe hoje uma API pública única, oficial e suficiente para construir um assistente jurídico brasileiro confiável**. O caminho tecnicamente defensável é compor várias fontes oficiais, cada uma cumprindo uma função diferente: metadados processuais, inteiro teor, precedentes qualificados, publicações oficiais e vigência legislativa. O CNJ fornece uma excelente camada nacional de metadados com o DataJud, mas ela não substitui as bases de jurisprudência dos tribunais nem é, por si só, uma fonte adequada de inteiro teor. citeturn4search6turn4search2

Também não seria sério afirmar que existe uma lista pública fechada contendo **“todas as APIs `.jus.br` e `.gov.br`”**. Muitos tribunais expõem apenas interfaces web, alguns usam backends não documentados, alguns possuem portais CKAN/dados abertos, e outros dependem de DataJud. O catálogo abaixo restringe-se a fontes que consegui corroborar como oficiais e úteis para o objetivo descrito; não incluo APIs privadas, agregadores comerciais ou endpoints reversamente descobertos sem contrato público.

A arquitetura que recomendo é, portanto, uma **camada MCP própria em Node.js**, usada como núcleo da integração, em vez de acoplar o agente diretamente a páginas específicas. Atualmente, o Codex consegue consumir servidores MCP, e a configuração de MCP é compartilhada entre CLI e extensão IDE; plugins também podem incorporar MCP e skills, mas a extensão IDE não oferece o mesmo suporte a plugins que outras superfícies. Isso torna MCP a unidade de integração mais portátil para esse projeto. citeturn31search0turn31search2turn31search12turn31search22

Minha classificação prática das fontes é:

| Classe | Fonte | Função real | Prioridade |
|---|---|---|---|
| A | CNJ DataJud | capa, assuntos, classes e movimentações processuais nacionais | **essencial** |
| A | STJ Dados Abertos | acórdãos, decisões e precedentes do STJ para ingestão/offline | **essencial** |
| A | CNJ DJEN | publicações e comunicações processuais oficiais | **essencial** |
| A | LexML/Senado | legislação + descoberta cruzada de jurisprudência em XML/SRU | **essencial** |
| A | Senado Dados Abertos | estado legislativo e atividade normativa | **essencial** |
| A | Câmara Dados Abertos | proposições, tramitações e votações | **essencial** |
| A | TCU Dados Abertos/Webservices | acórdãos, súmulas, consultas e jurisprudência administrativa | **muito alta** |
| A | TSE Dados Abertos | processos, assuntos, decisões e recursos eleitorais | **alta para eleitoral** |
| B | CNJ Banco Nacional de Precedentes | precedentes qualificados | **essencial como verificador** |
| B | STF Jurisprudência/Repercussão Geral | jurisprudência constitucional e estado de temas | **essencial** |
| B | STJ SCON | busca jurídica oficial online | **essencial como verificador** |
| B | TST Jurisprudência | busca trabalhista oficial | **alta** |
| B | CJF Jurisprudência Unificada | busca federada STF/STJ/TNU/TRFs | **alta** |
| B | TSE Jurisprudência | busca eleitoral oficial | **alta** |
| B | CARF | jurisprudência administrativa tributária | **alta em tributário** |
| B | Planalto/Câmara/Receita | confirmação de legislação e atos normativos | **essencial para vigência** |

O ponto cego mais perigoso seria tentar transformar o DataJud em “API de jurisprudência”. **Não faça isso.** O DataJud entrega metadados de processos públicos e movimentos; seu glossário inclui número do processo, tribunal, classe, assuntos, órgão julgador e movimentos, além de `dataHoraUltimaAtualizacao`, mas isso não equivale ao inteiro teor ou à situação jurídica atual de uma tese. citeturn4search2turn27search5

Há ainda uma restrição séria para produto comercial: os Termos de Uso do DataJud atribuem responsabilidade pelo uso ao usuário, não garantem exatidão/integridade/atualidade e estabelecem restrições a usos comerciais e à exploração/distribuição das informações derivadas. Antes de incorporar o DataJud como dependência de um SaaS jurídico comercial, isso precisa passar por análise jurídica específica; tecnicamente ele é excelente, contratualmente ele pode ser o maior problema da arquitetura. citeturn7view0


## APIs oficiais e bases estruturadas que realmente valem integrar

### CNJ DataJud — API nacional de metadados processuais

É a fonte nacional mais importante para **descoberta de processos, identificação, assuntos e movimentações**. A API Pública do DataJud expõe dados provenientes da Base Nacional de Dados do Poder Judiciário, respeitando sigilo e restrições relativas às partes. citeturn4search6turn27search3

**Formato:** JSON sobre HTTP, com consulta estilo Elasticsearch `_search`.  
**Autenticação:** `Authorization: APIKey ...`. A chave pública é divulgada pelo próprio CNJ e pode ser alterada; por isso, eu não a colocaria hardcoded em repositório, imagem Docker ou skill. citeturn3search1turn4search14  
**Uso correto:** metadados processuais e movimentações.  
**Uso incorreto:** considerar a resposta como inteiro teor ou como prova de que determinado entendimento continua vigente.

Base e documentação:

```text
https://api-publica.datajud.cnj.jus.br/
https://datajud-wiki.cnj.jus.br/api-publica/
https://datajud-wiki.cnj.jus.br/api-publica/endpoints/
```

Exemplo de adaptação para terminal:

```bash
curl -sS \
  -X POST \
  -H "Authorization: APIKey ${DATAJUD_API_KEY}" \
  -H "Content-Type: application/json" \
  "https://api-publica.datajud.cnj.jus.br/api_publica_stj/_search" \
  -d '{
    "query": {
      "match": {
        "numeroProcesso": "NUMERO_CNJ_SEM_FORMATACAO"
      }
    }
  }'
```

A documentação oficial atualmente lista endpoints por tribunal. A cobertura publicada inclui: citeturn3search0turn27search3

```text
Superiores
api_publica_stj
api_publica_tst
api_publica_tse
api_publica_stm

Federal
api_publica_trf1
api_publica_trf2
api_publica_trf3
api_publica_trf4
api_publica_trf5
api_publica_trf6

Estadual
api_publica_tjac
api_publica_tjal
api_publica_tjam
api_publica_tjap
api_publica_tjba
api_publica_tjce
api_publica_tjdft
api_publica_tjes
api_publica_tjgo
api_publica_tjma
api_publica_tjmg
api_publica_tjms
api_publica_tjmt
api_publica_tjpa
api_publica_tjpb
api_publica_tjpe
api_publica_tjpi
api_publica_tjpr
api_publica_tjrj
api_publica_tjrn
api_publica_tjro
api_publica_tjrr
api_publica_tjrs
api_publica_tjsc
api_publica_tjse
api_publica_tjsp
api_publica_tjto

Trabalho
api_publica_trt1 ... api_publica_trt24

Eleitoral
api_publica_tre_ac ... api_publica_tre_to
api_publica_tse

Militar
api_publica_tjmmg
api_publica_tjmrs
api_publica_tjmsp
api_publica_stm
```

Há uma lacuna relevante: **a lista oficial de endpoints não apresenta atualmente um `api_publica_stf`**. Logo, eu não projetaria a consulta ao STF supondo cobertura pelo DataJud; trataria STF como adapter independente. citeturn27search3turn20search0

Os campos documentados pelo DataJud permitem montar uma base factual extremamente útil:

```text
id
tribunal
numeroProcesso
dataAjuizamento
grau
nivelSigilo
formato
sistema
classe
assuntos[]
orgaoJulgador
movimentos[].codigo
movimentos[].nome
movimentos[].dataHora
movimentos[].complementos
dataHoraUltimaAtualizacao
@timestamp
```

Esses campos são oficialmente descritos no glossário do DataJud. citeturn4search2

### CNJ DJEN — publicações judiciais programaticamente consultáveis

O **Diário de Justiça Eletrônico Nacional / plataforma de Comunicações Processuais** possui Swagger oficial. O próprio Swagger informa que existe API pública e que endpoints sem indicação de autenticação podem ser utilizados sem login; as operações autenticadas são direcionadas aos tribunais. citeturn25search1turn27search0

Contrato/documentação:

```text
https://comunica.pje.jus.br/api
https://comunica.pje.jus.br/
```

Existe também a infraestrutura de produção usada para consulta programática das comunicações:

```text
https://comunicaapi.pje.jus.br/api/v1
```

Uma implementação deve, porém, **gerar/validar seu cliente a partir do Swagger oficial atual e não congelar a estrutura da API em conhecimento do modelo**. O portal público evidencia consultas por tribunal, número do processo e comunicações, com datas de disponibilização e inteiro teor quando disponível. citeturn25search3turn25search5turn25search19

Esta API não é substituta de jurisprudência. Ela resolve outro problema: **o que foi oficialmente publicado/comunicado**. Há registros públicos atuais contendo data de julgamento, ementa e inteiro teor em determinadas comunicações, mas isso ocorre porque o conteúdo foi publicado no diário; não transforma o DJEN num indexador jurídico por teses. citeturn25search11turn25search15

Para um sistema jurídico sério, eu separaria explicitamente:

```text
DataJud -> estado/movimentação do processo
DJEN    -> publicação/comunicação
Tribunal -> jurisprudência/inteiro teor
BNP/STF/STJ -> status do precedente
```

Misturar essas quatro coisas em um único `search()` produzirá respostas juridicamente ambíguas.

### STJ Dados Abertos — uma das melhores bases oficiais para RAG/offline

Para o seu caso, esta é provavelmente a fonte mais valiosa depois do DataJud. O STJ mantém um **Portal de Dados Abertos** com recursos adequados à ingestão automática, incluindo decisões e acórdãos. A página institucional do STJ também descreve a disponibilização automatizada e informa que decisões terminativas e acórdãos publicados no Diário da Justiça fazem parte dos conjuntos oferecidos. citeturn12search0turn12search1turn12search3

Portal:

```text
https://dadosabertos.web.stj.jus.br/
```

Entre os conjuntos relevantes encontrados estão: citeturn12search3

| Dataset STJ | Formatos encontrados | Valor para o plugin |
|---|---:|---|
| Íntegras de decisões terminativas e acórdãos do Diário da Justiça | CSV / JSON / ZIP | **RAG/índice local de inteiro teor** |
| Espelhos de acórdãos | JSON / CSV / ZIP | metadados, ementas, indexação |
| Precedentes qualificados | CSV | checagem de tese/precedente |
| Acervo em tramitação | CSV / GZ | contexto processual |
| Atas de distribuição | CSV / JSON | contexto processual |

O conjunto de espelhos da Corte Especial, por exemplo, é disponibilizado com licença Creative Commons Attribution; a documentação do dataset explica que há arquivo histórico e arquivos posteriores de atualização, podendo haver duplicidade e permitindo deduplicação por identificador. Essa característica é excelente para implementar uma sincronização incremental offline. citeturn12search8

Minha estratégia seria:

```text
S3 raw/
   stj/YYYY/MM/<arquivo-original>

S3 canonical/
   stj/acordao/<id>.json

OpenSearch/
   índice semântico + textual

DynamoDB/PostgreSQL/
   watermark de ingestão
   hash SHA-256
   resource URL
   retrievedAt
   sourceModifiedAt
```

O **SCON** permanece indispensável como mecanismo oficial online de confirmação. O STJ informa que sua pesquisa aceita termos, número de processo/registro, pesquisa avançada e operadores de busca. citeturn28search23

```text
https://scon.stj.jus.br/SCON/
```

A abordagem correta é: **offline para recall e velocidade; fonte STJ online para confirmação final**.

### LexML — API SRU/XML para legislação e descoberta jurídica federada

O LexML merece lugar central. O serviço oficial, mantido no ecossistema do Senado, reúne documentos de legislação, proposições, jurisprudência e doutrina; a página de Dados Abertos do Senado documenta uma API baseada no protocolo **SRU**, com pesquisas via URL e retorno XML. citeturn9search5turn10view0

Endpoint:

```text
https://www.lexml.gov.br/busca/SRU
```

Um exemplo seguindo o padrão apresentado pelo próprio serviço:

```bash
curl -sS -G \
  "https://www.lexml.gov.br/busca/SRU" \
  --data-urlencode 'operation=searchRetrieve' \
  --data-urlencode 'query=urn += "senado.federal pls 2008"'
```

O resultado XML pode ser consumido diretamente em terminal, Node.js ou pipeline ETL; não há necessidade de browser. citeturn9search5turn10view0

Há outro recurso valioso: o projeto LexML documentou metadados `Schema.org/Legislation` em JSON-LD nas páginas de normas, inclusive para normas federais, o que melhora muito a extração estruturada e a ligação entre versões/identificadores normativos. citeturn9search2

Para o plugin, LexML deve ser tratado como **resolver/descobridor**, não como árbitro absoluto do estado jurisprudencial.

### Senado Federal — API legislativa pública, sem autenticação

O Senado possui API oficial documentada em Swagger. A própria documentação afirma que a **API de Dados Abertos Legislativos do Senado Federal e do Congresso Nacional é pública e não requer autenticação**. citeturn24search2

Swagger:

```text
https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
```

Catálogo geral:

```text
https://www12.senado.leg.br/dados-abertos
```

O catálogo de Dados Abertos do Senado é também oferecido em formato tabular para descoberta automatizada dos conjuntos disponíveis. citeturn22search16

Esta API deve servir principalmente para:

```text
proposição
autoria
tramitação
comissões
votações
sessões
situação legislativa
documentos do processo legislativo
```

Não é fonte de jurisprudência, mas é fundamental para evitar um erro clássico de agente jurídico: citar como “lei vigente” algo que ainda é projeto, texto aprovado parcialmente ou proposição em tramitação.

### Câmara dos Deputados — API REST + downloads estruturados

A Câmara mantém Swagger oficial e recursos de Dados Abertos voltados a projetos de lei, proposições, votações e atividade legislativa. O próprio portal informa atualização diária dos conjuntos de proposições e disponibilização de dados históricos. citeturn23search2turn22search24

```text
https://dadosabertos.camara.leg.br/
https://dadosabertos.camara.leg.br/swagger/api.html
```

Há recursos em múltiplos formatos para download, incluindo, conforme o conjunto, **JSON, XML, CSV, XLSX e ODS**. O histórico de proposições inclui categorias que podem se converter ou se converteram em normas e, de 2001 em diante, dados das proposições tramitadas na Câmara. citeturn23search2

A Câmara também possui busca oficial própria de legislação federal e legislação interna, consumível via HTTP:

```text
https://www.camara.leg.br/legislacao
```

A página permite pesquisa por tipo, número, ano e assunto. citeturn24search13

### TSE — Dados Abertos processuais e jurisprudência eleitoral

O Portal de Dados Abertos do TSE possui conjuntos processuais específicos contendo **processos eleitorais, assuntos, decisões e recursos**, organizados por pleito, inclusive com dataset referente a 2026 no catálogo atual. citeturn20search1turn20search4turn20search16

```text
https://dadosabertos.tse.jus.br/
```

O portal é baseado em CKAN e expõe acesso via API do catálogo, além de downloads em CSV; parte dos conjuntos eleitorais também possui recursos TXT. citeturn20search4turn20search23

A licença Creative Commons Attribution aparece associada aos conjuntos processuais catalogados de eleições anteriores. citeturn20search7turn20search23

O TSE mantém separadamente sua área oficial de jurisprudência e legislação eleitoral. citeturn24search11

Para a integração:

```text
TSE Dados Abertos -> ingestão/analytics/processos
DataJud TSE/TRE   -> movimentação normalizada
TSE Jurisprudência -> validação de julgados
TSE Legislação    -> legislação eleitoral consolidada
```

Essa separação é particularmente importante em ano eleitoral, quando alterações normativas e decisões recentes podem mudar a resposta juridicamente correta.

### TCU — webservices e jurisprudência inteira para download

O TCU é um dos melhores exemplos de fonte `.gov.br` utilizável sem navegador. Embora não seja Poder Judiciário, seus acórdãos são essenciais em licitações, contratos administrativos, controle externo, responsabilização e direito público.

O TCU disponibiliza cinco bases de jurisprudência em Dados Abertos: **Acórdãos, Jurisprudência Selecionada, Publicações, Súmulas e Respostas a Consultas**. O próprio portal oferece esses dados para download em CSV. citeturn30search1turn30search4turn30search6

```text
https://sites.tcu.gov.br/dados-abertos/jurisprudencia/
https://pesquisa.apps.tcu.gov.br/
```

Existe ainda documentação oficial de **Webservices TCU**, inclusive com parâmetros de paginação por posição inicial e quantidade de acórdãos retornados. citeturn30search9

```text
https://sites.tcu.gov.br/dados-abertos/webservices-tcu/
```

A pesquisa oficial também disponibiliza páginas de resultado diretamente endereçáveis por URL, o que permite integração HTTP mesmo quando não se deseja importar toda a base. citeturn30search3turn30search8

Para direito administrativo, eu trataria o TCU como fonte A, não como complemento opcional.

### STF Corte Aberta — dados estruturados, mas não substitui jurisprudência

O STF disponibiliza dados do programa Corte Aberta em formatos exportáveis, incluindo CSV, para informações jurisdicionais e estatísticas. citeturn16search1turn17search1

Isso é útil como fonte factual e analítica, mas **não resolve sozinho a consulta de inteiro teor nem o status constitucional de um precedente**. Para estes casos, o adapter STF deve combinar a pesquisa oficial de jurisprudência, repercussão geral e súmulas. citeturn20search0turn20search3turn20search12


## Páginas oficiais consumíveis diretamente por HTTP, sem navegador

Quando não há API pública documentada, ainda é possível utilizar uma página oficial como fonte de leitura **desde que o seu produto a trate como adapter instável**, e não como contrato de API.

A diferença arquitetural precisa ser explícita:

```text
API/documento estruturado oficial
    -> contrato forte
    -> parser versionado
    -> monitoramento de schema

HTML público oficial
    -> contrato fraco
    -> parser isolado
    -> testes de fixture
    -> detector de mudança
    -> fallback/feature flag
```

### STF — Jurisprudência, Repercussão Geral e Súmulas

Fontes oficiais:

```text
https://portal.stf.jus.br/jurisprudencia/
https://portal.stf.jus.br/repercussaogeral/teses.asp
```

A área de jurisprudência é a fonte institucional de busca do Supremo; a página de Repercussão Geral expõe as teses e seus respectivos julgamentos. citeturn20search0turn20search3

Há páginas individuais de súmulas vinculantes, o que permite buscar e armazenar localmente seu texto e metadados mantendo o URI oficial como origem. citeturn20search12

Também considero particularmente útil para RAG jurídico constitucional a base **“A Constituição e o Supremo”**, pois ela liga dispositivos constitucionais a julgados do STF. Para uma resposta final, porém, eu continuaria validando o acórdão individual.

### STJ SCON

```text
https://scon.stj.jus.br/SCON/
```

É pesquisável por texto ou número de processo/registro e dispõe de pesquisa avançada e conectivos próprios. citeturn28search23

Use a base offline de Dados Abertos para indexação; use SCON para **revalidação online**.

### TST Jurisprudência

```text
https://www.tst.jus.br/jurisprudencia
https://jurisprudencia.tst.jus.br/
```

O TST mantém sua área oficial de jurisprudência e acesso à busca. citeturn28search2

Na pesquisa realizada, **não encontrei documentação pública oficial que permita tratar essa busca como uma API estável de jurisprudência**. Por isso não construiria uma dependência central baseada em reverse engineering de chamadas internas do frontend. Para dados processuais, use DataJud/TST; para jurisprudência, mantenha o adapter HTML como fonte oficial de confirmação.

### CJF — Jurisprudência Unificada

```text
https://jurisprudencia.cjf.jus.br/
```

A pesquisa unificada do CJF agrega fontes como STF, STJ, TNU e TRFs e é particularmente valiosa para Direito Federal e Juizados Especiais Federais. citeturn14search9turn14search17

Não localizei uma API pública documentada para essa pesquisa. Ela deve ser classificada como `official-web-search`, e não como REST API.

### CNJ Banco Nacional de Precedentes

O Banco Nacional de Precedentes é uma das fontes mais importantes para o seu caso porque foi concebido para consulta a **precedentes qualificados** de tribunais brasileiros. O CNJ relançou e expandiu o BNP/Pangea, e em 2026 informou melhorias voltadas à pesquisa desses precedentes. citeturn25search0turn25search2turn25search6

O BNP existe justamente para centralizar e divulgar precedentes qualificados, com participação de tribunais superiores. citeturn25search8turn25search16

Eu o utilizaria como **gate obrigatório de verificação**, mesmo que a ingestão principal venha de outros lugares:

```text
resultado encontrado
      ↓
é precedente qualificado?
      ↓
consultar BNP
      ↓
confirmar tribunal/origem/tema/status
      ↓
só então entregar como "precedente qualificado"
```

Na pesquisa não encontrei API pública documentada do BNP que eu possa recomendar como contrato estável; portanto, não vou inventar endpoint.

### TSE — Jurisprudência

O TSE mantém pesquisa oficial de jurisprudência e, paralelamente, bases de jurisprudência, informativos, julgados históricos, súmulas e legislação eleitoral. citeturn24search11

A estratégia segura é combinar a pesquisa oficial com o DataJud e os datasets processuais do próprio TSE, em vez de depender exclusivamente do mecanismo de busca.

### CARF — acórdãos tributários

O CARF mantém pesquisa oficial de jurisprudência/acórdãos por período, processo, número do acórdão, relator, contribuinte e conteúdo da ementa/decisão. O mecanismo suporta operadores de pesquisa textual como `E`, `NÃO`, `OU`, `$` e `ADJ`. citeturn29search4

```text
https://carf.fazenda.gov.br/sincon/public/pages/ConsultarJurisprudencia/consultarJurisprudenciaCarf.jsf
https://www.gov.br/carf/pt-br/jurisprudencia/acordaos-carf
```

O portal gov.br também disponibiliza páginas de acórdãos com identificação de processo e contribuinte e acesso ao inteiro teor. citeturn29search1

Não encontrei API REST pública documentada do CARF que mereça ser tratada como contrato de produção. O sistema de pesquisa deve permanecer em adapter isolado.

### Planalto, Câmara e Receita — fontes de legislação

Para vigência normativa, eu usaria pelo menos três adapters independentes:

```text
https://www4.planalto.gov.br/legislacao/
https://www.camara.leg.br/legislacao
https://normas.receita.fazenda.gov.br/
```

O Portal da Legislação da Presidência centraliza legislação federal e referências correlatas. citeturn24search9 A Câmara oferece busca por legislação federal, tipo, número, ano e assunto. citeturn24search13 O Sistema Normas da Receita é uma fonte oficial particularmente relevante para atos e interpretações administrativas tributárias. citeturn20search11

A presença de uma norma em um desses índices não deve, sozinha, ser traduzida pelo agente como “vigente”. Vigência precisa ser uma conclusão produzida a partir do ato, alterações, revogações, eficácia temporal e, quando pertinente, controle de constitucionalidade.


## Como verificar vigência, precedente e “estado atual” antes de responder ao advogado

Aqui está o ponto que diferencia um buscador jurídico sério de um RAG que apenas recupera PDFs.

O sistema deve separar **descoberta**, **prova documental** e **status jurídico**.

Para legislação:

```text
Pergunta
  ↓
LexML / Senado / Câmara
  ↓
resolver norma e identificador canônico
  ↓
obter texto oficial
  ↓
verificar alterações/revogação
  ↓
consultar fonte oficial atual
  ↓
relacionar jurisprudência que afetou interpretação/constitucionalidade
  ↓
responder com data de corte
```

LexML é especialmente valioso na descoberta porque agrega legislação e outras classes documentais e suporta consulta SRU/XML; Câmara e Senado fornecem dados do processo legislativo, enquanto o Portal da Legislação oferece a referência oficial do Executivo. citeturn9search5turn24search2turn23search2turn24search9

Para jurisprudência:

```text
busca lexical/semântica offline
  ↓
candidatos
  ↓
tribunal oficial
  ↓
inteiro teor
  ↓
órgão julgador + data + publicação
  ↓
houve precedente posterior?
  ↓
precedente qualificado?
  ↓
houve superação/modulação/cancelamento?
  ↓
resultado validado
```

No STJ, o dataset de precedentes qualificados deve ser consultado junto aos acórdãos. citeturn12search3 No STF, a situação de repercussão geral e as súmulas devem participar da avaliação. citeturn20search3turn20search12 Em nível nacional, o BNP é a camada de conferência de precedentes qualificados. citeturn25search0turn25search6

Um erro que eu bloquearia programaticamente é este:

> “Encontrei um acórdão de 2021 que diz X, portanto o entendimento atual é X.”

Isso não é suficiente. Um acórdão antigo pode continuar válido, ter sido distinguido, superado, afetado por repetitivo, modulado, contraposto por turma/seção ou simplesmente deixar de representar a posição dominante. O agente precisa distinguir `decision_found` de `current_precedent_verified`.

Sugiro um estado interno assim:

```ts
type JurisprudenceVerification =
  | "discovered"
  | "official_source_confirmed"
  | "full_text_confirmed"
  | "precedent_status_checked"
  | "temporally_verified"
  | "conflict_detected"
  | "insufficient_evidence";
```

A resposta ao usuário não deve dizer “jurisprudência atual” enquanto o item estiver apenas em `discovered`.

Também armazenaria separadamente quatro datas:

```text
judgmentDate
publicationDate
sourceUpdatedAt
retrievedAt
```

DataJud, por exemplo, possui `dataHoraUltimaAtualizacao`; isso é útil para saber quando o registro foi atualizado na base, mas não deve ser convertido semanticamente em “esta jurisprudência continua atual”. citeturn4search2

Para cada documento, preserve a origem:

```json
{
  "authority": "STJ",
  "documentType": "acordao",
  "canonicalId": "...",
  "processNumber": "...",
  "court": "STJ",
  "judgingBody": "...",
  "judgmentDate": "...",
  "publicationDate": "...",
  "retrievedAt": "...",
  "sourceUri": "...",
  "contentSha256": "...",
  "sourceTier": "official-primary",
  "fullTextVerified": true,
  "precedentStatus": "not-yet-verified"
}
```

`contentSha256` tem uma função importante: permitir demonstrar posteriormente exatamente qual versão de um documento foi usada na resposta, sem depender de o site continuar entregando a mesma representação.


## Arquitetura que eu usaria para o Codex

A recomendação mais forte é: **não crie vinte ferramentas MCP, uma para cada tribunal**. Isso transfere para o modelo a responsabilidade de conhecer topologia do Judiciário, disponibilidade e peculiaridades de cada fonte.

Faça o contrário:

```text
Codex
  │
  ▼
legal-br MCP
  │
  ├── jurisprudence.search
  ├── jurisprudence.verify
  ├── precedent.check
  ├── case.get
  ├── case.movements
  ├── publication.search
  ├── legislation.search
  ├── legislation.verify
  └── document.fetch
        │
        ├─ DataJud
        ├─ DJEN
        ├─ STJ Open Data / SCON
        ├─ STF
        ├─ BNP
        ├─ LexML
        ├─ Senado
        ├─ Câmara
        ├─ TSE
        ├─ TST
        ├─ CJF
        ├─ TCU
        └─ CARF
```

O MCP é atualmente a forma oficial de conectar Codex a ferramentas e contexto externos. A documentação da OpenAI confirma suporte do Codex a MCP e configuração compartilhada entre CLI e extensão IDE. citeturn31search0turn31search2turn31search3

Isso permite configurar o serviço, por exemplo, com a interface oficial do Codex:

```bash
codex mcp add legal-br --url https://SEU-HOST-MCP.example.com/mcp
codex mcp list
```

O padrão de configuração via `codex mcp add ...` e a validação via `codex mcp list` estão documentados oficialmente. citeturn31search2

Se depois quiser distribuir a solução como plugin, o modelo atual de plugins permite empacotar skills e dependências de servidores MCP. citeturn31search12turn31search14

Há, entretanto, uma diferença importante entre superfícies: a documentação atual informa que a extensão IDE não suporta plugins da mesma forma, enquanto MCP pode ser configurado tanto na CLI quanto na IDE. Isso reforça a decisão de manter **toda a inteligência jurídica crítica no MCP**, usando o plugin apenas como packaging/instruções/workflow. citeturn31search2turn31search12

Eu faria o servidor em Node.js/TypeScript com arquitetura de adapters:

```text
src/
  domain/
    LegalDocument.ts
    JurisprudenceHit.ts
    Verification.ts
    Provenance.ts

  adapters/
    cnj-datajud/
    cnj-djen/
    cnj-bnp/
    stf/
    stj/
    tst/
    tse/
    cjf/
    lexml/
    senado/
    camara/
    tcu/
    carf/

  application/
    SearchJurisprudence.ts
    VerifyJurisprudence.ts
    VerifyLegislation.ts
    CheckPrecedent.ts

  mcp/
    tools/
      jurisprudence.search.ts
      jurisprudence.verify.ts
      precedent.check.ts
      case.get.ts
      publication.search.ts
      legislation.search.ts
      legislation.verify.ts
```

A abstração principal não deve ser “site”, mas **autoridade documental**:

```ts
interface LegalSourceAdapter {
  readonly authority: string;
  readonly tier: "primary" | "official-index" | "official-publication";

  search(query: LegalQuery): Promise<SearchResult[]>;
  fetch(ref: DocumentRef): Promise<CanonicalDocument>;
  healthCheck(): Promise<SourceHealth>;
}
```

E uma busca jurídica deveria devolver algo deste tipo:

```json
{
  "query": "...",
  "cutoff": "2026-09-23T...",
  "results": [
    {
      "authority": "STJ",
      "type": "ACORDAO",
      "canonicalId": "...",
      "processNumber": "...",
      "court": "STJ",
      "judgingBody": "...",
      "judgmentDate": "...",
      "publicationDate": "...",
      "source": {
        "tier": "official-primary",
        "uri": "...",
        "retrievedAt": "...",
        "sha256": "..."
      },
      "verification": {
        "fullText": true,
        "officialSource": true,
        "precedentStatusChecked": true,
        "currentnessCheckedAt": "..."
      }
    }
  ]
}
```

Isso permite ao Codex citar fatos sem receber uma massa amorfa de HTML.

### Armazenamento e busca

Para AWS, minha arquitetura prática seria:

```text
                  ┌───────────────┐
Internet oficial ─► ingestion ECS │
                  │ / Lambda      │
                  └──────┬────────┘
                         │
          ┌──────────────┼─────────────────┐
          ▼              ▼                 ▼
      S3 Raw         PostgreSQL        OpenSearch
   original files    provenance       lexical/vector
   immutable         relationships    retrieval
          │              │                 │
          └──────────────┼─────────────────┘
                         ▼
                    MCP Service
                    ECS/Fargate
                         │
                         ▼
                       Codex
```

Eu **não usaria embeddings como fonte de verdade**. Embedding serve para recuperar candidatos. Identificador, datas, tribunal, processo, vigência e status do precedente devem vir da camada estruturada/provenance.

A busca poderia combinar:

```text
BM25/textual
     +
embedding
     +
filtros jurídicos estruturados
     +
reranking
     +
verification pipeline
```

Filtros jurídicos devem preceder qualquer resposta final:

```text
tribunal
órgão julgador
classe
tema/assunto
intervalo temporal
tipo de decisão
grau
precedente qualificado
publicação
fonte oficial confirmada
```

Isso é melhor do que jogar todo o corpus em vector search e esperar que proximidade semântica represente validade jurídica.


## Regras de segurança, integridade e limites que o produto precisa impor

O primeiro requisito é **proveniência obrigatória**. Nenhum fato jurídico gerado pelo MCP deveria existir sem um identificador de fonte oficial. Para cada alegação sobre um julgado, o agente precisa conseguir retornar tribunal, processo ou identificador, data, origem e momento da consulta.

O segundo requisito é **não confundir ausência de resultado com ausência de jurisprudência**. Uma consulta pode falhar por cobertura, indexação, indisponibilidade, atraso de alimentação ou filtro incorreto. O próprio CNJ declara limitações quanto à garantia de precisão, integridade e atualidade da API DataJud. citeturn7view0

Consequentemente:

```text
0 resultados
≠
não existe jurisprudência
```

A saída correta deve ser algo como:

```json
{
  "status": "NO_MATCH_IN_QUERIED_SOURCES",
  "sourcesQueried": ["STJ_OPEN_DATA", "STJ_SCON"],
  "claimOfAbsence": false
}
```

O terceiro requisito é **separar texto encontrado de conclusão jurídica**. O modelo pode extrair uma tese de um acórdão, mas deve declarar que isso é uma interpretação do documento, a menos que a própria fonte forneça uma tese/enunciado oficial.

O quarto é uma política rígida de data de corte:

```json
{
  "knowledgeCutoff": null,
  "legalDataCheckedUntil": "2026-09-23T14:...",
  "sourcesFreshness": {
    "datajud": "...",
    "stj": "...",
    "bnp": "...",
    "stf": "..."
  }
}
```

Para a área jurídica, “pesquisado hoje” é muito mais defensável do que “meu índice local é atualizado”.

O quinto é preservar as fontes brutas. O STJ oferece datasets históricos e incrementais adequados a isso. citeturn12search8 Câmara informa atualização diária de seus conjuntos de proposições. citeturn23search2 TSE mantém datasets processuais por eleição, incluindo a base atual de 2026. citeturn20search1turn20search25

Isso possibilita:

```text
fetch
  ↓
raw immutable
  ↓
SHA-256
  ↓
parse
  ↓
canonical record
  ↓
index
```

Se um parser mudar, você reprojeta o documento a partir do original, sem redownload e sem perder auditabilidade.

O sexto é monitorar cada fonte separadamente:

```text
source.health
schema fingerprint
last successful fetch
HTTP status
latency
document count
delta count
parser failure rate
staleness
```

Uma base jurídica que parou silenciosamente de atualizar há duas semanas é pior do que uma API indisponível: a primeira continua produzindo respostas plausíveis.

O sétimo é não fazer crawling agressivo em páginas que não foram projetadas como API. Para STF, TST, CJF e CARF, eu utilizaria:

```text
rate limiting
conditional requests
cache
circuit breaker
low concurrency
fixture-based parser tests
change detection
```

e priorizaria fontes estruturadas sempre que disponíveis.

O oitavo é o problema contratual do DataJud. Os termos oficiais restringem sua utilização e exploração comercial e afastam garantias quanto à exatidão/atualização. citeturn7view0 **Não coloque o DataJud no centro de uma oferta comercial sem resolver isso.** Esse é um risco real, não um detalhe de implementação.

Uma alternativa de arquitetura é manter DataJud como serviço opcional de enriquecimento e construir o corpus comercialmente crítico sobre fontes explicitamente publicadas como dados abertos, com suas licenças preservadas — como ocorre em determinados datasets do STJ e TSE. citeturn12search8turn20search7


## Matriz final de fontes e prioridade de implementação

Esta é a matriz que eu usaria para decidir o que realmente entra no primeiro release.

| Fonte oficial | Domínio | Acesso máquina | Formato/extensão | Inteiro teor / jurisprudência | Offline | Papel recomendado |
|---|---|---|---|---|---|---|
| **CNJ DataJud** | `.jus.br` | API documentada | JSON | não é base principal de inteiro teor | cacheável | processo, assuntos, movimentos |
| **CNJ DJEN** | `.jus.br` | API/Swagger | JSON + conteúdo publicado | publicações, eventualmente ementas/teores | cacheável | publicação oficial/comunicação |
| **STJ Dados Abertos** | `.jus.br` | downloads estruturados | CSV, JSON, ZIP, GZ | **sim** | **excelente** | corpus STJ |
| **STJ SCON** | `.jus.br` | HTTP/web oficial | HTML | **sim** | não ideal | confirmação final STJ |
| **LexML** | `.gov/.leg` ecossistema oficial | **SRU API** | XML + JSON-LD nas normas | descoberta multi-base | sim | legislação/resolução de referências |
| **Senado Dados Abertos** | `.leg.br` oficial | API Swagger | REST | legislativo, não jurisprudência | cacheável | vigência/processo legislativo |
| **Câmara Dados Abertos** | `.leg.br` oficial | REST/Swagger + bulk | JSON, XML, CSV, XLSX, ODS | legislativo | **sim** | projetos/tramitação/votação |
| **TSE Dados Abertos** | `.jus.br` | CKAN/API + downloads | CSV, TXT | decisões/processos eleitorais | **sim** | eleitoral |
| **TSE Jurisprudência** | `.jus.br` | HTTP | HTML/documentos | **sim** | parcial | confirmação eleitoral |
| **TCU Dados Abertos** | `.gov.br` | download + webservices | CSV | **sim** | **excelente** | administrativo/controle |
| **STF Jurisprudência** | `.jus.br` | HTTP oficial | HTML/documentos | **sim** | via coleta controlada | constitucional |
| **STF Repercussão Geral** | `.jus.br` | HTTP oficial | HTML | teses | cacheável | status de precedente |
| **STF Corte Aberta** | `.jus.br` | download | CSV | dados jurisdicionais | sim | factual/analytics |
| **CNJ BNP/Pangea** | `.jus.br` | portal oficial | web | precedentes qualificados | cache controlado | verificador nacional |
| **TST Jurisprudência** | `.jus.br` | HTTP oficial | web/documentos | **sim** | parcial | trabalhista |
| **CJF Jurisprudência Unificada** | `.jus.br` | HTTP oficial | HTML | **sim**, federada | parcial | federal/TNU/TRF |
| **CARF** | `.gov.br` | HTTP oficial | HTML/documentos | **sim** | parcial | tributário administrativo |
| **Planalto Legislação** | `.gov.br` | HTTP oficial | HTML/documentos | legislação | sim | confirmação normativa |
| **Câmara Legislação** | `.leg.br` | HTTP oficial | HTML | legislação federal | cacheável | confirmação normativa |
| **Receita Normas** | `.gov.br` | HTTP oficial | HTML | normas tributárias | cacheável | tributário normativo |

A classificação acima decorre das documentações oficiais do DataJud, STJ, TSE, LexML/Senado, Câmara, TCU, STF, CNJ, TST, CJF e CARF consultadas. citeturn27search3turn12search3turn20search4turn10view0turn24search2turn23search2turn30search1turn20search0turn25search0turn28search2turn14search17turn29search4

A ordem de implementação que considero racional é:

**Primeiro núcleo:** DataJud + STJ Dados Abertos/SCON + LexML + Senado/Câmara + STF + BNP. Isso cobre processo, jurisprudência superior, legislação e precedentes qualificados. citeturn4search6turn12search3turn28search23turn10view0turn24search2turn23search2turn20search0turn25search0

**Segundo núcleo:** DJEN + TST + TSE + CJF. Isso acrescenta publicação oficial e especializações trabalhista, eleitoral e federal. citeturn25search1turn28search2turn20search4turn14search17

**Terceiro núcleo:** TCU + CARF + Receita, elevando muito a qualidade para administrativo, licitações, controle externo e tributário. citeturn30search1turn30search9turn29search4turn20search11

O desenho final que eu considero defensável para advocacia é este:

```text
                         ┌─────────────────────┐
                         │       Codex         │
                         └──────────┬──────────┘
                                    │ MCP
                         ┌──────────▼──────────┐
                         │    legal-br-mcp     │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
     DISCOVERY                 VERIFICATION               FACTS
 LexML / local index        STF/STJ/BNP/TST         DataJud / DJEN
 STJ/TSE/TCU bulk           TSE/CJF/CARF            TCU/process data
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Provenance Engine   │
                         │ URI oficial         │
                         │ SHA-256             │
                         │ data de consulta    │
                         │ status precedente   │
                         │ status vigência     │
                         └──────────┬──────────┘
                                    ▼
                         resposta juridicamente
                         verificável + fontes
```

E estabeleceria uma regra absoluta para o agente:

```text
Nenhuma afirmação de:
  - "lei vigente"
  - "jurisprudência atual"
  - "entendimento pacificado"
  - "precedente vinculante"
  - "tese firmada"
  - "houve trânsito em julgado"

pode ser produzida apenas a partir de similaridade semântica,
memória do modelo ou de um documento isolado.

Toda afirmação desse tipo exige verificação temporal
em fonte oficial e retorno de provenance.
```

Essa regra é mais importante do que o modelo escolhido, o banco vetorial ou o framework de agentes.

Para o objetivo específico de Codex, o **MCP como núcleo e o plugin como camada de distribuição/orquestração** está alinhado com a arquitetura atualmente documentada pela OpenAI: MCP fornece ferramentas e contexto ao Codex; plugins podem agrupar skills e conexões MCP; e o próprio Codex permite listar e inspecionar os MCPs disponíveis na sessão. citeturn31search0turn31search14turn31search16

O resultado não deveria ser um “plugin que pesquisa jurisprudência”. Deveria ser um **gateway jurídico oficial brasileiro com proveniência, temporalidade e verificação**, do qual o Codex é apenas um dos consumidores. Essa separação evita que a confiabilidade jurídica fique amarrada ao ciclo de vida de uma interface específica do agente.