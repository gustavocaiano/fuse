# Prompt: Simplificação de texto sobre descoberta ONVIF

**Prompt do Utilizador:**

simplifica isto:

No momento de registo, o utilizador indica obrigatoriamente o endereço da câmara, mas não necessita de conhecer antecipadamente todos os detalhes técnicos do endpoint de controlo. Após a Câmara ser persistida, a aplicação origina o trabalho \texttt{OnvifPortSearcher} (linha 2). Este recebe o identificador da Câmara e usa o endereço configurado para testar combinações comuns de protocolo (\gls{HTTP} ou \gls{HTTPS}), porta e caminho \gls{ONVIF}. Quando uma resposta compatível é encontrada, a Câmara é atualizada com o protocolo e a porta detetados.

Esta abordagem reduz a configuração manual necessária para integrar uma Câmara com capacidades de controlo remoto. Caso a Câmara responda corretamente a uma das combinações testadas, a plataforma passa a saber que o controlo \gls{PTZ} pode ser encaminhado através de \gls{ONVIF}. Caso contrário, a Câmara continua registada e utilizável para visualização e gravação, apenas sem configuração automática de controlo remoto.

Embora o \gls{MVP} implemente apenas esta descoberta associada ao protocolo \gls{ONVIF}, a organização em trabalhos em segundo plano mantém aberta a possibilidade de introduzir futuramente outros mecanismos de descoberta ou outros protocolos de controlo. Nessa situação, a criação da Câmara poderia continuar a desencadear rotinas assíncronas adicionais, sem exigir ao utilizador uma configuração técnica minuciosa no momento do registo.
