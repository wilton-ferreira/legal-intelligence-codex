# Instalação no Codex

Requisitos: **Node.js 22 ou superior** no PATH e uma versão do Codex com suporte
a plugins locais/marketplaces. O pacote já contém o servidor MCP compilado:
quem instala não precisa de npm, TypeScript, Python, Bash ou chave OpenAI.

## Instalação pelo GitHub

No terminal, execute os dois comandos, em qualquer diretório:

```text
codex plugin marketplace add wilton-ferreira/legal-intelligence-codex
codex plugin add legal-intelligence-codex@legal-intelligence-brasil
```

No Windows, use PowerShell; no macOS ou Linux, o terminal habitual. Esses
comandos alteram a configuração do Codex **quando você os executa**. O projeto
não instala a si próprio ao compilar, testar ou gerar o pacote.

Abra uma nova tarefa depois da instalação para carregar habilidades e MCP.
Procure “Legal Intelligence Codex” na área de plugins da superfície compatível
ou mencione uma habilidade pelo nome. No CLI, `/skills` abre a seleção e `$`
permite mencionar uma habilidade. Não existem aliases personalizados como
`/inicial processo` neste pacote. Exemplos efetivos:

```text
Use $landin-iniciar-processo para organizar o caso na pasta indicada.
Use $landin-revisar-processos para revisar todos os processos desta pasta e produzir versões melhoradas.
Use $verificar-citacoes para conferir as referências desta peça.
```

Informe o caminho real conforme o sistema: `C:\Casos\Cliente A` no Windows ou
`/caminho/Casos/Cliente A` no macOS/Linux. Caminhos com espaços e Unicode são
suportados; não cole esses exemplos como se fossem diretórios já existentes.

## Instalação pelo ZIP

Baixe o ZIP da release e extraia para uma pasta permanente. Ela deve conter
`.agents/plugins/marketplace.json` e `plugins/legal-intelligence-codex/`.
No terminal, dentro dessa pasta extraída, execute:

```text
codex plugin marketplace add .
codex plugin add legal-intelligence-codex@legal-intelligence-brasil
```

Use **uma** das formas de instalação. O nome do marketplace é o mesmo; não
cadastre simultaneamente origens diferentes com esse nome.

## DataJud opcional

As outras fontes e as habilidades não precisam de chave. Para DataJud, consulte
a [página de acesso do CNJ](https://datajud-wiki.cnj.jus.br/api-publica/acesso/)
e os [termos oficiais](https://datajud-wiki.cnj.jus.br/api-publica/termo-uso/).
Defina `DATAJUD_API_KEY` no ambiente do processo que inicia o Codex; não inclua
a chave no repositório, prompt, manifesto ou argumento da linha de comando.

macOS/Linux, na sessão de terminal que iniciará o Codex:

```sh
export DATAJUD_API_KEY="SUA_CHAVE_OBTIDA_NO_CNJ"
codex
```

Windows PowerShell:

```powershell
$env:DATAJUD_API_KEY = "SUA_CHAVE_OBTIDA_NO_CNJ"
codex
```

Os valores acima são placeholders. Uma janela do aplicativo já aberta não
herda variáveis definidas posteriormente em outro terminal. Configure o ambiente
de inicialização usado pela sua instalação. `.env.example` é só um exemplo;
o servidor não carrega arquivos `.env` automaticamente.

## Superfícies e diagnóstico

O servidor usa MCP por stdio e resolve `cwd: "."` a partir da raiz instalada
do plugin. O bundle não depende de caminhos deste repositório ou de
`node_modules`. O Node precisa estar acessível ao processo do Codex.

Compatibilidade do MCP com um sistema operacional não significa disponibilidade
de todas as interfaces desktop do Codex nesse sistema. Use uma superfície
disponível com suporte a plugins; consulte a documentação oficial para sua
versão. Em clientes só com MCP, configure `node` com caminho absoluto para
`mcp/server.bundle.mjs`: isso conecta as ferramentas, mas não instala as skills.

Se o plugin não aparecer, confira `codex plugin list`, o marketplace, a versão
do Codex e abra uma nova tarefa. Se o MCP não iniciar, confira `node --version`
e a presença do bundle. Falta de chave DataJud ou bloqueio de uma fonte não
impede o servidor de iniciar. Se uma fonte retornar bloqueio interativo, use
seu portal oficial com os recursos disponíveis, sem contornar o bloqueio.

Para atualizar uma instalação vinda do GitHub:

```text
codex plugin marketplace upgrade legal-intelligence-brasil
codex plugin add legal-intelligence-codex@legal-intelligence-brasil
```

Depois, abra uma nova tarefa. Alterações de código no checkout não atualizam
automaticamente uma cópia instalada.

Referências conferidas: [skills e acionamento](https://learn.chatgpt.com/docs/build-skills),
[marketplaces e empacotamento](https://developers.openai.com/plugins/build/plugins),
[MCP stdio, cwd e variáveis de ambiente](https://developers.openai.com/api/docs/guides/agents-api/tools/plugins).
