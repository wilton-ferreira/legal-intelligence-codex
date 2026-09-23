# Origem das habilidades

O plugin adapta o conteúdo de `legal-intelligence-strategy` fornecido pelo
usuário, além dos dois documentos preservados neste repositório. As referências
incluídas no pacote são autossuficientes: o diretório original não é necessário
para instalar ou executar.

| Habilidade/referência | Base de suporte |
|---|---|
| pesquisar-direito-brasileiro | `mentoria-continuada/02-inteligencia-investigativa/skills/01-mapeamento-de-jurisprudencia.md` e `02-construcao-de-tese.md` |
| verificar-citacoes | `mentoria-continuada/01-ia-dados/skills/02-verificacao-de-fontes.md` |
| triagem-de-autos | `mentoria-continuada/01-ia-dados/skills/03-resumo-e-triagem-de-autos.md` |
| revisar-contrato | `mentoria-continuada/segmentos/01-civil.md` e FW-04/FW-05 de `mentoria-continuada/recursos/frameworks-de-decisao.md` |
| matriz-de-risco | FW-01 do mesmo arquivo de frameworks |
| redigir-documento-juridico | `mentoria-continuada/01-ia-dados/skills/04-redacao-assistida.md` |
| anonimizar | `mentoria-continuada/01-ia-dados/skills/06-etica-e-confidencialidade.md` e `treinamento-agentes-ia/ROTEIRO.md` §5.5 |
| auditar-peca e integridade | `integridade-informacional/ARQUITETURA-E-PLANO.md` v0.5, especialmente §§2–4 |
| consultar-comunicacoes | §4.6 da mesma arquitetura, validada contra Swagger atual do DJEN |
| Ferramentas MCP | [Pesquisa fornecida](deep-research-report.md), reavaliada nos contratos oficiais listados na [matriz](fontes-oficiais.md) |
| Rituais Landin | [E-book original](ebook-escritorio-landin.pdf), com rastreamento por página em [incorporação Landin](landin-incorporacao.md) |

O conteúdo de estratégia foi lido no estado de trabalho disponível, baseado
no commit `2c37e5912405066da0364f0a714fa8bd8c73eb2b`, incluindo material ainda não
commitado. Não é apresentado como cópia integral de uma versão publicada.

## Adaptações deliberadas

- Os exercícios e protocolos da mentoria viraram instruções executáveis de
  skills, com entregas locais e acionamento direto no Codex.
- A governança CodeSDD, aprovações por alçada, registros de features e cadências
  obrigatórias não foram importados, conforme determinação do usuário.
- Pontuações de risco permanecem método explicável, sem porcentagens de êxito
  inventadas ou encaminhamento automático a sócios.
- Faixas de negociação do segmento civil não viraram requisitos legais.
  Ausência de ata notarial/testemunha não foi convertida em invalidade universal.
- A arquitetura Lastro fornece taxonomia e declaração de cobertura, sem alegar
  que o plugin possui detectores jurídicos certificados ou precisão medida.
- A pesquisa de fontes contém citações internas de outra sessão. Elas não são
  tratadas como referências recuperáveis: contratos usados foram conferidos
  novamente em fontes oficiais. APIs não demonstradas permanecem não integradas.
- Métodos Landin permanecem identificáveis, com exemplos pessoais transformados
  em placeholders nas referências reutilizáveis.

Estas referências são metodológicas. Normas, teses, vigência e consequências
para cada caso precisam ser conferidas em fontes oficiais na tarefa concreta.
