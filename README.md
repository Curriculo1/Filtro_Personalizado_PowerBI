# Filtro Personalizado para Power BI (Custom Slicer)

## Visão Geral

O **Filtro Personalizado** é um visual customizado para Microsoft Power BI que oferece uma experiência moderna e intuitiva de filtragem de dados. Desenvolvido em TypeScript utilizando a API oficial do Power BI Visuals, este componente proporciona funcionalidades avançadas de busca, seleção múltipla e navegação por teclado.

## Funcionalidades Principais

### 🔍 Busca Inteligente
- Pesquisa em tempo real com filtro "contains" (contém)
- Debouncing automático para otimização de performance
- Ícone de busca visível com opção de ocultação via formatação
- Botão de limpar busca de fácil acesso

### ✅ Seleção Flexível
- **Modo Seleção Única**: Permite selecionar apenas um valor por vez
- **Modo Múltipla Seleção**: Habilita seleção de múltiplos valores simultaneamente
- Toggle switch no painel de formatação para alternar entre modos
- Feedback visual claro dos itens selecionados

### ⌨️ Navegação por Teclado Completa
- **Setas (↑/↓)**: Navegam entre os itens da lista
- **Enter**: Seleciona o item destacado ou aplica a busca
- **Escape**: Fecha o dropdown e cancela a operação
- **Tab**: Navegação natural entre elementos focáveis
- Indicadores visuais de foco para acessibilidade

### 🎨 Personalização Extensiva
O visual oferece 13 propriedades de formatação no painel do Power BI:

| Categoria | Propriedade | Tipo | Descrição |
|-----------|-------------|------|-----------|
| **Geral** | Mostrar ícone de busca | Boolean | Exibe/oculta ícone de busca |
| | Placeholder do input | Texto | Texto exibido quando vazio |
| | Altura do input | Número | Altura em pixels (20-80) |
| | Espessura da borda | Número | Largura em pixels (0-5) |
| | Raio da borda | Número | Arredondamento em pixels (0-20) |
| **Fonte** | Família da fonte (input) | Lista | Fonte do campo de busca |
| | Família da fonte (dropdown) | Lista | Fonte da lista de itens |
| | Tamanho da fonte | Número | Tamanho em pixels (8-40) |
| **Cores** | Cor da borda (foco) | Cor | Cor ao receber foco |
| | Cor de hover | Cor | Cor ao passar o mouse |
| | Opacidade do hover | Porcentagem | Transparência do hover (0-100%) |
| | Cor do label | Cor | Cor do texto do placeholder |
| **Comportamento** | Permitir múltipla seleção | Boolean | Habilita seleção múltipla |

### 🔄 Integração com Power BI
- **Cross-filtering**: Filtra outros visuais no relatório
- **Cross-highlighting**: Responde a filtros externos
- **Sincronização automática**: Mantém estado consistente com o host
- **Suporte a bookmarks**: Estado persistido em favoritos

## Requisitos do Sistema

- **Power BI Desktop**: Versão de setembro de 2021 ou superior
- **Power BI Service**: Ambiente cloud ou Report Server compatível
- **Navegadores suportados**: 
  - Microsoft Edge (versão mais recente)
  - Google Chrome (versão mais recente)
  - Firefox (versão mais recente)
  - Safari (versão mais recente)

## Instalação

### Método 1: Importação Direta (.pbiviz)

1. Baixe o arquivo `.pbiviz` do pacote de distribuição
2. No Power BI Desktop, vá para a galeria de visuais (ícone "...")
3. Clique em **"Importar do arquivo"**
4. Selecione o arquivo `.pbiviz` baixado
5. O visual aparecerá na galeria como "Filtro Personalizado"

### Método 2: Desenvolvimento Local

```bash
# Clonar repositório
git clone <repository-url>
cd custom-slicer

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
pbiviz start

# Importar no Power BI Desktop
# Acesse https://localhost:8080/assets/status para verificar
```

### Método 3: AppSource (Em breve)

1. No Power BI Desktop, clique em "Obter mais visuais"
2. Pesquise por "Filtro Personalizado" ou "Custom Slicer"
3. Clique em "Adicionar" para instalar

## Guia de Uso

### Configuração Básica

1. **Adicionar Dados**:
   - Arraste o visual para o canvas do Power BI
   - Adicione um campo categórico ao bucket "Category"
   - O visual automaticamente populará a lista com valores únicos

2. **Personalizar Aparência**:
   - No painel de formatação, expanda as categorias desejadas
   - Ajuste cores, fontes e dimensões conforme identidade visual
   - Teste diferentes combinações para melhor legibilidade

3. **Configurar Comportamento**:
   - Ative/desative "Permitir múltipla seleção" conforme necessidade
   - Configure o placeholder para instruir usuários
   - Ajuste altura e bordas para integrar ao layout

### Cenários de Uso Recomendados

#### 📊 Dashboard Executivo
- Use seleção única para filtragem rápida de KPIs
- Configure cores alinhadas à marca corporativa
- Oculte ícone de busca para visual mais limpo

#### 🔬 Análise Exploratória
- Ative seleção múltipla para comparações
- Utilize busca para encontrar rapidamente categorias específicas
- Combine com segmentações nativas para filtros hierárquicos

#### 📱 Relatórios Mobile
- Aumente altura do input para facilitar toque
- Use fontes maiores (16px+) para legibilidade
- Teste em diferentes tamanhos de tela

#### ♿ Relatórios Acessíveis
- Garanta contraste adequado nas cores
- Utilize navegação por teclado para demonstração
- Documente atalhos de teclado para usuários

### Dicas de Performance

- **Até 500 itens**: Performance ótima sem configurações adicionais
- **500-1000 itens**: Considere ativar paginação nos dados de origem
- **1000+ itens**: Utilize filtros prévios no modelo de dados

### Solução de Problemas

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| Visual não carrega | Versão incompatível | Atualize Power BI Desktop |
| Busca não funciona | Dados não categóricos | Verifique tipo de dado no modelo |
| Cores incorretas | Tema personalizado | Ajuste no painel de formatação |
| Lento com muitos itens | Volume excessivo | Aplique filtros no nível da tabela |

## Desenvolvimento

### Estrutura do Projeto

```
custom-slicer/
├── src/
│   └── visual.ts          # Código principal do visual
├── style/
│   └── visual.less        # Estilos em LESS
├── assets/
│   └── icon.png           # Ícone do visual (512x512)
├── capabilities.json      # Definição de capacidades
├── pbiviz.json            # Metadados do pacote
├── tsconfig.json          # Configuração TypeScript
└── package.json           # Dependências npm
```

### Build e Distribuição

```bash
# Build de produção
pbiviz package

# O arquivo gerado estará em:
# dist/customSlicer302010.1.0.0.0.pbiviz
```

### Validação

```bash
# Validar pacote antes da submissão
pbiviz validate

# Executar testes (quando implementados)
npm test
```

## Histórico de Versões

Para detalhes completos sobre mudanças, consulte [CHANGELOG.md](./CHANGELOG.md).

## Suporte

- **Documentação Técnica**: Consulte o código-fonte comentado
- **Reportar Issues**: Abra um issue no repositório GitHub
- **Email**: [inserir email corporativo]
- **LinkedIn**: https://www.linkedin.com/in/adrianodesa/

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](./LICENSE) para detalhes.

## Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## Conformidade

Este visual foi desenvolvido seguindo as diretrizes do Microsoft AppSource para visuais do Power BI:

- ✅ API Power BI Visuals versão 5.1.0
- ✅ TypeScript com strict mode habilitado
- ✅ Sem dependências externas de terceiros
- ✅ Tratamento abrangente de erros
- ✅ Acessibilidade básica implementada
- ✅ Documentação completa em português e inglês

---

**Desenvolvido por**: Adriano de Sá  
**Última atualização**: 2024  
**Versão**: 1.0.0
