---
name: academic-writing
description: Redação académica, metodologia de investigação e fluxos de comunicação científica. Utilizar ao escrever artigos, revisões da literatura, propostas de financiamento, ao realizar investigação, gerir citações, preparar revisão por pares, escolher vias de acesso aberto ao abrigo do Plan S / Memorando Nelson OSTP de 2026, publicar preprints, trabalhar com identificadores persistentes (ORCID, DOI, ROR), atribuir funções de contribuidor CRediT, pré-registar análises no OSF / AsPredicted, ou divulgar o uso de LLMs a revistas e financiadores. Essencial para investigadores, estudantes de mestrado e doutoramento e académicos de todas as áreas.
---

# Redação académica e metodologia de investigação

Abordagens sistemáticas para redação académica, delineamento de investigação e comunicação académica.

## Fundamentos do delineamento de investigação

### Formulação da questão de investigação

```markdown
## Construir uma questão de investigação

### Os critérios FINER
- **F**actível (Feasible): Consegue realmente realizar esta investigação?
- **I**nteressante: Importa para a área?
- **N**ovidade: Acrescenta conhecimento novo?
- **É**tico: Pode ser feita eticamente?
- **R**elevante: Aborda um problema real?

### Tipos de questões
| Tipo | Objetivo | Exemplo |
|------|----------|---------|
| Descritivo | Documentar fenómenos | "Quais são as características de X?" |
| Comparativo | Comparar grupos/condições | "Como é que X difere entre grupos?" |
| Correlacional | Examinar relações | "Há uma relação entre X e Y?" |
| Causal | Estabelecer causalidade | "X causa Y?" |
| Exploratório | Gerar hipóteses | "Que fatores podem explicar X?" |

### Refinar a questão
Começar de forma ampla → Restringir progressivamente

Rascunho 1: "Como é que as redes sociais afetam a política?"
Rascunho 2: "Como é que o uso do Twitter afeta a polarização política?"
Rascunho 3: "Como é que a exposição a contas partidárias no Twitter afeta
          a polarização de atitudes políticas entre adultos nos EUA?"
Rascunho 4: "O aumento da exposição a feeds do Twitter ideologicamente
          homogéneos aumenta a polarização afetiva entre adultos
          politicamente envolvidos nos EUA com idades entre 18 e 35 anos?"
```

### Estratégia de revisão da literatura

```markdown
## Pesquisa sistemática da literatura

### Seleção de bases de dados por área
- **Multidisciplinar**: Web of Science, Scopus, Google Scholar
- **Ciências Sociais**: JSTOR, ProQuest, SSRN
- **Comunicação**: Communication Abstracts, ComAbstracts
- **Saúde**: PubMed, MEDLINE, CINAHL
- **Educação**: ERIC
- **Gestão e Ciências Empresariais**: Business Source Complete

### Modelo de estratégia de pesquisa
1. **Identificar conceitos-chave** a partir da questão de investigação
2. **Gerar sinónimos** para cada conceito
3. **Combinar com operadores booleanos**

Exemplo para: "redes sociais polarização política"

Conceito 1: redes sociais
- OR: Twitter, Facebook, Instagram, "social networking sites",
      "online platforms", "digital media"

Conceito 2: político
- OR: partidário, ideológico, eleitoral, cívico

Conceito 3: polarização
- OR: divisão, extremismo, "mudança de atitudes", radicalização

Pesquisa combinada:
(Twitter OR Facebook OR "social media" OR "social networking")
AND (political OR partisan OR ideological)
AND (polarization OR division OR extremism)

### Critérios de inclusão/exclusão
Documentar os critérios:
- Período de publicação: [X até ao presente]
- Idiomas: [Apenas inglês / múltiplos]
- Tipos de publicação: [Só com revisão por pares / incluir preprints]
- Âmbito geográfico: [Global / países específicos]
- Metodologias: [Todas / abordagens específicas]

### Gerir a pesquisa
- Guardar pesquisas para repetir posteriormente
- Exportar resultados para o gestor de referências
- Registar o número de resultados em cada etapa
- Documentar a data de cada pesquisa
```

### Gestão de citações

```python
# Padrões de integração com Zotero/gestor de referências

# Para fluxos automatizados de citação
CITATION_STYLES = {
    'apa7': 'American Psychological Association 7th edition',
    'mla9': 'Modern Language Association 9th edition',
    'chicago': 'Chicago Manual of Style 17th edition',
    'harvard': 'Harvard Reference format',
    'ieee': 'IEEE',
    'vancouver': 'Vancouver (medicina)',
}

# Modelo de entrada BibTeX
BIBTEX_ARTICLE = """
@article{{{citekey},
    author = {{{author}}},
    title = {{{title}}},
    journal = {{{journal}}},
    year = {{{year}}},
    volume = {{{volume}}},
    number = {{{number}}},
    pages = {{{pages}}},
    doi = {{{doi}}}
}}
"""

# Padrões de citação comuns por contexto
CITATION_CONTEXTS = {
    'introducing_concept': "Segundo Autor (Ano), ...",
    'supporting_claim': "A investigação demonstrou que X (Autor, Ano; Autor, Ano).",
    'contrasting': "Enquanto Autor (Ano) defende X, Autor (Ano) sustenta Y.",
    'methodology_reference': "Seguindo o método desenvolvido por Autor (Ano), ...",
    'direct_quote': 'Autor (Ano) refere que "citação exata" (p. X).',
}
```

## Estrutura e redação do artigo

### Estrutura IMRaD (artigos científicos)

```markdown
## Secções padrão de um artigo de investigação

### Resumo (tipicamente 150-300 palavras)
- Contexto (1-2 frases)
- Objetivo/finalidade (1 frase)
- Métodos (2-3 frases)
- Resultados (2-3 frases)
- Conclusões (1-2 frases)

### Introdução
**Estrutura de funil:**
1. Contexto amplo — Por que motivo é este tema importante?
2. Foco restrito — Qual é o problema específico?
3. Identificação da lacuna — O que não sabemos?
4. Questão/hipótese de investigação — O que vai investigar?
5. Antecipação da contribuição — Por que razão é este estudo relevante?

### Revisão da Literatura
**Organizar por temas, não cronologicamente:**
1. Tema 1: Principais resultados, debates, lacunas
2. Tema 2: Principais resultados, debates, lacunas
3. Tema 3: Principais resultados, debates, lacunas
4. Síntese: Como os temas se ligam ao seu estudo

### Métodos
**O teste de reprodutibilidade:** Outro investigador conseguiria replicar o estudo apenas a partir desta secção?

Incluir:
- Participantes/amostra (quem, como selecionados, N)
- Materiais/instrumentos (que instrumentos, a sua validade)
- Procedimento (descrição passo a passo do que ocorreu)
- Abordagem de análise (testes estatísticos, métodos qualitativos)
- Considerações éticas (comissão de ética, consentimento informado)

### Resultados
**Relatar, não interpretar:**
- Apresentar os resultados de forma sistemática
- Usar tabelas/figuras para dados complexos
- Reportar tamanhos de efeito, não apenas valores-p
- Responder a cada questão/hipótese de investigação

### Discussão
**Estrutura de funil invertido:**
1. Síntese dos resultados principais
2. Interpretação no contexto da literatura
3. Implicações teóricas
4. Implicações práticas
5. Limitações
6. Direções para investigação futura
7. Conclusão
```

### Estilo de redação académica

```markdown
## Convenções de escrita

### Voz e tempo verbal
| Secção | Tempo verbal | Exemplo |
|--------|-------------|---------|
| Resumo | Pretérito (métodos/resultados), Presente (conclusões) | "Encontrámos... Isto sugere..." |
| Introdução | Presente (conhecimento estabelecido) | "A investigação mostra..." |
| Métodos | Pretérito | "Os participantes completaram..." |
| Resultados | Pretérito | "A análise revelou..." |
| Discussão | Presente + Pretérito | "Estes resultados indicam... Encontrámos..." |

### Linguagem de atenuação (hedging)
Atenuação adequada (evitar afirmações excessivas):
- "Isto sugere que..." (não "Isto prova que...")
- "pode estar relacionado com" (não "causa")
- "Os resultados indicam..." (não "Os resultados demonstram conclusivamente...")
- "Uma explicação possível..." (não "A explicação...")

### Palavras de transição por função
**Adição:** além disso, ademais, adicionalmente, ainda
**Contraste:** no entanto, todavia, por outro lado, em contraste
**Causa/efeito:** portanto, consequentemente, como resultado, assim
**Exemplo:** por exemplo, nomeadamente, para ilustrar
**Sequência:** primeiramente, subsequentemente, por fim, entretanto
**Síntese:** em síntese, globalmente, em conclusão

### Parágrafos
Cada parágrafo deve:
1. Iniciar com uma frase-tópico
2. Conter uma ideia principal
3. Incluir evidência de suporte
4. Ligar-se aos parágrafos adjacentes
5. Ter em média 100-200 palavras (varia por área)
```

### Problemas comuns na redação

```markdown
## Questões a evitar

### Prolixidade
❌ "É importante notar que os resultados demonstram..."
✅ "Os resultados demonstram..."

❌ "Com o objetivo de investigar..."
✅ "Para investigar..."

❌ "Um total de 50 participantes..."
✅ "Cinquenta participantes..."

### Verbos fracos
❌ "O estudo foi conduzido pelos investigadores"
✅ "Os investigadores conduziram o estudo"

❌ "Foi encontrada uma diferença significativa"
✅ "Encontrámos uma diferença significativa"

### Linguagem vaga
❌ "Vários estudos demonstraram..."
✅ "Três estudos (Autor, Ano; Autor, Ano; Autor, Ano) demonstraram..."

❌ "Os resultados foram significativos"
✅ "Os resultados foram estatisticamente significativos (p < .05, d = 0.45)"

### Jargão desnecessário
- Definir termos técnicos na primeira utilização
- Usar palavras mais simples quando igualmente precisas
- Considerar o nível de especialização do público-alvo

### Problemas com citações
❌ Citar fontes secundárias sem indicá-lo
✅ "(Autor, Ano, citado em Autor, Ano)"

❌ Citações em sequência sem síntese
✅ Agrupar citações que defendem o mesmo ponto; distinguir as que divergem
```

## Revisão por pares e revisão do manuscrito

### Responder aos revisores

```markdown
## Modelo de carta de resposta

Exmo. Sr. Editor e Exmos. Revisores,

Agradecemos os comentários cuidadosos sobre o nosso manuscrito intitulado "[Título]"
(ID do Manuscrito: [Número]). Considerámos atentamente todos os comentários e
revisámos o manuscrito em conformidade. Abaixo, apresentamos respostas
ponto a ponto a cada comentário.

---

## Revisor 1

### Comentário 1.1
[Citar ou parafrasear o comentário do revisor]

**Resposta:**
[A sua resposta explicando o que fez]

**Alterações efetuadas:**
[Citar as alterações específicas com números de página/linha]
"Novo texto aqui..." (p. X, linhas XX-XX)

### Comentário 1.2
[Continuar para cada comentário]

---

## Revisor 2
[Mesmo formato]

---

Acreditamos que estas revisões reforçaram substancialmente o manuscrito
e esperamos que o considere adequado para publicação em [Nome da Revista].

Com os melhores cumprimentos,
[Autores]
```

### Lidar com a crítica

```markdown
## Tipos de feedback dos revisores

### Deve abordar obrigatoriamente
- Questões metodológicas
- Literatura em falta
- Escrita pouco clara
- Lacunas lógicas na argumentação
- Erros estatísticos

### Negociar com cuidado
- Pedidos de análises adicionais
- Sugestões de reestruturação
- Desacordos sobre a interpretação

### Responder com firmeza quando adequado
- Pedidos fora do âmbito
- Interpretações erradas do seu argumento
- Conselhos contraditórios entre revisores

### Estratégias de resposta
**Concordância:** "Agradecemos ao revisor esta sugestão. [Ação efetuada]."
**Concordância parcial:** "Agradecemos esta observação. Embora [reconhecer a validade], nós [explicar a abordagem]. Contudo, [acomodação parcial]."
**Discordância respeitosa:** "Agradecemos ao revisor por levantar esta questão. Considerámos isto cuidadosamente; no entanto, [explicação]. Esperamos que o revisor considere este raciocínio persuasivo."
```

## Propostas de financiamento

### Estrutura da proposta (estilo NSF/NIH)

```markdown
## Componentes padrão de uma proposta

### Objetivos específicos (1 página)
**Parágrafo de abertura:** Qual é o problema? Por que motivo é importante?
**Declaração da lacuna:** O que falta na compreensão atual?
**Objetivo de longo prazo:** A visão do seu programa de investigação
**Objetivo:** O que este projeto específico vai alcançar
**Hipótese central:** A sua previsão testável
**Objetivos:** 2-4 objetivos específicos e alcançáveis
**Declaração de impacto:** Por que razão o financiamento é importante

### Relevância (2-3 páginas)
- Importância do problema
- Lacunas no conhecimento atual
- Como o seu trabalho avança na área
- Impacto potencial em caso de sucesso

### Inovação (1 página)
- O que há de novo na sua abordagem?
- Inovação conceptual
- Inovação metodológica
- Inovação técnica

### Abordagem (6-12 páginas)
Para cada objetivo:
- Fundamentação
- Dados preliminares (se existirem)
- Delineamento de investigação
- Métodos
- Resultados esperados
- Problemas potenciais e alternativas
- Cronograma

### Impactos mais amplos
- Oportunidades de formação
- Planos de disseminação
- Benefícios para a sociedade
- Diversidade e inclusão
```

### Justificação do orçamento

```markdown
## Categorias orçamentais

### Pessoal
- Vencimento e dedicação do IP (% de tempo)
- Co-investigadores
- Pós-doutoramentos (vencimento + benefícios)
- Estudantes de mestrado/doutoramento (bolsa + propinas + benefícios)
- Investigadores de licenciatura
- Pessoal técnico

### Equipamento
- Itens acima de $5.000 (verificar o limite do financiador)
- Justificar a necessidade para o projeto

### Consumíveis
- Consumíveis de laboratório
- Licenças de software
- Pagamentos a participantes

### Viagens
- Apresentações em conferências
- Locais de recolha de dados
- Visitas a colaboradores

### Outros custos diretos
- Custos de publicação
- Incentivos a participantes
- Serviços de transcrição
- Manutenção de equipamento

### Custos indiretos (F&A — instalações e administrativos)
- Cada instituição negocia uma taxa F&A com a sua agência federal competente.
- A taxa aplica-se aos **custos diretos totais modificados (MTDC)**, não aos custos
  diretos totais brutos — excluir equipamento >$5K, propinas, apoio a participantes,
  parcelas de subcontratos acima de $25K, e algumas outras categorias conforme
  o acordo negociado da instituição.
- Universidades R1 costumam negociar 55-70% do MTDC; instituições menores
  apresentam frequentemente taxas inferiores. Confirme sempre a taxa atual
  com o gabinete de apoio à investigação antes de elaborar o orçamento.
```

## Estratégia de publicação

### Seleção de revista

```markdown
## Avaliar revistas

### Indicadores de qualidade
- Fator de impacto (usar com cautela)
- Taxa de aceitação
- Tempo de revisão
- Tempo até publicação
- Reputação na sua área
- Indexação (Web of Science, Scopus)

### Indicadores de adequação
- Alinhamento com o âmbito
- Correspondência com o público-alvo
- Tipo de artigo (empírico, teórico, revisão)
- Via de acesso aberto (ver abaixo)

### Vias de acesso aberto
- **OA Dourado (Gold OA)** — publicado em acesso aberto numa revista totalmente OA;
  geralmente requer uma Taxa de Processamento de Artigo (APC — Article Processing
  Charge), frequentemente $1.000-$3.000+.
- **OA Verde (Green OA)** — revista de acesso fechado, mas o autor autoarquiva um
  manuscrito aceite num repositório (institucional, arXiv, etc.) de acordo com o
  embargo permitido pela editora.
- **OA Diamante / Platina (Diamond/Platinum OA)** — revista totalmente OA sem APC;
  apoiada por um financiador (sociedade científica, universidade, consórcio).
  Cada vez mais comum nas ciências sociais e humanidades.
- **Híbrido (Hybrid)** — revista de acesso fechado que permite que artigos individuais
  sejam OA mediante APC. Nota: a via híbrida *não cumpre* o Plan S nem muitos
  mandatos de OA de financiadores — verificar antes de pagar uma APC.
- **Bronze** — gratuito para leitura, mas sem licença OA formal; a editora
  pode revogar o acesso. Tratar como não-OA para efeitos de conformidade.

### Mandatos de financiadores (EUA + Europa, em 2026)
- **Memorando Nelson da OSTP (EUA)** — a investigação financiada por verbas
  federais norte-americanas deve ser imediatamente acessível ao público aquando
  da publicação, sem embargo. O prazo de implementação foi **fim de 2025**, pelo
  que em 2026 isto está em vigor para todos os principais financiadores federais
  americanos (NIH, NSF, DOE, NASA, etc.).
- **Plan S (cOAlition S)** — financiadores europeus (Wellcome, UKRI, ANR, e muitos
  outros) exigem OA Dourado ou Diamante imediato, ou OA Verde sem embargo e com
  licença CC-BY. A via híbrida não cumpre
  os requisitos.
- Verificar a política mais recente do financiador antes da submissão — as
  vias aceites mudam, e alguns financiadores limitam as APCs.

### Sinais de alerta (revistas predatórias)
- Solicitação agressiva por email
- "Revisão por pares" rápida (dias)
- Corpo editorial pouco claro
- Não indexada nas principais bases de dados
- "Pague para publicar" sem modelo OA claro
- Qualidade fraca do site

### Recursos para verificar revistas + ética
- **Think. Check. Submit.** (thinkchecksubmit.org) — lista de verificação de legitimidade.
- **DOAJ** (Directory of Open Access Journals) — índice verificado de revistas OA.
- **Journal Citation Reports** — produto pago do Web of Science para o fator de impacto.
- **Cabells Predatory Reports** — alternativa por subscrição à lista original
  de Beall, que foi retirada em 2017 (existem apenas mirrors desatualizados —
  não confiar neles como fonte atualizada).
- **Retraction Watch Database** — registo pesquisável de retratações e má conduta
  de editoras; útil para verificar autores e revistas.
- **COPE** (Committee on Publication Ethics, publicationethics.org) —
  diretrizes de referência para editores e autores sobre ética e integridade.
- **ICMJE** (International Committee of Medical Journal Editors,
  icmje.org/recommendations) — define critérios de autoria, divulgação de
  conflitos de interesse e normas de relato utilizadas em diversas áreas.
```

### Modelo de carta de apresentação

```markdown
Exmo. Dr./Dra. [Nome do Editor],

Temos o prazer de submeter o nosso manuscrito intitulado "[Título completo]"
para consideração como [tipo de artigo] em [Nome da Revista].

**Resumo (2-3 frases):**
[O que fez e o que encontrou]

**Relevância (2-3 frases):**
[Por que motivo isto é importante para os leitores da revista]

**Declaração de adequação:**
[Por que motivo especificamente esta revista]

**Declarações:**
- Este manuscrito é original e não se encontra em avaliação noutra revista
- Todos os autores aprovaram a submissão
- [Declaração de conflitos de interesse]
- [Agradecimento de financiamento]

**Revisores sugeridos (se solicitado):**
1. [Nome, afiliação, email] - Especialista em [área relevante]
2. [Nome, afiliação, email] - Especialista em [área relevante]
3. [Nome, afiliação, email] - Especialista em [área relevante]

**Revisores a excluir (se aplicável):**
[Nome] - [Razão breve e profissional]

Aguardamos a sua resposta.

Com os melhores cumprimentos,
[Nome do autor correspondente]
[Título, afiliação]
[Informações de contacto]
```

## Preprints e identificadores persistentes

### Servidores de preprints (publicar uma versão de trabalho, ser citado mais cedo)

Preprints são manuscritos submetidos pelos autores e publicados antes da
revisão formal por pares. A maioria das revistas já permite (ou incentiva
ativamente) a publicação de preprints; verifique a política da revista-alvo
antes de publicar, caso tenha dúvidas.

| Servidor | Área | Observações |
|----------|------|-------------|
| **arXiv** (arxiv.org) | Física, matemática, informática, biologia quantitativa, economia, estatística | O mais antigo e maior; moderação por secção. |
| **SSRN** (ssrn.com) | Ciências sociais, direito, economia, finanças | Propriedade da Elsevier desde 2016 — alguns autores preferem o SocArXiv como alternativa. |
| **bioRxiv** (biorxiv.org) | Biologia | Cold Spring Harbor Laboratory; amplamente citado. |
| **medRxiv** (medrxiv.org) | Ciências da saúde, medicina | Moderação ligeira para afirmações de segurança; não publicar resultados de ensaios clínicos como preprint sem pré-registo. |
| **EarthArXiv** | Ciências da Terra, planetárias, ambientais | Gerido pela comunidade via infraestrutura OSF. |
| **PsyArXiv** | Psicologia + ciências comportamentais | Alojado no OSF. |
| **SocArXiv** | Sociologia + ciências sociais | Alojado no OSF; alternativa independente da Elsevier ao SSRN. |
| **EngrXiv** | Engenharia | Alojado no OSF. |

**Porquê publicar um preprint:** Registo mais rápido da prioridade, citável
meses antes da aceitação pela revista, e feedback mais amplo antes da revisão
final. (O Memorando Nelson da OSTP de 2026 rege o acesso público imediato à
versão *revista por pares* da investigação financiada por verbas federais dos
EUA aquando da publicação — não é um mandato de preprints. A publicação
de preprints é uma escolha voluntária e separada que complementa, mas não
satisfaz, a conformidade com o Memorando Nelson.)

### Identificadores persistentes — obtenha um ORCID e utilize DOIs

- **ORCID iD** (orcid.org) — Identificador gratuito de 16 dígitos que
  o liga de forma inequívoca entre editoras, financiadores e instituições.
  Exigido pela maioria das revistas e financiadores de maior relevância.
  Ligue-o ao seu CV, manuscritos, conjuntos de dados, software e candidaturas
  a financiamento.
- **DOI** (doi.org) — Identificador persistente para objetos académicos.
  Atribuído automaticamente pelas revistas na aceitação; pode também criar
  DOIs para os seus próprios conjuntos de dados, código, posters e preprints
  através do Zenodo (zenodo.org) ou do repositório institucional — útil para
  citar resultados não publicados em revistas.
- **ROR** (ror.org) — Identificador persistente para organizações de
  investigação, utilizado por financiadores e editoras para desambiguar
  nomes institucionais.

## Ética na investigação

### Lista de verificação de considerações éticas

```markdown
## Antes de iniciar a investigação

### Sujeitos humanos
- [ ] Parecer favorável do IRB/comissão de ética obtido
- [ ] Procedimentos de consentimento informado estabelecidos
- [ ] Populações vulneráveis identificadas e protegidas
- [ ] Medidas de privacidade e confidencialidade em vigor
- [ ] Plano de segurança de dados estabelecido
- [ ] Rácio risco/benefício aceitável

### Gestão de dados
- [ ] Plano de gestão de dados criado
- [ ] Armazenamento seguro providenciado
- [ ] Planos de partilha/arquivo documentados
- [ ] Período de retenção definido
- [ ] Procedimentos de destruição estabelecidos

### Autoria
- [ ] Critérios de contribuição discutidos (usar definição ICMJE: contribuição
      substancial + redação/revisão + aprovação final + responsabilização)
- [ ] Ordem de autoria acordada
- [ ] Todos os contribuintes vão satisfazer os critérios de autoria
- [ ] Agradecimentos planeados para contribuintes não-autores
- [ ] **Taxonomia CRediT** (credit.niso.org) — funções atribuídas a cada
      autor — a maioria das revistas de maior relevância já exige ou recomenda
      o CRediT, que possui 14 funções padronizadas de contribuidor
      (Conceptualização, Metodologia, Software, Validação, Análise formal,
      Investigação, Recursos, Curadoria de dados, Redação — rascunho original,
      Redação — revisão e edição, Visualização, Supervisão, Administração
      do projeto, Aquisição de financiamento).

### Conflitos de interesse
- [ ] Conflitos financeiros identificados
- [ ] Conflitos não financeiros identificados
- [ ] Plano de divulgação estabelecido

### Reprodutibilidade
- [ ] Plano de análise pré-registado no **OSF** (osf.io) ou **AsPredicted**
      (aspredicted.org) antes da recolha de dados — distingue análises
      confirmatórias de exploratórias e protege contra HARKing (Hypothesizing
      After Results Known — formular hipóteses após conhecer os resultados).
      Verificar se a revista-alvo aceita **Registered Reports** (revisão por pares
      do delineamento *antes* da recolha de dados, com aceitação em
      princípio independentemente dos resultados) — este formato existe
      já em 350+ revistas nas áreas de psicologia, ciências biomédicas e
      ciências sociais em 2026.
- [ ] O código será partilhado (considerar um release no GitHub + DOI Zenodo
      para arquivos de código versionados e citáveis)
- [ ] Os dados serão partilhados (princípios FAIR — Findable, Accessible,
      Interoperable, Reusable; repositório institucional, Dryad, Figshare,
      ou repositório específico do domínio conforme adequado)
- [ ] Os materiais serão partilhados
```

### Evitar má conduta na investigação

```markdown
## Tipos de má conduta

### Fabricação
- Inventar dados ou resultados
- Nunca aceitável em nenhuma circunstância

### Falsificação
- Manipular dados, equipamentos ou processos
- Omitir dados seletivamente para alterar conclusões
- Manipulação de imagens para além de ajustes aceitáveis

### Plágio
- Utilizar palavras de outrem sem atribuição
- Autoplágio (reutilizar trabalho próprio publicado sem referência)
- Parafrasear de forma demasiado próxima

### Outras práticas questionáveis
- P-hacking (executar múltiplas análises até obter significância estatística)
- HARKing (Hypothesizing After Results Known — formular hipóteses após conhecer os resultados)
- Salami slicing (fragmentar um estudo em múltiplos artigos)
- Autoria honorária ou fantasma (gift/ghost authorship)
- Relato seletivo de resultados
```

## Utilização de IA / LLM na redação académica

A escrita assistida por LLM é a questão ética definidora de 2024-2026 na
edição académica. Todas as principais revistas, financiadores e organismos
de ética publicaram políticas neste período — e as políticas continuam a
reforçar-se. Trate tudo abaixo como o mínimo, não o teto: leia as diretrizes
de submissão atuais da revista-alvo E a política mais recente do seu
financiador antes de submeter.

### O que é universalmente proibido (em 2026)

- **Autoria de LLM.** O ICMJE, COPE, Nature, Science, NEJM, Cell, JAMA,
  Lancet e as principais editoras universitárias proíbem explicitamente
  listar um LLM (ChatGPT, Claude, Gemini, etc.) como co-autor. Os LLMs
  não conseguem satisfazer os critérios de responsabilização e aprovação
  que a autoria exige. Utilize a secção de agradecimentos ou uma declaração
  de métodos/divulgação — nunca a lista de autores.
- **Gerar citações fabricadas.** Está documentado que os LLMs produzem
  DOIs, números de página e até combinações de autor/título plausíveis mas
  inexistentes. Todas as citações num manuscrito devem ser verificadas junto
  da fonte — a taxa de citações falsas induzidas por LLM tem sido um dos
  principais motivos de retratação desde 2023.
- **Gerar dados, resultados ou imagens.** Sintetizar dados experimentais,
  fabricar figuras ou usar IA generativa para "preencher" resultados que
  não foram efetivamente obtidos constitui má conduta na investigação segundo
  a definição do COPE.
- **Utilização substancial não divulgada.** A maioria das revistas exige a
  divulgação de qualquer uso de LLM para além de simples correção ortográfica
  ou gramatical. A omissão de utilização significativa pode ser motivo de
  retratação.

### O que é tipicamente permitido (com divulgação)

- Geração de ideias e elaboração de esquemas
- Polimento linguístico e correção gramatical
- Tradução da própria escrita
- Geração de código para análises (com testes explícitos)
- Resumo de notas ou transcrições próprias
- Geração de secções padronizadas (cartas de apresentação, linguagem
  para comissões de ética) que depois verifica e assume

### Linguagem de divulgação (modelo)

A maioria das revistas pretende uma declaração nos métodos/agradecimentos que
indique a ferramenta, a versão (se disponível) e para que foi utilizada. Exemplo:

> Durante a preparação deste trabalho, o(s) autor(es) utilizou(aram) [nome da
> ferramenta, ex., ChatGPT-5, Claude Opus 4.7, Gemini 3 Pro] para [uso
> específico, ex., polimento linguístico da introdução; redação de código para
> a análise de clusters na secção 3.2]. Após a utilização desta ferramenta,
> o(s) autor(es) reviu(ram) e editou(ram) o conteúdo conforme necessário
> e assume(m) total responsabilidade pelo conteúdo da publicação.

Adapte para corresponder à redação exata exigida pela revista-alvo — Elsevier,
Springer Nature, Wiley, Taylor & Francis, IEEE e ACM publicam cada uma a sua
própria linguagem preferida.

### Lista de verificação de divulgação antes da submissão

- [ ] Ler a política de IA/LLM da revista-alvo nas diretrizes de submissão
      atuais (políticas atualizadas múltiplas vezes por ano).
- [ ] Ler a política do financiador — alguns (Wellcome, NSF) têm regras
      mais rigorosas do que a revista.
- [ ] Adicionar uma declaração de divulgação usando a linguagem preferida
      da revista.
- [ ] Verificar manualmente todas as citações — não confiar no resultado gerado pelo LLM
      para qualquer DOI, lista de autores, intervalo de páginas ou passagem
      citada.
- [ ] Verificar todas as afirmações numéricas, datas e factos nomeados.
- [ ] Reler o manuscrito completo para garantir que a sua voz e estrutura
      argumentativa dominam, não as do LLM.
- [ ] Se o LLM foi utilizado para código ou análise, voltar a executar com
      sementes (seeds) e verificar se todos os valores reportados se reproduzem.

### Ferramentas de deteção (fiabilidade limitada)

GPTZero, Turnitin AI Detection, Originality.ai e ferramentas semelhantes
têm documentadas taxas elevadas de falsos positivos em autores não nativos
de inglês e em texto técnico legitimamente escrito por humanos — e taxas
elevadas de falsos negativos em modelos atuais com edição ligeira. A **Pangram
Labs** (pangram.com) publicou benchmarks mais rigorosos e tende a superar os
detetores mais antigos em configurações aproximadamente equivalentes, mas
continua a não ser um árbitro definitivo e partilha os mesmos limites
fundamentais quando os autores editam substancialmente o resultado gerado pelo LLM. Os
resultados da deteção nunca devem ser a base exclusiva para uma conclusão de
má conduta; as revistas que dependem deles como sinal de controlo estão cada
vez mais a recuar nessa posição. Trate os resultados dos detetores como um
sinal para acompanhamento junto do autor, não como prova por si mesmos.

## Produtividade e fluxo de trabalho

### Rotina de escrita

```markdown
## Escrita académica sustentável

### Prática diária de escrita
- Escrever à mesma hora diariamente (formação de hábito)
- Começar com um objetivo mínimo viável (ex., 30 minutos)
- Registar o progresso (contagem de palavras, tempo)
- Proteger o tempo de escrita de reuniões/emails

### Gerir projetos de grande dimensão
1. Dividir nas tarefas mais pequenas possíveis
2. Definir prazos para cada componente
3. Agendar blocos regulares de escrita
4. Incluir tempo de reserva
5. Obter feedback cedo e com frequência

### Superar bloqueios
- Começar pela secção mais fácil
- Escrever um "primeiro rascunho terrível" (Anne Lamott)
- Usar marcadores de posição para citações/dados
- Discutir ideias com um colega
- Mudar de ambiente
- Voltar ao esquema/estrutura
```

### Ferramentas para académicos

| Objetivo | Ferramentas |
|----------|-------------|
| Gestão de referências | Zotero (recomendado; código aberto, sincroniza entre dispositivos), Paperpile (web-first, integração com Google Docs), EndNote, Citavi. **Nota sobre Mendeley:** A Elsevier anunciou o fim dos downloads do Mendeley Desktop em setembro de 2022, tendo posteriormente restaurado a disponibilidade. O Mendeley Desktop continua como software legado sem desenvolvimento adicional de funcionalidades; o Mendeley Reference Manager (web/cloud) é o produto ativamente mantido. Novos utilizadores são melhor servidos pelo Zotero ou Paperpile. |
| Escrita | Scrivener, Overleaf (colaboração em LaTeX), Word, Typst (alternativa mais recente ao LaTeX) |
| Colaboração | Google Docs, Overleaf, Hedgedoc |
| Controlo de versões | Git / GitHub / GitLab (verdadeiro controlo de versões). **O Track Changes do Word é edição colaborativa, não controlo de versões** — falta-lhe branching, merging, reescrita do histórico e commits atómicos. |
| Gestão de tarefas | Todoist, Notion, Trello |
| Concentração | Forest, Freedom, Cold Turkey |
| Análise | R, Python, SPSS, Stata, NVivo, Julia |
| Visualização | R/ggplot2, Python/matplotlib + plotly, Observable, Tableau |
| Escrita assistida por LLM | Consultar a secção "Utilização de IA / LLM na redação académica" acima para os requisitos de divulgação antes de utilizar qualquer uma destas ferramentas. |
