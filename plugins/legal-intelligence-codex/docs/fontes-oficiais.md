# Fontes oficiais, cobertura e verificação

O núcleo MCP consulta fontes públicas brasileiras e separa descoberta documental,
metadados processuais, publicações e evidências para conferência. Não contém uma
base própria de jurisprudência, índice vetorial ou certificação automática de
vigência e precedentes. Esta matriz descreve a implementação 0.1.0 e os testes
observados em **23 de setembro de 2026**; disponibilidade externa pode mudar.

## Capacidades por fonte

| Fonte | Acesso implementado | Resultado efetivamente entregue | Limites e teste externo observado |
| --- | --- | --- | --- |
| CNJ DataJud | POST autenticado na API pública, por tribunal e número CNJ | Capa processual, classes, assuntos, órgão e movimentos quando solicitados | Sem autos ou inteiro teor; apenas aliases documentados, até 20 registros por consulta. Não testado ao vivo por ausência de chave. Contratos e falhas cobertos por testes locais. |
| CNJ DJEN | GET de uma página por processo, com filtros opcionais de tribunal e datas | Metadados de comunicação, disponibilização e referências à certidão | Texto, destinatários e advogados omitidos; itens com marcadores de sigilo excluídos. Teste externo passou com número sintético e zero resultados; isso não valida todos os formatos de publicações reais. |
| LexML | SRU/XML no índice de metadados | Referências documentais, identificadores, títulos e datas fornecidos pela fonte | Classes documentais mistas, sem filtro de domínio validado. Não confirma norma, acórdão ou inteiro teor. Consulta externa encontrou challenge de segurança, sem tentativa de contorno. Parser validado com fixtures. |
| Câmara dos Deputados | API de proposições | Proposições e dados de apresentação | Não é pesquisa de normas vigentes. Consulta externa de PL/2024, limitada a um registro, passou. |
| Senado Federal | API `/dadosabertos/processo` | Processos legislativos e situação informada pela fonte | Exige número ou ano. API sem paginação: o adapter apresenta uma fatia local da resposta, limitada em bytes. Consulta externa de PL 21/2020 passou. |
| STJ Dados Abertos | CKAN `package_search` | Metadados de datasets, recursos e licença declarada | Não pesquisa o conteúdo dos arquivos nem retorna acórdãos individuais. Consulta externa expirou; portal e contrato CKAN conferidos. |
| TSE Dados Abertos | CKAN `package_search` | Metadados de datasets e links de recursos | Não verifica jurisprudência eleitoral. Consulta mínima ao endpoint recebeu bloqueio de acesso; portal conferido e parser testado localmente. |
| STJ SCON | Portal indicado para consulta | Link de pesquisa oficial | Sem busca automatizada ou parser de acórdãos integrado. |
| STJ temas repetitivos | Portal indicado para conferência | Link para consulta de temas | Status, tese, modulação e superação exigem leitura e pesquisa na fonte. |
| STF jurisprudência | Portal indicado para consulta | Link de pesquisa oficial | Sem API de pesquisa integrada. DataJud não substitui esta fonte. |
| STF repercussão geral | Portal indicado para conferência | Link oficial de teses | Não há confirmação automática de situação ou efeitos do precedente. |
| CNJ BNP/Pangea | Portal indicado para conferência | Link do Banco Nacional de Precedentes | Sem contrato de API pública validado nesta implementação. |
| TST | Portal indicado para consulta | Link de jurisprudência trabalhista | Sem busca automatizada integrada. |
| CJF | Portal indicado para consulta | Link de pesquisa federada | Sem API integrada; a existência do link não indica que os tribunais foram consultados. |
| TCU | Portal de dados abertos indicado | Link para fontes de jurisprudência de controle externo | Sem ingestão ou parser dos downloads. TCU não é órgão do Poder Judiciário. |
| CARF | Portal indicado para consulta | Link de jurisprudência administrativa tributária | Sem API integrada. CARF não é órgão do Poder Judiciário. |
| Planalto | Obtenção de documento por URL permitida | Hash dos bytes e trecho textual, quando suportado | Sem motor de pesquisa legislativa ou certificação de vigência. |
| Receita Federal | Portal indicado para consulta | Link do sistema de normas | Sem pesquisa estruturada integrada. |

## Ferramentas MCP

| Ferramenta | Comportamento |
| --- | --- |
| `sources_list` | Lista fontes, modos de acesso e indicação de chave DataJud configurada. Não testa conexão nem consulta as fontes. |
| `case_get` | Consulta metadados públicos do processo no DataJud. |
| `case_movements` | Inclui os movimentos fornecidos pelo DataJud, com limites e sinalização de resposta parcial. |
| `publication_search` | Consulta uma página DJEN. Aceita 5 ou 100 itens, respeitando o teto de 10.000 resultados do contrato. Não calcula ciência ou prazo. |
| `legislation_search` | Descobre referências LexML ou proposições da Câmara/Senado. |
| `jurisprudence_search` | Usa o índice geral LexML ou descobre datasets STJ/TSE. O nome da ferramenta não implica acesso ao inteiro teor dos acórdãos. |
| `datasets_search` | Consulta apenas metadados dos catálogos STJ/TSE. Não baixa, descompacta ou indexa os recursos. |
| `document_fetch` | Obtém documento de host explicitamente permitido, até 5.000.000 bytes, e calcula SHA-256. Texto retorna como trecho; PDF retorna como `pdf-not-extracted`, sem extração ou inspeção do texto. |
| `legislation_verify` | Reúne documento opcional e pendências para conferência normativa; retorna `INSUFFICIENT_EVIDENCE`. |
| `jurisprudence_verify` | Reúne documento opcional e fontes para conferência jurisprudencial; retorna `INSUFFICIENT_EVIDENCE`. |
| `precedent_check` | Reúne evidências e pendências para conferir precedente; retorna `INSUFFICIENT_EVIDENCE`. |

O recurso MCP `legal-br://coverage` expõe o catálogo de capacidades. As consultas
legislativas e de catálogos aceitam até 20 registros pela interface MCP; os
adapters internos comportam até 50. Isso é um limite da implementação, não uma
declaração de cota concedida pelas autoridades.

## Proveniência e interpretação dos estados

Uma resposta obtida preserva autoridade, URL de origem, instante `retrievedAt`,
SHA-256 do corpo HTTP completo e `Last-Modified`, quando informado. O hash
identifica os bytes recebidos naquela consulta: não é assinatura da autoridade
nem hash individual de cada item ou recurso apontado pelo catálogo. O núcleo
não mantém arquivo permanente das respostas brutas.

Datas documentais, datas de situação e atualização de metadados permanecem
distintas do instante de consulta. Atualização de registro não prova vigência,
publicação, trânsito em julgado ou atualidade de uma tese. Links de documentos
e certidões presentes no resultado não foram necessariamente abertos.

- `RESULTS`: há itens na consulta e na cobertura descritas.
- `NO_MATCH_IN_QUERIED_SOURCE`: não há itens apresentados nessa consulta;
  `claimOfAbsence` continua `false` e a cobertura deve ser examinada, inclusive
  exclusões por sigilo e paginação.
- `NOT_VERIFIED`: erro de consulta, contrato, credencial, rede ou bloqueio.
  Não deve ser interpretado como resposta vazia da fonte.
- `DOCUMENT_RETRIEVED`: bytes de origem permitida obtidos; não certifica inteiro
  teor jurídico, vigência ou status de precedente.
- `INSUFFICIENT_EVIDENCE`: ainda existem conferências substantivas pendentes.

As buscas mantêm `fullTextConfirmed: false`, `precedentStatusChecked: false` e
datas de verificação jurídica nulas. As ferramentas de conferência não promovem
esses estados a uma conclusão jurídica positiva. As fontes sugeridas por elas
trazem `consulted: false` quando não foram consultadas.

## Acesso, privacidade e limites técnicos

DataJud recebe a chave por `DATAJUD_API_KEY`; nenhuma chave acompanha o código.
Use a [orientação oficial de acesso](https://datajud-wiki.cnj.jus.br/api-publica/acesso/)
para obter a configuração atual. Os outros adapters não exigem credenciais nesta
implementação.

O [Termo de Uso do DataJud](https://datajud-wiki.cnj.jus.br/api-publica/termo-uso/),
consultado em 23/09/2026, informa finalidade legal, não comercial e autorizada,
restrições à exploração comercial da API e das informações derivadas, além de
responsabilidades do usuário. O CNJ também informa que não garante precisão,
integridade ou atualidade dos dados; este resumo descreve a fonte e não determina
a compatibilidade de um produto ou uso concreto com o termo.

O transporte admite somente HTTPS em hosts explicitamente permitidos, verifica
os endereços DNS e rejeita destinos privados. Cada redirecionamento passa por
validação; consultas autenticadas e POST não são redirecionadas. Há limite de
tamanho de resposta, tempo máximo por tentativa, uma consulta simultânea por
host e intervalo mínimo entre chamadas. HTTP 429 não provoca repetição automática;
o erro informa a espera aplicável. Challenges e bloqueios não são contornados.

DataJud exclui registros cujo nível de sigilo não seja explicitamente público.
DJEN omite nomes e texto e exclui registros com marcadores de sigilo; documentos
textuais obtidos também passam por detecção conservadora desses marcadores.
Isso não constitui anonimização geral nem classificação jurídica: metadados
podem conter informações pessoais, PDFs não são examinados e uma referência
oficial não autoriza qualquer uso ou redistribuição. As licenças dos datasets
são preservadas como declaradas pela fonte, com `verified: false`.

## Contratos e portais oficiais

As referências abaixo permitem conferir os contratos implementados e acessar
as fontes manuais. Um portal listado não equivale a uma integração automatizada.

- DataJud: [documentação](https://datajud-wiki.cnj.jus.br/api-publica/),
  [endpoints por tribunal](https://datajud-wiki.cnj.jus.br/api-publica/endpoints/)
  e [termo de uso](https://datajud-wiki.cnj.jus.br/api-publica/termo-uso/).
- DJEN: [contrato OpenAPI](https://comunicaapi.pje.jus.br/swagger/djen.yml).
- LexML: [catálogo oficial do Senado e indicação do serviço SRU](https://www12.senado.leg.br/dados-abertos/legislativo/legislacao/acervo-do-portal-lexml)
  e [endpoint SRU](https://www.lexml.gov.br/busca/SRU).
- Senado: [OpenAPI JSON](https://legis.senado.leg.br/dadosabertos/v3/api-docs)
  e [interface da documentação](https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html).
- Câmara: [OpenAPI JSON](https://dadosabertos.camara.leg.br/api/v2/api-docs)
  e [interface e cobertura dos dados](https://dadosabertos.camara.leg.br/swagger/api.html).
- STJ: [dados abertos](https://dadosabertos.web.stj.jus.br/),
  [CKAN API indicada pelo portal](https://docs.ckan.org/en/2.9/api/),
  [SCON](https://scon.stj.jus.br/SCON/) e
  [temas repetitivos](https://processo.stj.jus.br/repetitivos/temas_repetitivos/).
- TSE: [dados abertos](https://dadosabertos.tse.jus.br/) e
  [jurisprudência](https://jurisprudencia.tse.jus.br/).
- STF: [jurisprudência](https://portal.stf.jus.br/jurisprudencia/) e
  [teses de repercussão geral](https://portal.stf.jus.br/repercussaogeral/teses.asp).
- CNJ: [Banco Nacional de Precedentes](https://pangeabnp.pdpj.jus.br/).
- Justiça do Trabalho: [TST](https://www.tst.jus.br/jurisprudencia).
- Justiça Federal: [CJF](https://jurisprudencia.cjf.jus.br/).
- Controle externo: [TCU](https://sites.tcu.gov.br/dados-abertos/jurisprudencia/).
- Tributário administrativo: [CARF](https://carf.fazenda.gov.br/sincon/public/pages/ConsultarJurisprudencia/consultarJurisprudenciaCarf.jsf).
- Normas: [Planalto](https://www4.planalto.gov.br/legislacao/) e
  [Receita Federal](https://normas.receita.fazenda.gov.br/).

## Teste externo opcional

No checkout de desenvolvimento, com Node.js 22 ou superior e dependências
instaladas, execute `npm run smoke`. O script é portátil para Windows, macOS e
Linux, faz três chamadas pequenas e sequenciais a DJEN, Câmara e Senado e não
integra a suíte de testes offline ou CI.

O DJEN recebe o número sintético `00000000000000000000`; as outras consultas
buscam uma proposição por fonte. A saída contém somente fonte, estado, contagem,
hash e instante da consulta, sem textos de documentos ou pessoas. Uma falha
produz código de erro e saída do processo diferente de zero, sem repetição ou
tentativa de contornar bloqueios. O teste confirma conectividade e o formato das
respostas recebidas naquele momento; não certifica cobertura, disponibilidade
futura ou correção de conclusões jurídicas.
