# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2024-XX-XX

### Adicionado
- Implementação inicial do visual Filtro Personalizado para Power BI
- Funcionalidade de busca em tempo real com filtro "contains"
- Suporte a seleção única e múltipla de valores
- Navegação completa por teclado (ArrowUp, ArrowDown, Enter, Escape)
- 13 propriedades de formatação customizáveis no painel do Power BI:
  - Mostrar/ocultar ícone de busca
  - Placeholder personalizável
  - Altura e dimensões da borda
  - Famílias de fonte para input e dropdown
  - Tamanho da fonte
  - Cores de foco, hover e label
  - Opacidade do hover
  - Toggle para seleção múltipla
- Cross-filtering e cross-highlighting integrados com Power BI
- Debouncing automático para otimização de performance (200ms)
- Limite de renderização de 500 itens para grandes datasets
- Tratamento de erros em operações críticas
- Estados vazios com mensagens claras em português
- Feedback visual para estados active, hover e focus
- Sincronização automática com filtros externos do relatório
- Cleanup adequado de event listeners no destroy()
- Acessibilidade básica com atributos ARIA

### Melhorado
- Tipagem TypeScript com strict mode habilitado
- Estrutura de código modular e bem documentada
- Performance otimizada para até 1000+ itens
- Compatibilidade com temas do Power BI

### Segurança
- Sem dependências externas de terceiros
- Validação de limites para propriedades numéricas
- Uso consistente de null checks e optional chaining
- Tratamento de erros com try/catch em funções críticas

### Documentação
- README.md completo em português com guia de uso
- Instruções de instalação detalhadas
- Cenários de uso recomendados
- Dicas de performance e solução de problemas
- Guia de desenvolvimento e build

---

## [Unreleased]

### Em Desenvolvimento
- Suporte a internacionalização (i18n) para múltiplos idiomas
- Detecção automática de tema de alto contraste
- Virtual scrolling para listas com 10.000+ itens
- Suite de testes unitários
- Melhorias de acessibilidade para screen readers
- Analytics de uso opcional com consentimento
