const fs = require('fs-extra')
const { 
    prefix
} = JSON.parse(fs.readFileSync('./settings/settings.json'))

// Por favor, não exclua meu link do github, preciso do seu apoio! obrigado.
exports.textTnC = () => {
    return `
Este código-fonte / BOT é um programa de código aberto (gratuito) escrito usando JavaScript, você pode usar, copiar, modificar, combinar, publicar, distribuir, sublicenciar e / ou vender cópias sem remover o autor principal deste código-fonte / BOT.

Ao usar este código-fonte / BOT, você concorda com os seguintes Termos e Condições:
- O código-fonte / BOTs não armazenam seus dados em nossos servidores.
- O código-fonte / BOT não é responsável por seu pedido para este BOT.
- Código-fonte / BOT que você pode ver em https://github.com/ArugaZ/whatsapp-bot

Instagram: https://instagram.com/ini.arga/

Best regards, ArugaZ.`
}
// Por favor, não exclua meu link do github, preciso do seu apoio! obrigado.

exports.textMenu = (name) => {
    return `Olá, @${name}! 👋️
Aqui estão alguns dos comandos deste BOT!✨

Criação:
-❥ *${prefix}sticker*			- Transformar foto em figurinha
-❥ *${prefix}stickerGif*			- Transformar um GIF em figurinha
-❥ *${prefix}stickerGiphy*
-❥ *${prefix}stickerToImg*		- Transformar figurinha em imagem
-❥ *${prefix}meme*			- Criar um meme
-❥ *${prefix}escreva*
-❥ *${prefix}3dText*
-❥ *${prefix}pinkText*
-❥ *${prefix}logoPH*
-❥ *${prefix}citar*

Download:
-❥ *${prefix}ytmp3*
-❥ *${prefix}ytmp4*
-❥ *${prefix}facebook*

Código QR:
-❥ *${prefix}qrcode*			- Gerar QRCode
-❥ *${prefix}qrread*			- Ler QRCode

Cotações:
-❥ *${prefix}dolar*			- Cotação Dólar
-❥ *${prefix}euro*				- Cotação Euro
-❥ *${prefix}libra*				- Cotação Libra
-❥ *${prefix}bitcoin*			- Cotação Bitcoin
-❥ *${prefix}ethereum*		- Cotação Ethereum
-❥ *${prefix}litecoin*			- Cotação Litecoin
-❥ *${prefix}ripple*			- Cotação Ripple

Pesquisas:
-❥ *${prefix}imagens*
-❥ *${prefix}sreddit*
-❥ *${prefix}stalkIg*
-❥ *${prefix}stalkTikTok*
-❥ *${prefix}receitas*
-❥ *${prefix}wiki*
-❥ *${prefix}printLink*

Textos:
-❥ *${prefix}motivacional*		- Frase motivacional aleatória
-❥ *${prefix}versiculo*			- Versículo biblico aleatório

Imagens:
-❥ *${prefix}memes*
-❥ *${prefix}loli*
-❥ *${prefix}nsfws*

Diversão:
-❥ *${prefix}dado*
-❥ *${prefix}level*

Áudios:
-❥ *${prefix}acorda*
-❥ *${prefix}acordaCorno*
-❥ *${prefix}berrante*
-❥ *${prefix}bomDia*
-❥ *${prefix}bomDiaSexta*
-❥ *${prefix}boaNoite*
-❥ *${prefix}buzinaTrem*
-❥ *${prefix}coracaoBom*
-❥ *${prefix}cricri*
-❥ *${prefix}despertador*
-❥ *${prefix}eduCu*
-❥ *${prefix}euSouLouco*
-❥ *${prefix}genteBacana*
-❥ *${prefix}gosteiDoGrupo*
-❥ *${prefix}grupoMorrer*
-❥ *${prefix}maneSom*
-❥ *${prefix}naoBeboMais*
-❥ *${prefix}naoInterage*
-❥ *${prefix}pokemonRaro*
-❥ *${prefix}queCalor*
-❥ *${prefix}quePokemon*
-❥ *${prefix}raparigaCerta*
-❥ *${prefix}risada*
-❥ *${prefix}somPorcaria*
-❥ *${prefix}sonhoDoido*
-❥ *${prefix}tremBala*
-❥ *${prefix}vaiamerda*
-❥ *${prefix}vamoSocializar*
-❥ *${prefix}vamosAcordar*

Utilidades:
-❥ *${prefix}donoGrupo*		- Quem é o dono do grupo?
-❥ *${prefix}adminsGrupo*		- Quem são os admins do grupo?
-❥ *${prefix}meuNumero*		- Qual o meu número?
-❥ *${prefix}meExpulsa*		- Ta pedindo pra sair? 😏
-❥ *${prefix}buscaCep*			- Que CEP é esse?
-❥ *${prefix}tts*				- Converter texto em voz
-❥ *${prefix}traduzir*			- Responda uma mensagem para traduzir
-❥ *${prefix}conviteGrupo*		- Link de convite do grupo

Sobre o Zyron BOT:
-❥ *${prefix}sugerir*			- Faça uma sugestão
-❥ *${prefix}reportar*			- Teve algum problema? Me conta ai...
-❥ *${prefix}meuCriador*		- Contato do meu criador
-❥ *${prefix}entraAqui*		- Convidar o bot para seu grupo
-❥ *${prefix}apoiarProjeto*		- Faça uma doação para o projeto

Espero que você tenha um ótimo dia!✨`
}

exports.textAdmin = () => {
    return `⚠ [ *Admin Group Only* ] ⚠ 
Aqui estão os comandos de administração de grupo neste bot!

-❥ *${prefix}add*				55129xxxxx
-❥ *${prefix}expulsar*			@tag
-❥ *${prefix}promover*		@tag
-❥ *${prefix}rebaixar*			@tag
-❥ *${prefix}apenasAdm*
-❥ *${prefix}marcarTodos*
-❥ *${prefix}setProfile*
-❥ *${prefix}apagar*
-❥ *${prefix}bemVindo*		[on/off]
-❥ *${prefix}leveling*			[on/off]
-❥ *${prefix}nsfw*				[on/off]
-❥ *${prefix}edoTensei*		@tag @tag @tag
-❥ *${prefix}vaiEmbora*		- Me manda embora 😭
-❥ *${prefix}atualizarConvite*

_-_-_-_-_-_-_-_-_-_-_-_-_-_

⚠ [ *Owner Group Only* ] ⚠
Aqui estão os comandos do proprietário do grupo neste BOT!
-❥ *${prefix}expulsarTodos*

*O proprietário é o criador do grupo.*`
}

exports.textOwner = () => {
    return `⚠ [ *Owner Only* ] ⚠ 
Aqui estão os comandos de administração do BOT!

-❥ *${prefix}ban*		- Banir número
-❥ *${prefix}bc*		- Fazer transmissão
-❥ *${prefix}leaveAll*	- Deixar todos os grupos
-❥ *${prefix}clearAll*	- Deletar todos as conversas
-❥ *${prefix}listBlock*	- Lista os números bloqueados
-❥ *${prefix}getSes*	- Screenshot da tela do WhatsApp
-❥ *${prefix}listBlock*	- Lista os números bloqueados
-❥ *${prefix}botStat*	- Status atual do BOT`
}

exports.textDonate = () => {
    return `Olá, obrigado por usar este o Zyron BOT, para apoiar este projeto, você pode fazer uma doação:

*PIX:* d21e2b42-58e2-4a8f-b206-76d1a8a6f28d

– Ore para que este projeto continue a crescer.
– Ore para que o autor de tenha ideias criativas novamente.

*As doações serão usadas para o desenvolvimento e operação deste projeto.*

Obrigado! -Zyron`
}
