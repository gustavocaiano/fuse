# Information about cameras, app communication, and Tailscale

_Last updated: 2026-04-17_

## Goal

Recolher informação estruturada para mais tarde gerar:
- um diagrama de deployment da câmara;
- um diagrama/PUML da comunicação entre app, servidor, SBC, router e câmara;
- ou um prompt para geração de imagem técnica/académica.

## Current understanding from the repository

### Old / current external access scenarios already documented

Source: `helpers/prompts/01-cenario-atual-cctv-acesso-remoto.md`

1. **Câmara com SIM / 4G e acesso P2P**
   - Acesso remoto depende de um **servidor intermédio / cloud do fabricante / relay P2P**.
   - O fluxo descrito é: **câmara -> Internet -> servidor intermédio do fabricante -> operador remoto**.

2. **Câmara atrás de router com acesso remoto direto**
   - Acesso depende de **router + firewall + regra aberta / port forwarding**.
   - O fluxo descrito é: **câmara -> router/firewall -> Internet -> operador remoto**.

### Statements in thesis about the proposed architecture

Source: `thesis/ch2/chapter2.tex:152-175`

- Expor dispositivos IoT diretamente à Internet é descrito como impraticável/inseguro.
- Em redes móveis 4G/5G existe o problema de **CGNAT**, que inviabiliza acesso direto tradicional.
- A solução proposta inverte o modelo: o dispositivo em edge inicia o túnel / participa numa rede P2P para atravessar NAT sem configuração complexa.
- O protocolo escolhido é **WireGuard**, pela baixa latência e baixo overhead.
- A arquitetura FUSE materializa-se com **cada câmara (ou conjunto de câmaras) acompanhada por um SBC**, especificamente um **Raspberry Pi**.
- Esse SBC atua como **gateway de rede**.
- O encaminhamento é estabelecido por uma **VPN gerida pelo Tailscale**.
- Existe a possibilidade futura de transição para **Headscale**.
- O objetivo é permitir que um **servidor central** agregue e controle o streaming de vídeo das câmaras **sem expor os dispositivos à Internet pública**.

### Problem statement already captured in thesis

Source: `thesis/ch1/chapter1.tex:18-55`

- Muitas câmaras recorrem a **P2P via fabricante** fora da LAN.
- A comunicação entre aplicação e câmara é referida como frequentemente pouco segura e não encriptada.
- O objetivo do FUSE é usar **túneis VPN** para isolar e cifrar a comunicação entre câmaras externas e o servidor da aplicação.
- O sistema deve normalizar acesso a streams, visualização, gravação e playback.

### Repo-level stack references

Source: `README.md`

- Stack menciona explicitamente: **MediaMTX** e **Tailscale**.

## Gaps / unknowns still not defined in the repo

- Como é exatamente o fluxo **app -> servidor central -> SBC -> câmara**.
- Se a app fala diretamente com a câmara ou apenas com o servidor central.
- Se o SBC apenas faz **routing** ou também faz **proxy / stream relay / MediaMTX**.
- Se o Tailscale será usado como **subnet router (advertise routes)**, exit node, ligação host-a-host, ou combinação.
- Qual é a topologia exata: **uma câmara por SBC** ou **várias câmaras por SBC**.
- Como a câmara é ligada fisicamente/logicamente ao router e ao SBC.
- Se o SBC tem **duas interfaces** ou apenas uma.
- Se o acesso remoto pretendido é para **RTSP**, ONVIF, web UI da câmara, ou apenas vídeo via servidor.
- Quais são os limites de hardware do SBC “mínimo poder computacional”.
- Se queres mostrar apenas **deployment físico** ou também **fluxo lógico de comunicação**.

## Clarification log

### Round 1

- **Foco inicial do diagrama:** ambos — deployment físico e fluxo lógico.
- **Ponto de entrada da comunicação:** a app / utilizador contacta diretamente o **servidor central**.
- **Relação típica entre SBC e câmara:** **1 SBC para 1 câmara**.
- **Uso pretendido do Tailscale:** **subnet routing / advertise routes** para expor a sub-rede da câmara à tailnet.
- **Papel do SBC:** **apenas router VPN**, sem papel principal de proxy/relay/gestão no desenho base.

### Derived assumptions after round 1

- O fluxo-base parece ser: **app -> servidor central -> rede Tailscale -> SBC no edge -> sub-rede local -> câmara**.
- O SBC funciona como **ponte/gateway de conectividade** e não como componente principal de processamento.
- O deployment de referência a detalhar primeiro é **1 câmara + 1 router + 1 SBC** por local remoto.

### Round 2

- **Ligação do SBC ao router local:** por **Ethernet**.
- **Rede anunciada pelo SBC:** uma **LAN pequena** / sub-rede local da câmara.
- **Objetivo funcional do acesso do servidor central:** **streaming da câmara e controlo da câmara**.
- **Internet no diagrama novo:** deve aparecer de forma visível.
- **Ligação física da câmara:** ainda por fechar; recomendação provisória mais correta academicamente é:
  - **câmara -> router/switch local**
  - **SBC -> router/switch local**
  - **SBC anuncia a sub-rede da câmara via Tailscale subnet routing**

### Derived assumptions after round 2

- O cenário novo deve mostrar explicitamente que o Tailscale opera **sobre a Internet**, mas sem expor a câmara diretamente.
- O servidor central não usa o acesso apenas para visualização; também existe **controlo da câmara**.
- O desenho académico mais neutro e tecnicamente consistente tende para uma topologia LAN local com **router/switch como ponto comum** entre SBC e câmara.

### Round 3

- **Topologia física base confirmada:** **câmara e SBC ligados ao router/switch local**.
- **Servidor central:** está também **dentro da rede Tailscale / tailnet**.
- **Acesso do utilizador final:** o utilizador entra por **web normal** no servidor central.
- **Tipo de controlo a representar:** **PTZ**.
- **Comparação com o cenário anterior:** a nova secção deve mostrar que elimina:
  - dependência de **P2P / relay do fabricante**;
  - necessidade de **port forwarding / abertura de portas**.

### Derived assumptions after round 3

- O utilizador final não precisa de Tailscale no cliente para o fluxo principal; quem participa na tailnet é pelo menos o **servidor central** e o **SBC remoto**.
- A componente de segurança/networking relevante para o diagrama principal está entre **servidor central** e **SBC**, não entre utilizador final e servidor.
- O controlo PTZ deve aparecer como parte dos fluxos lógicos além do streaming.

### Round 4

- **Router remoto no diagrama:** mostrar apenas como **router local**, sem enfatizar explicitamente “rede não controlada”.
- **Detalhe `advertise routes`:** fica **na legenda / texto de apoio**, não necessariamente dentro da figura.
- **Plano de coordenação Tailscale:** **não mostrar** na figura principal; mostrar apenas o **caminho de dados**.
- **Acesso local à câmara:** considerado **não relevante** para esta figura.
- **MediaMTX:** **ainda indefinido** se deve aparecer nesta secção.

### Derived assumptions after round 4

- A figura principal deve manter-se focada no **deployment e caminho funcional principal**, sem desviar para componentes de coordenação do Tailscale.
- O nível de detalhe textual dentro da figura deve ser moderado; detalhes como **subnet router / advertise routes** podem ficar para legenda, descrição, ou prompt/PUML complementar.

### Round 5

- **Escala da figura principal:** **um local remoto** de referência.
- **Naming do dispositivo edge:** **SBC genérico**.
- **Camada a nomear na figura/legenda:** **Tailscale** (não WireGuard).
- **Posicionamento do servidor central no discurso:** **servidor próprio**.
- **Representação dos fluxos entre servidor e câmara:** **dois fluxos**, separando **streaming** e **controlo PTZ**.

### Derived assumptions after round 5

- A figura principal será mais clara como **caso canónico unitário** e não como agregação multi-site.
- O texto académico deve evitar sobrecarregar a figura com detalhes de stack mais baixos; **Tailscale** basta como referência de implementação.
- Vale a pena manter **setas distintas** para vídeo e PTZ no fluxo lógico.

### Round 6

- **Afirmar explicitamente “sem portas públicas abertas”:** não.
- **Afirmar explicitamente “conectividade de saída / sem relay do fabricante”:** não.
- **Protocolo/interface de PTZ:** não especificar.
- **Representação do lado central:** um único bloco, **Servidor FUSE** / **Servidor central FUSE**.
- **Tom da solução:** **substituição total** dos métodos anteriores no discurso pretendido.

### Derived assumptions after round 6

- O argumento visual e textual deve ser **positivo e arquitetural**, sem depender de claims demasiado específicas sobre portas, relay ou protocolos de controlo.
- A abstração desejada para o lado central é alta: um único bloco funcional chega para esta secção.

### Round 7

- **Próximo artefacto preferido:** **PUML**.
- **Estilo visual pretendido para futura figura:** **semelhante** ao prompt académico anterior (mesmo tom, com alguma liberdade).
- **Estratégia visual de comparação:** **duas figuras separadas** — uma para o problema e outra para a solução.
- **Uplink do router local no novo deployment:** **4G/5G no router**.
- **Estado da recolha nesta fase:** parar aqui; base considerada suficiente por agora.

## Current direction locked for next step

### Figura 1 — problema atual

- Caso A: câmara com **SIM / 4G** e acesso **P2P via fabricante**.
- Caso B: câmara ligada a **router/firewall** com **port forwarding**.

### Figura 2 — solução proposta

- **1 local remoto** de referência.
- **1 câmara + 1 router local + 1 SBC**.
- **Câmara e SBC ligados ao router local**.
- **Router com uplink 4G/5G**.
- **Servidor central FUSE** dentro da **tailnet**.
- **Utilizador final** acede por **web normal** ao servidor central.
- O **SBC** atua como **router VPN** com **Tailscale**, expondo a **LAN pequena da câmara** via subnet routing (detalhe preferencialmente na legenda).
- A figura lógica deve separar:
  - **fluxo de streaming**
  - **fluxo de controlo PTZ**
- O plano de coordenação do Tailscale não precisa de aparecer.
- O discurso global pretende posicionar esta arquitetura como **substituição total** dos métodos anteriores.

## Notes for future diagram

- Deve existir uma figura “antes” com:
  - P2P via fabricante (4G/SIM)
  - router + firewall + port forwarding
- E uma nova secção “depois / solução proposta” com:
  - câmara ligada a router local
  - SBC com baixo poder computacional ligado ao router
  - Tailscale no SBC
  - anúncio de rotas (`advertise routes`) para expor a rede/câmara à tailnet
  - acesso a partir de entidades na rede Tailscale sem exposição pública direta da câmara
