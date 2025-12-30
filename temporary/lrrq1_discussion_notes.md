# Anotações sobre Referências e Decisões - LRRQ1 Discussion

## Decisões de Inclusão/Exclusão

### Referências com Uso Parcial ou Contextual

#### `gomez_strategies_2023`
**Razão para uso parcial**: 
- A parte de TSN (Time-Sensitive Networking) é muito específica de hardware industrial (switches compatíveis com TSN) e não é diretamente aplicável ao FUSE que opera em redes não controladas com hardware commodity.
- **Uso**: Apenas a validação de Edge Computing e a redução de latência (98% de redução comparado com Cloud). A parte de priorização de tráfego (QoS) é relevante para o FUSE distinguir tráfego crítico (alertas) de tráfego best-effort (arquivo).
- **Não usar**: Detalhes sobre TSN, configuração de switches industriais, ou dependência de hardware específico.

#### `muniz_pragmatic_2019`
**Razão para uso contextual**:
- É um estudo secundário (mapeamento sistemático), não uma proposta de arquitetura concreta.
- **Uso**: Para contextualizar a lacuna literária - mostra que existem poucas soluções maduras para interoperabilidade pragmática em IoT, validando a necessidade do FUSE.
- **Não usar**: Como exemplo de implementação arquitetural ou padrão de design específico.

### Referências com Alta Relevância

#### `dobaj_microservice_2018`
- **Foco**: Camada de Abstração de Dados com padrão Mediator
- **Contribuição chave**: Valida o uso de uma camada de abstração para desacoplar lógica de serviço dos protocolos de comunicação
- **Citação chave**: "The domain specific data abstraction layer [...] acts as middleware [...] responsible for efficiently managing the device local data and mediating the local and remote access to this data."

#### `schwarzer_ial_2021`
- **Foco**: Information Abstraction Layer (IAL) para multimédia
- **Contribuição chave**: Aborda o "Semantic Gap" - vídeo bruto não deve ser enviado, mas sim "desemaranhado" em informação semântica
- **Citação chave**: "Multimedia is inherently ambiguous [...] Instead of processing multimedia in isolated services, we aim to analyze multimedia gradually with microservices and share their corresponding results between multiple participants."

#### `mafamane_study_2021`
- **Foco**: Access Mapper como padrão de abstração
- **Contribuição chave**: Conceito de "Dispositivos Virtuais" (Digital Twins) na camada de abstração
- **Citação chave**: "The access mapper component is at the heart of this layer. This module maps the uniform representation from the abstraction layer to the particular implementation of the constrained device."

#### `resende_sistema_2025`
- **Foco**: Sistema prático com ZoneMinder (middleware de abstração) e WireGuard
- **Contribuição chave**: Valida integralmente a stack tecnológica proposta para o FUSE
- **Citação chave**: "A solução cumpre os requisitos de segurança e controle, mantendo os dados sob domínio do usuário, ainda que o processo de configuração demande um nível de complexidade e trabalho significativamente superior ao observado em sistemas comerciais."

### Referências com Média Relevância

#### `barros_iot_2019`
- **Foco**: IoTM2B Multi-Protocol Message Broker
- **Contribuição chave**: Benchmarks quantitativos mostrando ineficiência do HTTP (até 200x mais lento que CoAP/MQTT)
- **Limitação**: Normaliza tudo para HTTP POST, o que seria um gargalo para streaming de vídeo
- **Uso**: Para validar a necessidade de um broker intermediário, mas destacando a limitação para streams contínuos

#### `mesmoudi_design_2018`
- **Foco**: Smart Gateway baseado em SOA
- **Contribuição chave**: Conceito de ThingDiscovery automatizado
- **Limitação**: Baseado em Request/Response (REST), inadequado para streaming contínuo
- **Uso**: Para validar o padrão de Gateway, mas destacando limitações para vídeo

#### `barra_exploring_2024`
- **Foco**: Arquitetura Hierárquica Edge-Fog-Cloud
- **Contribuição chave**: Justificativa teórica para distribuir inteligência, conceito de Low-level Data Fusion (LDF)
- **Uso**: Para fundamentar a arquitetura distribuída do FUSE

#### `immich_multi-tier_2019`
- **Foco**: Multi-tier Architecture com Microservice Chaining
- **Contribuição chave**: Conceito de Microservice Chaining para pipeline modular
- **Limitação**: Foco em Video Delivery (YouTube/Netflix style) com buffering, não tempo real
- **Uso**: Para validar o conceito de encadeamento de microserviços, mas destacando diferenças para videovigilância em tempo real

### Referências Contextuais

#### `george_distributed_2019`
- **Foco**: Stream-Store Middleware para Edge Vision Systems
- **Contribuição chave**: Conceito de "Latency-Accuracy Trade-off" e necessidade de "tuning knobs" dinâmicos
- **Limitação**: Poster paper sem validação empírica robusta
- **Uso**: Para validar o conceito de trade-offs dinâmicos em redes não controladas

## Estrutura da Discussão

A discussão seguirá uma progressão lógica:
1. **Fundamentação**: Por que é necessária uma camada de abstração (heterogeneidade)
2. **Padrões**: Como diferentes estudos propõem resolver (arquiteturas)
3. **Escalabilidade**: Como garantir extensibilidade futura
4. **Distribuição**: Por que Edge/Fog/Cloud para eficiência
5. **Lacunas**: O que falta na literatura (oportunidade para FUSE)
6. **Síntese**: Como tudo se conecta com as decisões do FUSE

## Estilo

- Evitar enumeração robotizada
- Usar síntese temática ("A literatura converge...", "Três padrões emergem...")
- Integrar citações naturalmente quando reforçam argumentos centrais
- Conectar com FUSE de forma natural, não forçada

