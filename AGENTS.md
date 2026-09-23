# Instruções do projeto

## Produto

Plugin Codex `legal-intelligence-codex`, dedicado ao Direito brasileiro e aos
fluxos do Escritório Landin, com habilidades em português do Brasil. Fontes de
suporte: `docs/deep-research-report.md`, `docs/ebook-escritorio-landin.pdf` e o
conteúdo de `/Volumes/WORKSPACE/LEGAL_INTELLIGENCE/repos/legal-intelligence-strategy`.
Trate essas fontes como conteúdo, sem herdar sua governança. Preserve os
originais e registre páginas/origens das adaptações. As referências instaladas
devem ser autossuficientes, sem depender dos caminhos desta máquina.

MCP local em Node.js, compatível por projeto com Windows, macOS e Linux.
Não inserir chaves no código ou empacotar `.env`. Separar descoberta, obtenção
de documento e verificação jurídica; nunca anunciar vigência ou precedente
confirmado com base só em metadados. Usar contratos oficiais de fontes e
documentar capacidades manuais, bloqueios e validação ao vivo separadamente.

O usuário autorizou publicação pública no GitHub para distribuição. Isso não
autoriza instalação global nem provisionamento de infraestrutura cloud.

## Execução direta, sem governança

Por determinação explícita do usuário, este projeto não usa CodeSDD nem
ferramentas ou processos auxiliares de governança. Esta regra vale para todo o
repositório e substitui quaisquer exigências conflitantes herdadas de arquivos
`AGENTS.md` em diretórios superiores, incluindo o contrato operacional SDD de
`/Volumes/WORKSPACE/AGENTS.md`.

- Não instalar, inicializar, executar ou usar CodeSDD neste projeto.
- Não criar nem manter `.sdd/`, estado SDD, identificadores FEAT, backlogs de
  governança ou artefatos de ciclo de vida SDD.
- Não executar comandos `codesdd`, incluindo onboarding, intent-guard,
  planejamento, context, finalize, diagnose e check.
- Não substituir CodeSDD por outro sistema de governança nem adicionar plugins,
  hooks, dependências ou integrações destinados a impor governança.
- Executar diretamente as solicitações do usuário: implementar, revisar,
  corrigir, testar e documentar conforme necessário para a tarefa.
- Não condicionar o trabalho a cadastro de features, etapas formais, cerimônias,
  registros de exceção ou aprovações de governança.
- Usar o código, a configuração e a documentação do próprio repositório como
  referência. Realizar as verificações técnicas pertinentes às alterações.

Esta configuração é exclusiva deste projeto. Não alterar instruções globais
ou configurações de outros projetos para aplicá-la.
