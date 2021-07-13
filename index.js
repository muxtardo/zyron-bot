const {
	create,
	Client
}	= require('@open-wa/wa-automate')
const {
	color,
	messageLog,
	jsonDecode
}	= require('./utils')
const figlet		= require('figlet')
const fs			= require('fs-extra')
const options		= require('./utils/options')
const msgHandler	= require('./msgHandler')
const settings		= JSON.parse(fs.readFileSync('./settings/settings.json'))
let { 
	groupLimit,
	memberLimit,
	prefix
}	= settings

const start = async (client = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })));
    console.log(color(figlet.textSync('ZYRON BOT', { font: 'Ghost', horizontalLayout: 'default' })));
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })));
    console.log(color('[DEV]'), color('fmedeiros95', 'yellow'));
    console.log(color('[~>>]'), color('BOT Started!', 'green'));

    // Force it to keep the current session
    client.onStateChanged((state) => {
        console.log('[~>>]', state);
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
			client.forceRefocus();
		}
    })
    
    // listening on message
    client.onMessage((async (message) => {
        client.getAmountOfLoadedMessages()
			.then((msgTotal) => {
				if (msgTotal >= 3000) {
					console.log('[~>>]', color(`Loaded Message Reach ${msgTotal}, cuting message cache...`, 'yellow'));
					client.cutMsgCache();
				}
			});

		msgHandler(client, message);
    }))

    // when someone enters/leaves from the group
    client.onGlobalParticipantsChanged(async (event) => {
        console.log(event);
        const host			= await client.getHostNumber() + '@c.us';
		const gChat			= await client.getChatById(event.chat);
		const { name }		= gChat;
		const who			= event.who.replace('@c.us', '');

        const welcome		= jsonDecode(fs.readFileSync('./data/welcome.json'));
		const isWelcome		= welcome.includes(event.chat);

		// the condition when someone is invited/joined a group via a link
        if (event.action === 'add' && event.who !== host && isWelcome) {
           	await client.sendTextWithMentions(event.chat, `Olá @${who}!\nSeja bem vindo(a) ao grupo *${name}*!\n\n_– Leia a descrição do grupo para mais informações._\n\nQuer saber meus comandos? Escreva *${prefix}menu*\nAgora, divirta-se!✨`);
        }

		// the condition when someone is kicked/out of the group
        if (event.action === 'remove' && event.who !== host) {
            await client.sendTextWithMentions(event.chat, `@${who} saiu do grupo... Espero que algum dia ele(a) volte...`);
        }
    });

    // when a bot is invited to a group
    client.onAddedToGroup(async (chat) => {
        const groups = await client.getAllGroups();
         // the condition when the bot group limit has been reached, change it in the settings/settings.json file
         if (groups.length > groupLimit) {
            await client.sendText(chat.id, `Pô cara, eu to sem vagas para novos grupos no momento!`).then(() => {
                client.leaveGroup(chat.id);
                client.deleteChat(chat.id);
            })
        } else {
            let totalMem = chat.groupMetadata.participants.length;
            // the condition when the group member limit has not been reached, change it in the settings/settings.json file
            if (totalMem < memberLimit) {
                client.sendText(chat.id, `Pô cara, seu grupo tem que ter no minimo *${memberLimit}* participantes para que eu fique!`).then(() => {
                    client.leaveGroup(chat.id);
                    client.deleteChat(chat.id);
                })
            } else {
                client.sendText(chat.id, `Fala galerinha do grupo *${chat.contact.name}*, como vocês estão?\nEu me chamo *Zyron BOT*, para descobrir o que posso fazer, use o comando:\n*${prefix}menu*`);
            }
        }
    });

    client.onIncomingCall(( async (call) => {
        await client.sendText(call.peerJid, 'Não consigo receber chamadas. Se insistir, terei que te bloquear!')
        	.then(() => {
                console.log(call);
                // client.contactBlock(call.peerJid);
            });
    }));
	
    // Message log for analytic
    client.onAnyMessage((anal) => { 
        messageLog(anal.fromMe, anal.type)
    });
}

// Create session
create(options(true, start))
    .then(async (client) => start(client))
    .catch((err) => new Error(err))
