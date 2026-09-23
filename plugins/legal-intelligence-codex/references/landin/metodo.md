# Método documental do Escritório Landin

Fonte: *Escritório Landin - Codex App no contexto jurídico*, edição 1.0,
Marcio de Oliveira Landin, [PDF original](../../docs/ebook-escritorio-landin.pdf),
p. 2-9, 17 e 19. Os números correspondem às páginas do PDF e aos rodapés.
Este material descreve práticas do escritório, não uma fonte de direito vigente.
As adaptações para este plugin constam em [incorporação](../../docs/landin-incorporacao.md).

## Aplicação direta

Aproveite processo, parte representada, finalidade, documentos, jurisdição e data
de referência já informados. Pergunte apenas pelo que altera materialmente a
análise; prossiga com as partes independentes. Leitura, pesquisa pública oficial,
análise e redação abrangidas pelo pedido não exigem confirmações por fase.
Respeite eventual pedido expresso para trabalhar somente com documentos locais.

Antes de redigir, conheça as provas que sustentam o texto. Isso é uma dependência
técnica, não uma etapa formal de aprovação. Quando já existir uma matriz confiável,
reaproveite-a e confira os trechos utilizados. Não alegue leitura integral de autos
se houver páginas, anexos, imagens ou volumes não examinados. Registre cobertura,
ilegibilidade e peças ausentes; OCR incerto não comprova o conteúdo.

Separe fonte do relato e prova do acontecimento: uma petição comprova que a parte
fez uma alegação, não necessariamente que o fato alegado ocorreu. Contradições
devem permanecer visíveis, mesmo quando prejudicam a tese representada.

## Matriz de fatos e provas (p. 7-9)

| Fato ou alegação | Quem o afirma | Documento e página/evento | O que o documento sustenta | Estado | Contradição ou lacuna |
| --- | --- | --- | --- | --- | --- |
| [DESCRIÇÃO] | [ORIGEM DO RELATO] | [ARQUIVO, PÁGINA/ID] | [EVIDÊNCIA LOCALIZADA] | [documentado / alegado / contraditório / não localizado] | [PENDÊNCIA] |

Use os marcadores de busca do escritório quando cabíveis:

- `[INFORMACAO NAO LOCALIZADA]`: não encontrado no material efetivamente examinado.
- `[FATO SEM PROVA IDENTIFICADA]`: alegação sem suporte localizado; não afirma falsidade.
- `[JURISPRUDENCIA A VERIFICAR]`: referência ainda não conferida no documento oficial.
- `[FONTE OFICIAL NAO VERIFICADA]`: origem ou conteúdo oficial não confirmado.
- `[CENARIO HIPOTETICO]`: interpretação ou possibilidade estratégica, nunca fato.

## Prompt de preparação e controle (p. 7-9, adaptado)

```text
Use o método Landin para analisar [PROCESSO/IDENTIFICADOR INTERNO], representando
[PARTE OU CÓDIGO], com a finalidade [OBJETIVO], em [ÓRGÃO/JURISDIÇÃO], na data de
referência [DATA]. Documentos: [ARQUIVOS/DIRETÓRIO]. Restrições de pesquisa: [LIMITES].

Leia os documentos disponíveis e indique a cobertura real, as páginas ilegíveis
e os anexos ausentes. Produza cronologia e matriz de fatos/provas, distinguindo
alegação, suporte documental, contradição e inferência. Para cada fato utilizável,
cite arquivo e página/evento. Não complete nomes, datas, valores ou acontecimentos.

Verifique em fontes públicas oficiais os fundamentos externos necessários ao
pedido, respeitando os limites informados. Marque referências não confirmadas.
Resultado de busca não equivale a inteiro teor conferido. Uma decisão isolada
não demonstra a situação atual de um precedente.

Se o pedido incluir redação, produza a minuta após a análise documental, usando
somente fatos com suporte identificado e fundamentos efetivamente conferidos.
Campos ausentes ficam explícitos. Entregue também fontes, lacunas, contradições
e pontos que dependem de julgamento profissional. Não assine nem protocole.
```

## Registro de fonte oficial (p. 17)

Registre órgão, título, identificador, URL oficial, instante da consulta,
data do ato/julgamento/publicação quando disponível, trecho e página/item,
aderência ao fato documentado e estado da verificação. Preserve hash quando
um documento for obtido por ferramenta que o forneça. Não invente hash ou datas
ausentes. Diferencie `origem confirmada`, `conteúdo consultado` e
`situação jurídica não verificada`; não reduza essas dimensões a um único
carimbo de "validado". Use o contrato de [ferramentas](../ferramentas.md).

## Fechamento proporcional à entrega (p. 6 e 19)

Informe cobertura da leitura, fatos utilizados, provas/localizadores, fontes
consultadas, referências pendentes, hipóteses e lacunas que afetam o resultado.
Em minutas, registre "minuta para revisão profissional" sem bloquear a entrega
ou criar aprovação de governança. Não declare aprovação humana que não ocorreu.

Competência, instrumento, admissibilidade, prazos e pedidos precisam de contexto
e fonte aplicável. Não derive prazo apenas da data de publicação ou movimento.
A verificação constitucional do e-book significa conferir dispositivos
pertinentes quando necessários à tese; não exige capítulo constitucional
decorativo nem permite afirmar adequação geral à Constituição.

## Privacidade (p. 6)

Minimize CPF, endereços e dados de saúde em matrizes e cópias auxiliares. Use
`[PARTE]`, `[CPF]`, `[ENDEREÇO]`, `[DADO DE SAÚDE]` nos modelos reutilizáveis.
Pesquisa pública oficial não autoriza enviar autos ou dados sigilosos a serviços
externos. A criação de uma minuta não autoriza compartilhar, assinar ou protocolar.
