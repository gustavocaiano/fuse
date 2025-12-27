# Abordagem PRISMA para LRRQ1 - Guia de Planeamento

## Objetivo
Este documento serve como guia de planeamento para a execução da revisão sistemática seguindo o protocolo PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) para a LRRQ1.

---

## 1. Estrutura do Processo PRISMA

### Fase 1: Identificação (Identification)

#### 1.1 Bases de Dados a Consultar
- **ACM Digital Library** (ACM DL)
- **ScienceDirect**
- **IEEE Xplore**
- **Outras fontes relevantes** (Google Scholar, arXiv, etc.)

#### 1.2 Estratégia de Pesquisa
**Keywords principais** (baseadas na tabela PICOCS):
- `IoT Interoperability`
- `Hardware Abstraction Layer`
- `Middleware patterns`
- `ONVIF standardization`
- `Heterogeneous device integration`
- `Software Architecture`
- `Abstraction Layer`
- `Design Patterns`

**Combinações de pesquisa sugeridas:**
- `(IoT OR "Internet of Things") AND (interoperability OR heterogeneous) AND (abstraction OR middleware)`
- `(CCTV OR surveillance) AND (integration OR abstraction) AND (architecture OR framework)`
- `("Hardware Abstraction Layer" OR HAL) AND (IoT OR devices)`
- `ONVIF AND (integration OR standardization)`

#### 1.3 Critérios de Inclusão/Exclusão (I/E)
**Inclusão:**
- Estudos publicados a partir de 2018
- Estudos que abordem heterogeneidade de dispositivos
- Arquiteturas de software, middleware ou camadas de abstração
- Estudos de caso ou propostas de arquitetura
- Contexto académico ou industrial

**Exclusão:**
- Estudos anteriores a 2018
- Soluções proprietárias fechadas sem documentação técnica
- Estudos puramente teóricos sem aplicação prática
- Opiniões sem validação

---

### Fase 2: Screening (Triagem)

#### 2.1 Remoção de Duplicados
- **Ferramentas sugeridas:**
  - EndNote (gestão de referências)
  - Zotero (gestão de referências)
  - Mendeley (gestão de referências)
  - Excel/Google Sheets (análise manual)

#### 2.2 Triagem por Título e Resumo
- Ler títulos e resumos
- Aplicar critérios I/E
- Marcar registos como: **Incluir**, **Excluir**, **Dúvida**

#### 2.3 Critérios de Exclusão na Triagem
- Não relacionado com IoT/CCTV
- Não aborda heterogeneidade
- Não apresenta arquitetura/middleware
- Anterior a 2018
- Solução proprietária fechada

---

### Fase 3: Elegibilidade (Eligibility)

#### 3.1 Leitura Completa dos Artigos
- Obter texto completo dos artigos selecionados
- Ler artigos completos
- Verificar se cumprem todos os critérios

#### 3.2 Critérios de Exclusão na Elegibilidade
- Falta de informação sobre arquitetura proposta
- Não apresenta validação prática
- Não aborda interoperabilidade
- Solução muito específica sem generalização

---

### Fase 4: Inclusão (Included)

#### 4.1 Artigos Finais
- Lista final de artigos incluídos na revisão
- Extrair informações relevantes:
  - Arquitetura proposta
  - Padrões de design utilizados
  - Resultados/validação
  - Limitações identificadas

---

## 2. Ferramentas e Automação

### 2.1 Gestão de Referências
**Ferramentas recomendadas:**
- **Zotero** (gratuito, open-source)
  - Extensão para navegador
  - Exportação para BibTeX
  - Remoção automática de duplicados
- **Mendeley** (gratuito)
  - Similar ao Zotero
  - Integração com Word
- **EndNote** (pago, mas pode ter licença académica)

### 2.2 Automação Parcial Possível

#### Scripts Python para Ajudar:
1. **Web Scraping de Bases de Dados**
   - ⚠️ **Atenção:** Verificar termos de serviço das bases de dados
   - Algumas bases permitem API (ex: IEEE Xplore API)
   - Pode ser útil para exportar resultados de pesquisa

2. **Análise de Duplicados**
   ```python
   # Exemplo conceptual - não implementar sem verificar TOS
   # Comparar títulos, autores, anos
   # Usar bibliotecas como pandas, difflib
   ```

3. **Extração de Metadados**
   - Exportar resultados para CSV
   - Processar com pandas
   - Filtrar por critérios I/E

#### Ferramentas de Análise de Texto:
- **NVivo** (análise qualitativa - pago)
- **ATLAS.ti** (análise qualitativa - pago)
- **Excel/Google Sheets** (análise quantitativa básica)

### 2.3 Diagrama PRISMA
**Ferramentas para criar o diagrama:**
- **Lucidchart** (online, pago/gratuito)
- **Draw.io** (online, gratuito)
- **PowerPoint/Google Slides** (manual)
- **LaTeX com TikZ** (para integração no documento)

**Template PRISMA:**
- Disponível em: http://www.prisma-statement.org/
- Pode usar o template oficial e adaptar

---

## 3. Estratégia de Execução

### 3.1 Planeamento Temporal
1. **Semana 1-2:** Definição de keywords e estratégias de pesquisa
2. **Semana 2-3:** Execução de pesquisas nas bases de dados
3. **Semana 3-4:** Remoção de duplicados e triagem inicial
4. **Semana 4-5:** Leitura completa e avaliação de elegibilidade
5. **Semana 5-6:** Extração de dados e síntese

### 3.2 Registos a Manter
**Ficheiro Excel/Sheets com colunas:**
- ID do registo
- Título
- Autores
- Ano
- Base de dados
- URL/DOI
- Status (Identificado/Triado/Elegível/Incluído/Excluído)
- Razão de exclusão (se aplicável)
- Notas

### 3.3 Rastreabilidade
- Guardar todas as queries de pesquisa
- Guardar datas de pesquisa
- Guardar número de resultados por query
- Documentar decisões de inclusão/exclusão

---

## 4. Métricas e Números Esperados

### 4.1 Baseado no Exemplo Fornecido
- **Identificação:** ~200-300 registos iniciais
- **Após remoção de duplicados:** ~240 registos
- **Após triagem:** ~50-60 registos
- **Após elegibilidade:** ~10-15 artigos finais

### 4.2 Ajustes para LRRQ1
- Pode variar consoante a especificidade da pesquisa
- IoT + CCTV pode ter menos resultados que OCR
- Focar em qualidade vs quantidade

---

## 5. Desafios e Considerações

### 5.1 Desafios Antecipados
- **Heterogeneidade de terminologia:** IoT, Smart Devices, Embedded Systems
- **Poucos estudos específicos para CCTV:** Pode precisar de generalizar
- **Soluções proprietárias:** Difícil obter informação técnica
- **Qualidade vs Quantidade:** Melhor ter menos artigos de qualidade

### 5.2 Estratégias de Mitigação
- Usar sinónimos e variações de termos
- Incluir estudos de domínios relacionados (IoT geral)
- Focar em arquiteturas genéricas aplicáveis a CCTV
- Priorizar artigos com validação prática

---

## 6. Checklist de Execução

### Antes de Começar:
- [ ] Definir keywords finais baseadas na tabela PICOCS
- [ ] Criar ficheiro de registos (Excel/Sheets)
- [ ] Configurar ferramenta de gestão de referências
- [ ] Preparar template para extração de dados

### Durante a Pesquisa:
- [ ] Executar queries em todas as bases de dados
- [ ] Exportar resultados para gestor de referências
- [ ] Remover duplicados
- [ ] Documentar número de resultados por query

### Durante a Triagem:
- [ ] Aplicar critérios I/E consistentemente
- [ ] Documentar razões de exclusão
- [ ] Manter registo de decisões

### Durante a Elegibilidade:
- [ ] Obter textos completos
- [ ] Ler artigos completos
- [ ] Extrair informações relevantes
- [ ] Validar critérios finais

### Após Inclusão:
- [ ] Criar diagrama PRISMA
- [ ] Sintetizar resultados
- [ ] Preparar discussão

---

## 7. Recursos Úteis

### Documentação PRISMA:
- Website oficial: http://www.prisma-statement.org/
- Template PRISMA 2020: http://www.prisma-statement.org/PRISMAStatement/Checklist
- Extensão para diagramas: http://www.prisma-statement.org/Extensions/

### Tutoriais:
- "How to do a systematic review" (vários disponíveis online)
- "PRISMA flow diagram tutorial"

### Exemplos de Revisões Sistemáticas:
- Procurar em bases de dados por "systematic review" + área relacionada
- Analisar como outros estudos estruturaram o processo

---

## 8. Notas Finais

Este guia deve ser adaptado conforme a pesquisa avança. É normal ajustar keywords e critérios após uma primeira iteração. O importante é manter a rastreabilidade e documentar todas as decisões.

**Lembrete:** O objetivo não é ter o maior número de artigos, mas sim ter os artigos mais relevantes e de qualidade para responder à LRRQ1.


