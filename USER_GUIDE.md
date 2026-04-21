# USER_GUIDE.md - Guia do Usuário

## Filtro Personalizado para Power BI

### Versão 1.0.0

---

## Índice

1. [Introdução](#introdução)
2. [Instalação](#instalação)
3. [Configuração Inicial](#configuração-inicial)
4. [Funcionalidades](#funcionalidades)
5. [Personalização](#personalização)
6. [Dicas de Uso](#dicas-de-uso)
7. [Perguntas Frequentes](#perguntas-frequentes)

---

## Introdução

O **Filtro Personalizado** é um visual customizado para Microsoft Power BI que oferece uma experiência moderna e intuitiva de filtragem de dados. Ideal para substituir segmentações nativas quando você precisa de mais controle sobre a aparência e comportamento.

### Quando Usar

✅ **Use este visual quando:**
- Precisar de busca em tempo real nos dados
- Quiser personalizar cores, fontes e dimensões
- Necessitar de navegação por teclado completa
- Desejar controle fino sobre seleção única ou múltipla

❌ **Não use quando:**
- Trabalhar com dados hierárquicos (use segmentação nativa)
- Precisar de filtros de data específicos (use calendário)
- Os dados tiverem menos de 5 itens (segmentação nativa é suficiente)

---

## Instalação

### Pré-requisitos

- Power BI Desktop (versão setembro/2021 ou superior)
- Permissões para importar visuais customizados
- Dados categóricos no modelo (texto, números inteiros)

### Passo a Passo

1. **Baixar o Arquivo**
   - Obtenha o arquivo `.pbiviz` do fornecedor
   - Salve em local acessível no seu computador

2. **Importar no Power BI**
   - Abra o Power BI Desktop
   - No painel de visualizações, clique nos três pontos (...)
   - Selecione "Importar do arquivo"
   - Navegue até o arquivo `.pbiviz` e clique em Abrir
   - Confirme a importação quando solicitado

3. **Verificar Instalação**
   - O ícone do "Filtro Personalizado" aparecerá na galeria
   - Passe o mouse para ver o nome do visual

---

## Configuração Inicial

### 1. Adicionar ao Relatório

1. Clique no ícone do visual na galeria
2. Um placeholder será adicionado ao canvas
3. Redimensione conforme necessário (mínimo: 200x150px)

### 2. Conectar Dados

1. No painel de campos, expanda sua tabela
2. Arraste um campo categórico para o bucket **"Category"**
3. O visual automaticamente listará os valores únicos

### 3. Testar Funcionamento

1. Clique no campo de busca
2. Digite parte de um valor conhecido
3. Verifique se a lista filtra corretamente
4. Clique em um item para aplicar o filtro

---

## Funcionalidades

### 🔍 Busca Inteligente

**Como usar:**
1. Clique no campo de input
2. Digite qualquer texto
3. A lista filtra automaticamente enquanto digita
4. Use o botão "x" para limpar a busca

**Comportamento:**
- Busca do tipo "contém" (case-insensitive)
- Atualização automática após 200ms sem digitar
- Mensagem "Nenhum resultado" quando não há matches

### ✅ Seleção Única vs. Múltipla

**Seleção Única (Padrão):**
- Apenas um valor selecionado por vez
- Novo selection substitui o anterior
- Ideal para filtros exclusivos

**Seleção Múltipla:**
- Múltiplos valores podem ser selecionados
- Cada clique alterna (seleciona/desseleciona)
- Ideal para comparações e análises combinadas

**Como alternar:**
1. Selecione o visual
2. No painel de formatação, expanda "Comportamento"
3. Ative/desative "Permitir múltipla seleção"

### ⌨️ Navegação por Teclado

| Tecla | Ação |
|-------|------|
| `↓` (Seta Baixo) | Move destaque para próximo item |
| `↑` (Seta Cima) | Move destaque para item anterior |
| `Enter` | Seleciona item destacado / Aplica busca |
| `Escape` | Fecha dropdown / Cancela operação |
| `Tab` | Move foco para próximo elemento |

**Dica:** Pressione `Tab` até focar no input, então use as setas para navegar sem mouse.

---

## Personalização

Acesse o painel de **Formatação** (ícone de rolo de pintura) para customizar o visual.

### Geral

| Opção | Descrição | Valores Sugeridos |
|-------|-----------|-------------------|
| Mostrar ícone de busca | Exibe/oculta ícone 🔍 | Ligado (padrão) |
| Placeholder | Texto quando vazio | "Buscar valor" |
| Altura do input | Altura em pixels | 36-48px |
| Espessura da borda | Largura da borda | 1-2px |
| Raio da borda | Arredondamento | 8-12px |

### Fonte

| Opção | Descrição | Opções Comuns |
|-------|-----------|---------------|
| Família (input) | Fonte do campo | Segoe UI, Arial |
| Família (dropdown) | Fonte da lista | Segoe UI, Arial |
| Tamanho | Tamanho em pixels | 12-16px |

### Cores

| Opção | Descrição | Sugestão |
|-------|-----------|----------|
| Cor da borda (foco) | Borda ao receber foco | #7aa7ff (azul) |
| Cor de hover | Fundo ao passar mouse | #eef3fb (claro) |
| Opacidade do hover | Transparência do hover | 100% |
| Cor do label | Cor do placeholder | #1f2937 (cinza) |

### Comportamento

| Opção | Descrição | Recomendação |
|-------|-----------|--------------|
| Permitir múltipla seleção | Habilita seleção múltipla | Desligado (padrão) |

---

## Dicas de Uso

### 📊 Dashboard Executivo

```
Configuração Recomendada:
- Altura: 40px
- Fonte: 14px Segoe UI
- Ícone: Oculto (visual mais limpo)
- Seleção: Única
- Cores: Alinhadas à marca corporativa
```

### 🔬 Análise Exploratória

```
Configuração Recomendada:
- Altura: 36px
- Fonte: 12px
- Ícone: Visível
- Seleção: Múltipla
- Placeholder: "Filtrar por..."
```

### 📱 Relatório Mobile

```
Configuração Recomendada:
- Altura: 48px (facilita toque)
- Fonte: 16px+ (legibilidade)
- Bordas: 2px, raio 12px
- Contraste: Alto
```

### Performance com Grandes Volumes

| Quantidade | Recomendação |
|------------|--------------|
| Até 500 | Sem preocupações |
| 500-1000 | Considere paginação |
| 1000+ | Filtre no modelo de dados |

---

## Perguntas Frequentes

### O visual não carrega. O que fazer?

1. Verifique a versão do Power BI Desktop
2. Atualize para a versão mais recente
3. Tente reimportar o arquivo `.pbiviz`
4. Reinicie o Power BI Desktop

### A busca não retorna resultados

1. Verifique se há dados no campo Category
2. Confirme que o campo é do tipo texto ou inteiro
3. Teste com termos parciais (ex: "aul" para "Paulo")
4. Limpe filtros externos que possam estar restringindo

### As cores não aparecem como esperado

1. Verifique se há tema personalizado aplicado
2. Ajuste as cores no painel de formatação
3. Teste com cores de alto contraste
4. Considere o fundo do visual no relatório

### Posso usar com datas?

Sim, mas com limitações:
- Funciona melhor com colunas de texto formatadas
- Para intervalos, use segmentação de data nativa
- Considere criar coluna calculada texto para anos/meses

### Como compartilhar o relatório com o visual?

**Opção 1 - Publicar no Serviço:**
1. Publique o relatório no Power BI Service
2. O visual será incluído automaticamente
3. Usuários verão normalmente

**Opção 2 - Pacote Organizational:**
1. Contate o administrador do tenant
2. Faça upload do `.pbiviz` no admin center
3. Libere para toda organização

### O visual funciona no mobile?

Sim! O visual é responsivo e funciona em:
- Power BI Mobile (iOS, Android, Windows)
- Navegadores mobile
- Tablets e smartphones

**Recomendação:** Aumente altura e fonte para melhor usabilidade touch.

---

## Suporte

Para dúvidas, problemas ou sugestões:

- **Documentação Técnica**: README.md no repositório
- **Reportar Issues**: GitHub do projeto
- **Email**: [inserir email corporativo]
- **LinkedIn**: https://www.linkedin.com/in/adrianodesa/

---

## Histórico de Versões

Consulte [CHANGELOG.md](./CHANGELOG.md) para detalhes de cada versão.

---

**Última atualização**: 2024  
**Versão do documento**: 1.0  
**Idioma**: Português (Brasil)
