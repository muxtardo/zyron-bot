require('dotenv').config();
const {
	decryptMedia
}	= require('@open-wa/wa-automate');

const moment	= require('moment-timezone');
moment.tz.setDefault('America/Sao_Paulo');

const axios	= require('axios');
const fetch	= require('node-fetch');

const tiktod		= require('tiktok-scraper');
const Insta			= require('scraper-instagram');
const InstaClient	= new Insta();

const {
	exec
}	= require('child_process');

const { 
	menuId, 
	urlShortener, 
	translation, 
	images,
	api,
	vCard
}	= require('./lib');

const { 
	msgFilter, 
	color, 
	processTime, 
	isUrl,
	jsonEncode,
	jsonDecode
}	= require('./utils');

const {
	uploadImages,
	fetchBase64
}	= require('./utils/fetcher');

const fs		= require('fs-extra');

const API		= jsonDecode(fs.readFileSync('./settings/api.json'));
const settings	= jsonDecode(fs.readFileSync('./settings/settings.json'));

const banneds	= jsonDecode(fs.readFileSync('./data/banneds.json'));
const nsfw		= jsonDecode(fs.readFileSync('./data/nsfw.json'));
const users		= jsonDecode(fs.readFileSync('./data/users.json'));
const welcome	= jsonDecode(fs.readFileSync('./data/welcome.json'));

const _levelings	= jsonDecode(fs.readFileSync('./data/levelings.json'))
const _levels		= jsonDecode(fs.readFileSync('./data/levels.json'))

let antisticker	= jsonDecode(fs.readFileSync('./data/antisticker.json'));
let stickerspam	= jsonDecode(fs.readFileSync('./data/stickerspam.json'));
let antilink	= jsonDecode(fs.readFileSync('./data/antilink.json'));

const ttsGB		= require('node-gtts')('pt');

const errorUrl	= 'https://steamuserimages-a.akamaihd.net/ugc/954087817129084207/5B7E46EE484181A676C02DFCAD48ECB1C74BC423/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false';
const errorUrl2	= 'https://steamuserimages-a.akamaihd.net/ugc/954087817129084207/5B7E46EE484181A676C02DFCAD48ECB1C74BC423/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false';

let { 
	ownerNumber, 
	groupLimit, 
	memberLimit,
	prefix,
	botAdmins,
	botName
}	= settings;

const {
	apiMhBar,
	tokenInsta
}	= API;

module.exports = msgHandler = async (client, message) => {
	try {
		const {
			type, id, from, t, sender, isGroupMsg, chat,
			chatId, caption, isMedia, mimetype,
			quotedMsg, quotedMsgObj, mentionedJidList, author
		}	= message;
		let {
			body
		}	= message;
		var {
			name,
			formattedTitle
		}	= chat;
		let {
			pushname,
			verifiedName,
			formattedName
		}	= sender;

		// verifiedName is the name of someone who uses a business account
		pushname	= pushname || verifiedName || formattedName; 

		const mess	= {
			wait:		'[⏳] Em andamento! Aguarde um momento...',
			success:	'[✅] Tá na mão chefe!',
			error:		{
				St:	`[❌] Envie uma imagem com a legenda *${prefix}sticker* ou reponda uma imagem que foi enviada`,
				Qm:	'[❌] Ocorreu um erro, talvez o tema não esteja disponível!',
				Ig:	'[❌] Ocorreu um erro, talvez porque a conta seja privada',
				Ki:	'[❌] Os bots não podem expulsar administradores do grupos!',
				Ad:	'[❌] Não é possível adicionar alvo, talvez porque seja privado',
				Iv:	'[❌] O link que você enviou é inválido!',
				nG:	'[❌] Este comando só pode ser usado em grupos!',
				oA:	'[❌] Este comando só pode ser usado por administradores do grupo!',
				oO:	'[❌] Este comando só pode ser usado pelo dono do BOT!',
				bA:	'[❌] Este comando só pode ser usado quando o BOT é um administrador!',
				cA: '[❌] Então, eu não fui capaz de atender sua solicitação no momento.',
				nC: `[❌] Cara, esse comando não existe, mas você pode sugerir, use o comando *${prefix}sugerir* e envie uma sugestão para o desenvolvedor.`,
			}
		}

		const botNumber			= await client.getHostNumber() + '@c.us'
		const blockNumber		= await client.getBlockedIds();
		const groupId			= isGroupMsg ? chat.groupMetadata.id : ''
		const groupAdmins		= isGroupMsg ? await client.getGroupAdmins(groupId) : ''
		const isGroupAdmins		= groupAdmins.includes(sender.id) || false
		const chats				= (type === 'chat') ? body : (type === 'image' || type === 'video') ? caption : ''
		const pengirim			= sender.id
		const GroupLinkDetector	= antilink.includes(chatId)
		const AntiStickerSpam	= antisticker.includes(chatId)
		const stickermsg		= message.type === 'sticker'
		const isBotGroupAdmins	= groupAdmins.includes(botNumber) || false

		// Bot Prefix
		const commands		= caption || body || ''
		const falas			= commands.toLowerCase();

		body				= (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(prefix)) ? caption : ''
		const command		= body.slice(1).trim().split(/ +/).shift().toLowerCase()
		const arg			= body.trim().substring(body.indexOf(' ') + 1)
		const args			= body.trim().split(/ +/).slice(1)
		const isCmd			= body.startsWith(prefix)
		const uaOverride	= process.env.UserAgent
		const url			= args.length !== 0 ? args[0] : ''
		const isQuotedImage	= quotedMsg && quotedMsg.type == 'image'
		const isQuotedVideo	= quotedMsg && quotedMsg.type == 'video'
		
		// [IDENTIFY]
		const isAdminBot	= botAdmins.includes(pengirim);
		const isOwnerBot	= ownerNumber.includes(pengirim)

		const isBanned		= banneds.includes(pengirim)
		const isNsfw		= isGroupMsg ? nsfw.includes(from) : false
		const isUser		= typeof users[pengirim] !== 'undefined';
		const isLevelingOn	= isGroupMsg ? _levelings.includes(groupId) : false
		const isWelcomeOn	= isGroupMsg ? welcome.includes(groupId) : false

		// [BETA] Avoid Spam Message
		if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg) {
			return console.log(
				color('[SPAM]', 'red'),
				color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'),
				color(`${command} [${args.length}]`),
				'from', color(pushname)
			);
		}
		if (isCmd && msgFilter.isFiltered(from) && isGroupMsg) {
			return console.log(
				color('[SPAM]', 'red'),
				color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'),
				color(`${command} [${args.length}]`),
				'from', color(pushname),
				'in', color(name || formattedTitle)
			);
		}

		//
		if (isCmd && !isGroupMsg) {
			console.log(
				color('[EXEC]'),
				color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'),
				color(`${command} [${args.length}]`),
				'from', color(pushname)
			);
		}
		if (isCmd && isGroupMsg) {
			console.log(
				color('[EXEC]'),
				color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'),
				color(`${command} [${args.length}]`),
				'from', color(pushname),
				'in', color(name || formattedTitle)
			);
		}

		/******BEGIN OF FUNCTIONS INPUT******/
		const getLevelingXp = (userId) => {
            let position = false;
            Object.keys(_levels[groupId]).forEach((i) => {
                if (_levels[groupId][i].uid === userId) {
                    position = i;
                }
            })
            if (position !== false) {
                return _levels[groupId][position].xp;
            }
        }
		const getLevelingLevel = (userId) => {
            let position = false;
            Object.keys(_levels[groupId]).forEach((i) => {
                if (_levels[groupId][i].uid === userId) {
                    position = i;
                }
            })
            if (position !== false) {
                return _levels[groupId][position].level
            }
        }
		const getLevelingId = (userId) => {
            let position = false;
            Object.keys(_levels[groupId]).forEach((i) => {
                if (_levels[groupId][i].uid === userId) {
                    position = i;
                }
            })
            if (position !== false) {
                return _levels[groupId][position].uid;
            }
        }
		const addLevelingXp = (userId, amount) => {
            let position = false;
            Object.keys(_levels[groupId]).forEach((i) => {
                if (_levels[groupId][i].uid === userId) {
                    position = i;
                }
            })

			if (position !== false) {
                _levels[groupId][position].xp += amount;
                fs.writeFileSync('./data/levels.json', jsonEncode(_levels));
            }
        }
        const addLevelingLevel = (userId) => {
            let position = false;
            Object.keys(_levels[groupId]).forEach((i) => {
                if (_levels[groupId][i].uid === userId) {
                    position = i;
                }
            })
            if (position !== false) {
				var exp		= _levels[groupId][position].xp;
				var level	= _levels[groupId][position].level;
				var xpDiff	= exp - getLevelingNeedXp(level);
                _levels[groupId][position].xp	-= xpDiff;
				_levels[groupId][position].level	+= 1;
                fs.writeFileSync('./data/levels.json', jsonEncode(_levels));
            }
        }
        const addLevelingId = (userId) => {
            _levels[groupId].push({
				uid:	userId,
				xp:		1,
				level:	1
			});

			fs.writeFileSync('./data/levels.json', jsonEncode(_levels));
        }
		const getLevelingNeedXp = (currentLevel) => {
			return 5000 * (Math.pow(2, currentLevel) - 1);
		}

		const highamount = function(amount, decimalCount = 0, decimal = ",", thousands = ".") {
			try {
				decimalCount	= Math.abs(decimalCount);
				decimalCount	= isNaN(decimalCount) ? 2 : decimalCount;

				const negativeSign	= amount < 0 ? "-" : "";

				let i	= parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
				let j	= (i.length > 3) ? i.length % 3 : 0;

				return negativeSign +
					(j ? i.substr(0, j) + thousands : '') +
					i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
					(decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
			} catch (err) {
					console.log(err);
			}
		}

		function isStickerMsg(id){
			if (isOwner) {
				return false;
			}

			let found	= false;
			for (let i of stickerspam){
				if (i.id === id) {
					if (i.msg >= 7) {
						found === true 
						client.reply(from, `*[ANTI STICKER SPAM]*\nPô cara, tu ficou spamando figurinhas no grupo e por isso vou ter de te expulsar, nada pessoal, OK?`, message.id).then(() => {
							client.removeParticipant(groupId, id);
						}).then(() => {
							const cus = id;
							var found = false;
							Object.keys(stickerspam).forEach((i) => {
								if (stickerspam[i].id == cus) {
									found = i;
								}
							})

							if (found !== false) {
								stickerspam[found].msg = 1;
								const result = '✅ DB Sticker Spam has been reset';
								console.log(stickerspam[found])
								fs.writeFileSync('./data/stickerspam.json', jsonEncode(stickerspam));
								client.sendText(from, result);
							} else {
								client.reply(from, `${monospace(`Não há números no banco de dados mano.`)}`, id);
							}
						})

						return true;
					} else {
						found === true;

						return false;
					}   
				}
			}

			if (found === false) {
				stickerspam.push({
					id:		id,
					msg:	1
				});
				fs.writeFileSync('./data/stickerspam.json', jsonEncode(stickerspam));

				return false;
			}  
		}

		const sleep = async (ms) => {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		const isValidWA	= async (waId) => {
			var check = await client.checkNumberStatus(toAdd);
			return check.status == 200;
		}

		const getRandom	= (list) => {
			return list[Math.floor((Math.random() * list.length))];
		}

		function addStickerCount(id) {
			if (isOwner) {
				return;
			}

			var found = false;
			Object.keys(stickerspam).forEach((i) => {
				if (stickerspam[i].id == id) {
					found = i;
				}
			})

			if (found !== false) {
				stickerspam[found].msg += 1;
				fs.writeFileSync('./data/stickerspam.json', jsonEncode(stickerspam));
			}
		}

		// Sistema anti-convite
		if (isGroupMsg && GroupLinkDetector && !isGroupAdmins && !isOwner) {
			if (chats.match(/(https:\/\/chat.whatsapp.com)/gi)) {
				const check = await client.inviteInfo(chats);
				if (!check) {
					return;
				} else {
					client.reply(from, `*[GROUP LINK DETECTOR]*\nPô chefe, você ta enviando convite para outros grupos, algo que não é permitido neste grupo! Vou ter que te expulsar ta? :(`, id)
						.then(() => {
							client.removeParticipant(groupId, pengirim);
						});
				}
			}
		}


		if (isGroupMsg && AntiStickerSpam && !isGroupAdmins && !isOwner) {
			if (stickermsg === true){
				if (isStickerMsg(serial)) {
					return;
				}

				addStickerCount(serial);
			}
		}

		// function leveling
		if (isGroupMsg && isLevelingOn && !isCmd && !msgFilter.isFiltered(from)) {
            const currentLevel	= getLevelingLevel(pengirim);
            const checkId		= getLevelingId(pengirim);
            try {
                if (currentLevel === undefined && checkId === undefined) {
					addLevelingId(pengirim);
				}

				const amountXp		= Math.floor(Math.random() * 10) + 50;
                const requiredXp	= getLevelingNeedXp(currentLevel);
                const getLevel		= getLevelingLevel(pengirim);
                addLevelingXp(pengirim, amountXp)
                if (requiredXp <= getLevelingXp(pengirim)) {
                    addLevelingLevel(pengirim);

					var sem		= pengirim.replace(/@c.us/g,'');
                    await client.sendTextWithMentions(from, `*「 SUBIU DE NÍVEL! 」*\n\n➸ *Nome:* @${sem}\n➸ *XP:* ${highamount(getLevelingXp(pengirim))} / ${highamount(getLevelingNeedXp(getLevel))}\n➸ *Nível:* ${highamount(getLevel)} -> ${highamount(getLevelingLevel(pengirim))}\n\nParabéns!! 🎉🎉`);
                }
            } catch (err) {
                console.error(err);
            }
        }

		// [BETA] Avoid Spam Message
		if (isCmd && !msgFilter.isFiltered(from)) {
			msgFilter.addFilter(from);
		}

		// [AUTO READ] Auto read message 
		client.sendSeen(chatId);

		// Filter Banned People
		if (isBanned) {
			return console.log(
				color('[BAN]', 'red'),
				color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'),
				color(`${command} [${args.length}]`),
				'from', color(pushname)
			);
		}

		// Falas --->
			switch (falas) {
				case botName: 
					await client.reply(from, `Opa, ta falando de mim?\nDigita *${prefix}menu* pra eu te mostrar o que sei fazer...`, id);
					break;
				case 'sextar':
				case 'sexto':
				case 'sextou':
				case 'sextô':
				case 'sextôu':
					await client.reply(from, 'Ôpa, bora??', id);
					await client.sendPtt(from, './media/filhoRapariga.mp3', id);
					var gif	= await fs.readFileSync('./media/sextou.webp', { encoding: "base64" })
					await client.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
					break;
				case 'bom dia ' + botName:
					await client.reply(from, 'Bom dia? Só se for pra você que dormiu a noite toda...', id)

					var gif	= await fs.readFileSync('./media/tudosobcontrole.webp', { encoding: "base64" })
					await client.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
					break;
				case 'boa tarde ' + botName:
					await client.reply(from, `Boa tarde, são ${moment().format('HH:mm')} e vc ta ai atoa né? Tô ligando pro seu chefe...`, id)
					break;
				case 'boa noite ' + botName:
					await client.reply(from, `Boa noite pra você também! já são ${moment().format('HH:mm')} to indo nessa também...`, id)
					break;
				case 'oi ' + botName:
					await client.reply(from, `Fala, o que ta pegando?\nSei fazer algumas coisas, digita *${prefix}menu* pra eu te mostrar...`, id)
					break;
			}
		// <---

		switch (command) {
			case 'criargrupo':
				if (!isAdminBot) {
					return client.reply(from, mess.error.oO, id);
				}

				console.log(author);

				const listToAdd	= [ author ];
				for (var i = 1; i < args.length; i++) {
					var toAdd	= args[i].replace(/@/g,'') + '@c.us';
					var isValid	= await isValidWA(toAdd);

					if (!listToAdd.includes(toAdd) && isValid) {
						listToAdd.push(toAdd);
					}
				}
				console.log(listToAdd);

				// let gpId = false;
				// await client.createGroup(`Grupo do Zyron BOT`, listToAdd)
				// 	.then(async (res) => {
				// 		gpId	= `${res.gid.user}@${res.gid.server}`;
				// 	})
				// 	.catch((err) => client.reply(from, mess.error.cA, id));

				// if (gpId) {
				// 	setTimeout(async () => {
				// 		await client.promoteParticipant(gpId, author);
				// 		await client.sendText(gpId, 'O grupo foi criado! ✨️');
				// 	}, 1000);
				// }
				break;
			case 'aiquote':
            	var aiQuote	= await axios.get("http://inspirobot.me/api?generate=true")
            	await client.sendFileFromUrl(from, aiQuote.data, 'quote.jpg', 'Powered By http://inspirobot.me With ❤️' , id);
            	break;
			case 'estapear':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				var person	= author.replace('@c.us', '');
    	        await client.sendGiphyAsSticker(from, 'https://media.giphy.com/media/S8507sBJm1598XnsgD/source.gif');
				await client.sendTextWithMentions(from, `@${person} *estapeando* ${args[0]}`);
	            break;
			case 'infogrupo':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				var groupMembers	= chat.groupMetadata.participants.length;
				var groupDesc		= chat.groupMetadata.desc;
				var groupName		= name;
				var groupCreate		= moment(chat.groupMetadata.creation * 1000).format('DD/MM/YYYY HH:mm:ss')

				await client.sendText(from, `*${groupName}*\n🌐️ *Membros:* ${highamount(groupMembers)}\n💌️ *Criado em:* ${groupCreate}\n⚜️ *NSFW:* ${(isNsfw ? '✅ ATIVO' : '❌ INATIVO')}\n📃️ *Descrição*\n${groupDesc}`, id)
					.catch((err) => console.log(err));
				break;
			case 'covid':
				axios.get(`https://coronavirus-19-api.herokuapp.com/countries/brazil`)
					.then((res) => {
						var data	= res.data;
						client.reply(from, `🌎️ *Informações COVID-19*\n\n✨️ *Total de Casos:* ${highamount(data.cases)}\n☣️ *Total de Mortes:* ${highamount(data.deaths)}\n⛩️ *Casos Ativos:* ${highamount(data.active)}`, id);
					})
					.catch((err) => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'sugerir':
				if (args.length == 0) {
					return client.reply(from, `Envie uma sugestão para o criador\nComando: *${prefix}sugerir texto*\n\n*Exemplo:* ${prefix}sugerir Cria um comando que me da o resultado da mega!`, id);
				}

				const suggestText	= body.slice(9);
				if (suggestText.length < 10 || suggestText.length > 300) {
					return client.reply(from, 'A sua sugestão deve ter entre 10 e 300 caracteres!', id);
				}

				const suggestNum	= pengirim.replace(/@c.us/g,'');
				const suggestRep	= `📖〘 *S U G E S T Ã O* 〙📖\n-❥ *Quem enviou?* @${suggestNum}\n-❥ *Qual a sugestão?* ${suggestText}`;
				await client.sendTextWithMentions(ownerNumber, suggestRep)
					.then(() => {
						client.reply(from, 'Sua sugestão foi enviada ao criador do BOT!', id);
					})
					.catch((err) => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'reportar':
				if (args.length == 0) {
					return client.reply(from, `Envie um relatório de problema\nComando: *${prefix}reportar texto*\n\n*Exemplo:* ${prefix}reportar O bot não responde, resolve ai!`, id);
				}

				const bugText	= body.slice(9);
				if (bugText.length < 10 || bugText.length > 300) {
					return client.reply(from, 'O seu relatório deve ter entre 10 e 300 caracteres!', id);
				}

				const bugNum	= pengirim.replace(/@c.us/g,'');
				const bugRep	= `⚠️〘 *R E L A T Ó R I O* 〙⚠️\n-❥ *Quem enviou?* @${bugNum}\n-❥ *Qual o problema?* ${bugText}`;
				await client.sendTextWithMentions(ownerNumber, bugRep)
					.then(() => {
						client.reply(from, 'O relatório foi enviado ao proprietário do BOT!', id);
					})
					.catch((err) => {
						console.log(err);
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'leveling':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args.length !== 1) {
					client.reply(from, `*Como usar:*\n${prefix}leveling on\n${prefix}leveling off`, id);
				}

				if (args[0] == 'on') {
					if (isLevelingOn) {
						return client.reply(from, 'O sistema de níveis já está ativo!', id);
					}

					_levelings.push(chatId);
					fs.writeFileSync('./data/levelings.json', jsonEncode(_levelings));

					_levels[groupId] = [];
					fs.writeFileSync('./data/levels.json', jsonEncode(_levels));

					client.reply(from, 'O sistema de nível foi ativado!', id);
				} else if (args[0] == 'off') {
					if (!isLevelingOn) {
						return client.reply(from, 'O sistema de níveis já está inativo!', id);
					}

					let xporn	= _levelings.indexOf(chatId);
					_levelings.splice(xporn, 1);
					fs.writeFileSync('./data/levelings.json', jsonEncode(_levelings));

					delete _levels[groupId];
					fs.writeFileSync('./data/levels.json', jsonEncode(_levels));

					client.reply(from, 'O sistema de nível foi desativado!', id);
				} else {
					client.reply(from, `Como usar:\n${prefix}leveling on\n${prefix}leveling off`, id);
				}
            break;
			case 'level':
                if (!isLevelingOn) {
					return client.reply(from, 'O sistema de níveis está inativo!', id);
				}

				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				const userLevel	= getLevelingLevel(pengirim)
                const userXp	= getLevelingXp(pengirim)
                if (userLevel === undefined && userXp === undefined) {
					addLevelingId(pengirim);
					return client.reply(from, mess.error.cA, id);
				}

				var sem		= pengirim.replace(/@c.us/g,'');
                var result	= `─❥ *LEVEL*\n  ├─❥ *Nome:* @${sem}\n  ├─❥ *XP:* ${highamount(userXp)} / ${highamount(getLevelingNeedXp(userLevel))}\n  └─❥ *Nível:* ${highamount(userLevel)}`;
				client.sendTextWithMentions(from, result)
            		.catch((err) => {
                        console.error(err);
                    })
            break;
			case 'cadastro':
				if (isUser) {
					return client.reply(from, '[❌] Você já está cadastrado!');
				}

				if (args.length !== 1) {
					return reply(`Formato inválido!\nComando: ${prefix}cadastro nome|idade\nExemplo: ${prefix}cadastro Felipe|26`);
				}

				users.push(sender);
				fs.writeFileSync('./data/users.json', jsonEncode(users));

				client.reply(from, '[✅] O seu cadastro foi realizado com sucesso!', id);
				break
			// Cotações
			case 'dolar':
				api.quotation('USD', 'BRL')
					.then(async (res) => {
						const textQuotation = `*${res.name}*\n\n*Cotação atual:* R$ ${highamount(res.bid, 2)}`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'euro':
				api.quotation('EUR', 'BRL')
					.then(async (res) => {
						const textQuotation = `*${res.name}*\n\n*Cotação atual:* R$ ${highamount(res.bid, 2)}`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'libra':
				api.quotation('GBP', 'BRL')
					.then(async (res) => {
						const textQuotation = `*${res.name}*\n\n*Cotação atual:* R$ ${highamount(res.bid, 2)}`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'bitcoin':
				api.cripto('BTC')
					.then(async (res) => {
						const textQuotation = `*Bitcoin / Real*\n\n*Mínima:* R$ ${highamount(res.low, 2)}\n*Máxima:* R$ ${highamount(res.high, 2)}\n\n*Cotação atual:* R$ ${highamount(res.last, 2)}\n\n*Fonte:* https://www.mercadobitcoin.com.br`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'litecoin':
				api.cripto('LTC')
					.then(async (res) => {
						const textQuotation = `*Litecoin / Real*\n\n*Mínima:* R$ ${highamount(res.low, 2)}\n*Máxima:* R$ ${highamount(res.high, 2)}\n\n*Cotação atual:* R$ ${highamount(res.last, 2)}\n\n*Fonte:* https://www.mercadobitcoin.com.br`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'ethereum':
				api.cripto('ETH')
					.then(async (res) => {
						const textQuotation = `*Ethereum / Real*\n\n*Mínima:* R$ ${highamount(res.low, 2)}\n*Máxima:* R$ ${highamount(res.high, 2)}\n\n*Cotação atual:* R$ ${highamount(res.last, 2)}\n\n*Fonte:* https://www.mercadobitcoin.com.br`;
						client.reply(from, textQuotation, id);
					});
				break;
			case 'ripple':
				api.cripto('XRP')
					.then(async (res) => {
						const textQuotation = `*Ripple / Real*\n\n*Mínima:* R$ ${highamount(res.low, 2)}\n*Máxima:* R$ ${highamount(res.high, 2)}\n\n*Cotação atual:* R$ ${highamount(res.last, 2)}\n\n*Fonte:* https://www.mercadobitcoin.com.br`;
						client.reply(from, textQuotation, id);
					});
				break;
			// Menu and TnC
			case 'ping':
				await client.sendText(from, `Pong!!!!\n*Speed:* ${processTime(t, moment())} _Second_`);
				break;
			case 'tnc':
				// await client.sendText(from, menuId.textTnC());
				break;
			case 'menu':
			case 'ajuda':
				var sem	= pengirim.replace(/@c.us/g,'');
				await client.sendTextWithMentions(from, menuId.textMenu(sem))
					.then(function() {
						if (isGroupMsg && isGroupAdmins) {
							client.reply(from, `Menu de Administração: *${prefix}menuAdmin*`, id);
						}
					});
				break;
			case 'menuadmin':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				await client.sendText(from, menuId.textAdmin());
				break;
			case 'menuowner':
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				await client.sendText(from, menuId.textOwner())
				break;
			case 'aasg':
				// const $aasgThumb	= await fetchBase64('https://telegra.ph/file/064a8ab163491fa471d21.png');
				await client.sendMessageWithThumb(
					'./media/aasg.png',
					'https://allstarsgame.com.br',
					'Anime All-Stars Game',
					'Anime All-Stars Game é o novo jogo para fãs de anime, em nosso jogo você será um dos personagens emblemáticos dos principais animes que fizeram e fazem parte de nossa vida.',
					'Cara, tá esperando o que 🤪? Vem logo! Experimente este mundo mágico dos animes, derrote seus inimigos, seja um grande herói 🦸‍♂️ ou um poderoso vilão 🥷!',
					from
				);
				break;
			case 'cadevoce':
				const latitude		= 40.78097055110372;
				const longitude		= -73.96647984371137;
				const $locationMsg	= await client.sendLocation(from, latitude, longitude, 'Miami Beach Housing Authority Section 8');
				const $ttsText		= 'Quem acordou, acordou! Quem não acordou, cocoricó né fiiiio!!! Essssqueceee, o pai ta em *Central Park - NY*, essstouuuuradoooo!';
				client.reply(from, $ttsText, $locationMsg);
				break;
			case 'pix':
			case 'doacao': 
			case 'doar':
			case 'fazumpix':
			case 'apoiarprojeto':
				await client.sendText(from, menuId.textDonate());
				break;
			case 'pix':
				const $porra = await client.sendPaymentRequest(from, 1000, 'BRL')
					.then((res) => {
						console.log(res);
					})
					.catch((err) => {
						console.log(err);
					});
				console.log($porra);
				break;
			case 'dev':
			case 'criador':
			case 'meucriador':
				const vCardOwner = vCard.vCardOwner();
				await client.sendVCard(from, vCardOwner)
					.then(() => {
						client.sendText(from, 'Se você quiser solicitar um novo recurso, converse com ele!');
					})
					.catch((err) => {
						console.log(err);
					});
				break;
			case 'entraaqui':
				if (args.length !== 1) {
					return client.reply(from, `Quer me adicionar no seu grupo? Me convida\nou usa o comando: *${prefix}entraAqui [link_convite]*`, id)
				}

				let inviteLink	= args[0];
				let isLink		= inviteLink.match(/(https:\/\/chat.whatsapp.com)/gi);
				if (!isLink) {
					return client.reply(from, mess.error.Iv, id);
				}
				
				const inviteDetails	= await client.inviteInfo(inviteLink);

				if (!isOwnerBot) {
					var myGroups = await client.getAllGroups();
					if (myGroups.length >= groupLimit) {
						return client.reply(from, `[❌] Desculpa, mas eu não tenho uma vaga disponível no momento.`, id);
					}

					var members	= inviteDetails.participants;
					if (typeof members == 'undefined' || members.length < memberLimit) {
						return client.reply(from, `[❌] Desculpa, mas eu não consigo ne manter em um grupo com menos de ${memberLimit} membros.`, id)
					}
				}

				await client.joinGroupViaLink(inviteLink)
					.then(async () => {
						await client.reply(from, '[✅] Entrou no grupo!', id);
						await client.sendText(inviteDetails.id, `Fala galerinha do grupo *${inviteDetails.subject}*, como vocês estão?\nEu me chamo *${botName}*, para descobrir o que posso fazer, use o comando *${prefix}menu*`);
					})
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;

			// Sticker Converter
			case 'stickertoimg':
			case 'stimg':
				if (quotedMsg && quotedMsg.type == 'sticker') {
					const mediaData	= await decryptMedia(quotedMsg)
					client.reply(from, mess.wait, id);

					const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`;
					await client.sendFile(from, imageBase64, 'imgsticker.jpg', '[✅] Pronto, agora a figurinha é uma foto!', id);
				} else if (!quotedMsg) {
					return client.reply(from, `[❌] Cadê a figurinha? Responda a figurinha que deseja converter com o comando:\n\n${prefix}stickertoimg`, id);
				}
				break;
			case 'teste':
				await client.simulateTyping(from, true);
				setTimeout(function() {
					client.simulateTyping(from, false);
				}, 5000);
				break;
			// Sticker Creator
			case 'sticker':
			case 'figurinha':
				if ((isMedia || isQuotedImage || isQuotedVideo) && args.length === 0) {
					await client.reply(from, mess.wait, id);

					var encryptMedia	= isQuotedImage || isQuotedVideo ? quotedMsg : message;
					var _mimetype		= isQuotedImage || isQuotedVideo ? quotedMsg.mimetype : mimetype;
					var mediaData		= await decryptMedia(encryptMedia, uaOverride);

					if (_mimetype === 'video/mp4' || _mimetype === 'image/gif') {
						if (encryptMedia.duration < 30) {
							var imageBase64		= `data:${_mimetype};base64,${mediaData.toString('base64')}`;
							await client.sendMp4AsSticker(from, imageBase64, null, { stickerMetadata: true, author: botName, pack: "PackDo" + botName, fps: 10, square: '512', loop: 0 })
								.then(() => {
									client.reply(from, '[✅] Pega aqui sua figurinha!', id);
								})
								.catch((err) => {
									console.log(err);
									client.reply(from, 'Desculpe, o arquivo é muito grande!', id)
								});
						} else {
							await client.reply(from, '[❌] Pô cara, tu tem que me mandar algo ai de no máximo 30 segundos!', id)
						}
					} else {
						var imageBase64		= `data:${_mimetype};base64,${mediaData.toString('base64')}`;
						await client.sendImageAsSticker(from, imageBase64, { author: botName, pack: "PackDo" + botName, keepScale: true })
							.then(() => {
								client.reply(from, '[✅] Pega aqui sua figurinha!', id);
							})
							.catch((err) => {
								console.log(err);
								client.reply(from, 'Desculpe, o arquivo é muito grande!', id)
							});
					}
				} else if (args.length === 1) {
					if (!isUrl(url)) {
						await client.reply(from, mess.error.Iv, id);
					}

					await client.reply(from, mess.wait, id);

					client.sendStickerfromUrl(from, url)
						.then((r) => {
							if (!r && r !== undefined) {
								client.sendText(from, '[❌] Pô cara, tu tem que me mandar um link de alguma imagem ou GIF né!');
							} else {
								client.reply(from, '[✅] Pega aqui sua figurinha!', id);
							}
						})
						.catch((err) => {
							console.log(err);
							client.reply(from, 'Desculpe, o arquivo é muito grande!', id)
						});
				} else {
					await client.reply(from, `[❌] Cadê a foto ou o GIF?\n\nEnvie ou responda uma foto/gif com o comando\n${prefix}sticker\n\nOu então me envia uma mensagem com o comando:\n*${prefix}sticker [link_imagem/gif]*`, id);
				}
				break;
			case 'stickergiphy':
				if (args.length !== 1) {
					return client.reply(from, `[❌] O formato da mensagem está errado.\nDigite uma mensagem com ${prefix}stickergiphy <link_giphy>`, id);
				}

				const isGiphy		= url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'));
				const isMediaGiphy	= url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'));
				const isMedia2Giphy	= url.match(new RegExp(/https?:\/\/media2.giphy.com\/media/, 'gi'));
				if (isGiphy) {
					const getGiphyCode	= url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'));
					if (!getGiphyCode) {
						return client.reply(from, '[❌] Pô, não achai este link do Giphy', id);
					}

					const giphyCode		= getGiphyCode[0].replace(/[-\/]/gi, '');
					const smallGifUrl	= 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif';
					client.sendGiphyAsSticker(from, smallGifUrl)
						.then(() => {
							client.reply(from, '[✅] Pega aqui sua figurinha!');
						})
				} else if (isMediaGiphy || isMedia2Giphy) {
					const gifUrl	= url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
					if (!gifUrl) {
						return client.reply(from, '[❌] Pô, não achai este link do Giphy', id);
					}

					const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
					client.sendGiphyAsSticker(from, smallGifUrl)
						.then(() => {
							client.reply(from, '[✅] Pega aqui sua figurinha!');
						})
						.catch(() => {
							client.reply(from, mess.error.cA, id)
						})
				} else {
					await client.reply(from, `Exemplo: *${prefix}stickerGiphy [link_giphy]*`, id)
				}
				break;
			case 'antisticker':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args[0] == 'on') {
					var check	= antisticker.includes(chatId);
					if (check) {
						// if number already exists on database
						return client.reply(from, '*[Anti Sticker SPAM]* já está ativo no grupo!', id);
					} else {
						antisticker.push(chatId);
						fs.writeFileSync('./data/antisticker.json', jsonEncode(antisticker));
						client.reply(from, '*[Anti Sticker SPAM]* Foi ativado!\nSe o participante enviar mais de 7 figurinhas seguidas eu irei expulsá-lo!', id);
					}
				} else if (args[0] == 'off') {
					var check = antilink.includes(chatId);
					if (check) {
						// if number already exists on database
						return client.reply(from, '*[Anti Sticker SPAM]* já está inativo no grupo!', id);
					} else {
						let nixx	= antisticker.indexOf(chatId);
						antisticker.splice(nixx, 1);
						fs.writeFileSync('./data/antisticker.json', jsonEncode(antisticker));
						client.reply(from, '*[Anti Sticker SPAM]* foi desabilitado', id);
					}
				} else {
					client.reply(from, `*Selecione:* on / off\n\n*[Anti Sticker SPAM]*\nSe o participante enviar mais de 7 figurinhas seguidas eu irei expulsá-lo!`, id)
				}
				break;
			case 'antilink':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args[0] == 'on') {
					var check = antilink.includes(chatId);
					if (check) {
						// if number already exists on database
						return client.reply(from, '*[Anti Group Link]* já está ativo no grupo!', id);
					} else {
						antilink.push(chatId);
						fs.writeFileSync('./data/antilink.json', jsonEncode(antilink));
						client.reply(from, '*[Anti Group Link]* Foi ativado!\nSe o participante enviar um convite para grupo, eu irei expulsá-lo!', id);
					}
				} else if (args[0] == 'off') {
					var check = antilink.includes(chatId);
					if (!check) {
						// if number already exists on database
						return client.reply(from, '*[Anti Group Link]* já está inativo no grupo!', id);
					} else {
						let nixx = antilink.indexOf(chatId);
						antilink.splice(nixx, 1);
						fs.writeFileSync('./data/antilink.json', jsonEncode(antilink));
						client.reply(from, '*[Anti Group Link]* foi desabilitado', id);
					}
				} else {
					client.reply(from, `*Selecione:* on / off\n\n*[Anti Group Link]*\nSe o participante enviar um convite para grupo, eu irei expulsá-lo!`, id);
				}
				break;
			case 'qrread':
				if ((isMedia || isQuotedImage) && args.length === 0) {
					await client.reply(from, mess.wait, id);

					var encryptMedia	= isQuotedImage ? quotedMsg : message;
					var _mimetype		= isQuotedImage ? quotedMsg.mimetype : mimetype;
					var mediaData		= await decryptMedia(encryptMedia, uaOverride);
					var getUrl2			= await uploadImages(mediaData, false);
					api.qrread(getUrl2)
						.then(async (res) => {
							await client.reply(from, res, id);
						});
				} else if (args.length === 1) {
					if (!isUrl(args[0])) {
						await client.reply(from, mess.error.Iv, id);
					}

					await client.reply(from, mess.wait, id);
					api.qrread(args[0])
						.then(async (res) => {
							await client.reply(from, res, id);
						});
				} else {
					await client.reply(from, `[❌] Cadê a imagem?\n\nEnvie ou responda uma foto com o comando\n${prefix}qrread\n\nOu então me envia uma mensagem com o comando:\n*${prefix}qrread [link_qrcode]*`, id);
				}
				break;
			case 'qrcode':
				if (args.length !== 2) {
					return client.reply(from, `Use o comando:\n${prefix}qrcode [palavra/url] [tamanho]\n\nExemplo: ${prefix}qrcode https://google.com 300\n\n*Tamanho mínimo 100px e máximo 500px*`, id);
				}

				await client.reply(from, mess.wait, id);
				api.qrcode(args[0], args[1])
					.then(async (res) => {
						await client.sendFileFromUrl(from, res, '', mess.success, id);
					});
				break;
			case 'logoph':
			case 'ph':
				if (args.length === 1) {
					return client.reply(from, `Comando *${prefix}ph |Texto1| Texto2*,\n\n Exemplo: *${prefix}logoph |Dimas| HUB*`, id);
				}

				argz = body.trim().split('|');
				if (argz.length >= 2) {
					await client.reply(from, mess.wait, id);
					const lpornhub	= argz[1];
					const lpornhub2	= argz[2];
					if (lpornhub > 10) {
						return client.reply(from, '*Texto1 é muito longo!*\n_Máximo de 10 letras!_', id);
					}

					if (lpornhub2 > 10) {
						return client.reply(from, '*Texto2 é muito longo!*\n_Máximo de 10 letras!_', id);
					}

					var urlPH	= `https://docs-jojo.herokuapp.com/api/phblogo?text1=${lpornhub}&text2=${lpornhub2}`;
					client.sendFileFromUrl(from, urlPH, '', mess.success, id);
				} else {
					await client.reply(from, `[❌] Formato incorreto!\nComando *${prefix}logoph |Texto1| Texto2*,\n\nExemplo: *${prefix}logoph |Dimas| HUB*`, id);
				}
				break;
			case 'pinktext':
				if (args.length == 0) {
					return client.reply(from, `Faça o bot escrever o texto em uma imagem\nComando: *${prefix}pinkText texto*\n\n*Exemplo:* ${prefix}pinkText i love you!`, id);
				}

				await client.reply(from, mess.wait, id);

				var text	= body.slice(9);
				var url3D	= `https://docs-jojo.herokuapp.com/api/blackpink?text=${text}`;
				client.sendFileFromUrl(from, url3D, '', mess.success, id);
				break;
			case '3dtext':
				if (args.length == 0) {
					return client.reply(from, `Faça o bot escrever o texto em uma imagem\nComando: *${prefix}3dText texto*\n\n*Exemplo:* ${prefix}3dText i love you 3000`, id);
				}

				await client.reply(from, mess.wait, id);

				var text	= body.slice(7);
				var url3D	= `https://docs-jojo.herokuapp.com/api/text3d?text=${text}`;
				client.sendFileFromUrl(from, url3D, '', mess.success, id);
                break;
			case 'meme':
				if ((isMedia || isQuotedImage) && args.length >= 2) {
					await client.reply(from, mess.wait, id);

					var texts	= arg.split('|');
					if (texts.length !== 2) {
						return client.reply(from, `Chefe, me envia uma foto com o comando *${prefix}meme texto_topo | texto_rodape*\n*Exemplo:* ${prefix}meme texto topo | texto rodape`, id)
					}

					const top			= texts[0];
					const bottom		= texts[1];
					const encryptMedia	= isQuotedImage ? quotedMsg : message;
					const mediaData		= await decryptMedia(encryptMedia, uaOverride);
					const getUrl		= await uploadImages(mediaData, false);
					const ImageBase64	= await images.makeMeme(getUrl, top, bottom);
					client.sendFile(from, ImageBase64, 'image.png', mess.success, id, true)
						.catch(() => {
							client.reply(from, mess.error.cA)
						});
				} else {
					await client.reply(from, `Chefe, me envia uma foto com o comando *${prefix}meme texto_topo | texto_rodape*\n*Exemplo:* ${prefix}meme texto topo | texto rodape`, id)
				}
				break;
			case 'citar':
				const qmaker = body.trim().split('|');
				if (qmaker.length >= 2) {
					const quotes	= qmaker[1];
					const author	= qmaker[2];
					const theme		= 'random';
					await client.reply(from, mess.wait, id);

					try {
						const hasilqmaker	= await images.quote(quotes, author, theme);
						client.sendFileFromUrl(from, hasilqmaker, '', mess.success, id);
					} catch {
						client.reply('[❌] Então... O processo falhou! O conteúdo que você enviou está correto ou não?..', id)
					}
				} else {
					client.reply(from, `Comando: *${prefix}citar |texto|autor*\n\n*Exemplo:* ${prefix}citar |Eu amo Você|-${botName}`);
				}
				break;
			case 'escreva':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Faça o bot escrever o texto em uma imagem\nComando: *${prefix}escreva texto*\n\n*Exemplo:* ${prefix}escreva i love you 3000`, id);
				}

				await client.reply(from, mess.wait, id);

				const writeq = body.slice(9);
				const writep = await api.write(writeq, apiMhBar);
				await client.sendImage(from, writep, '', mess.success, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;

			// Group All User
			case 'convitegrupo':
				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (isGroupMsg) {
					const inviteLink	= await client.getGroupInviteLink(groupId);
					client.sendLinkWithAutoPreview(from, inviteLink, `\nConvite do grupo *${name}*`);
				} else {
					client.reply(from, 'Este comando só pode ser usado em grupos!', id);
				}
				break

			// Media
			case 'ytmp3':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para baixar músicas do youtube\nExemplo: ${prefix}ytmp3 [link_yt]`, id);
				}

				const linkmp3	= args[0].replace('https://youtu.be/', '').replace('https://www.youtube.com/watch?v=', '');
				api.ytmp3(`https://youtu.be/${linkmp3}`, apiMhBar)
					.then(async(res) => {
						if (res.error) {
							return client.sendFileFromUrl(from, res.url, '', res.error);
						}

						await client.sendFileFromUrl(from, res.result.thumb, '', `Vídeo encontrado!\n\nTítulo: ${res.result.title}\nDesc: ${res.result.desc}\nMal posso esperar para enviar`, id)
						await client.sendFileFromUrl(from, res.result.url, '', '', id)
							.catch(() => {
								client.reply(from, `Este URL ${args[0]} já foi baixado antes. O URL será redefinido após 1 hora / 60 minutos`, id)
							})
					})
				break
			case 'ytmp4':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para baixar músicas do youtube\nexemplo: ${prefix}ytmp3 [link_yt]`, id);
				}

				const linkmp4	= args[0].replace('https://youtu.be/','').replace('https://www.youtube.com/watch?v=','');
				api.ytmp4(`https://youtu.be/${linkmp4}`, apiMhBar)
					.then(async(res) => {
						if (res.error) {
							return client.sendFileFromUrl(from, res.url, '', res.error);
						}
						await client.sendFileFromUrl(from, res.result.thumb, '', `Vídeo encontrado!\n\nTítulo: ${res.result.title}\nDesc: ${res.result.desc}\nMal posso esperar para enviar`, id);
						await client.sendFileFromUrl(from, res.result.url, '', '', id)
							.catch(() => {
								client.reply(from, `Este URL ${args[0]} já foi baixado antes. O URL será redefinido após 1 hora / 60 minutos`, id)
							});
					})
				break
			case 'fb':
			case 'facebook':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para baixar o vídeo do link do Facebook\nExemplo: ${prefix}fb [link_fb]`, id);
				}

				api.fb(args[0])
					.then(async (res) => {
						const { link, linkhd, linksd } = res;
						if (res.status == 'error') {
							return client.sendFileFromUrl(from, link, '', 'Desculpe, seu url não foi encontrado', id);
						}

						await client.sendFileFromUrl(from, linkhd, '', mess.success, id)
							.catch(async () => {
								await client.sendFileFromUrl(from, linksd, '', mess.success, id)
									.catch(() => {
										client.reply(from, 'Desculpe, seu url não foi encontrado', id)
									})
							})
					})
				break

			// Random text
			case 'motivacional':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				fetch('https://raw.githubusercontent.com/selyxn/motivasi/main/motivasi.txt')
					.then(res => res.text())
					.then(body => {
						let splitmotivasi	= body.split('\n');
						let randommotivasi	= splitmotivasi[Math.floor(Math.random() * splitmotivasi.length)];
						client.reply(from, randommotivasi, id);
					})
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					})
				break
			case 'versiculo':
				await client.reply(from, mess.wait, id);

				api.bible()
					.then(async (res) => {
						client.reply(from, `"${res.text}" – *${res.book}, ${res.chapter}, ${res.number}*`, id);
					})
				break

			// Random Images
			case 'memes':
				await client.reply(from, mess.wait, id);

				const randmeme	= await images.randomMeme();
				client.sendFileFromUrl(from, randmeme, '', mess.success, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					})
				break;
			case 'nsfws':
				if (!isNsfw) {
					return client.reply(from, '[❌] O NSFW não está ativado', id);
				}

				await client.reply(from, mess.wait, id);

				const randnsfw	= await images.randomNSFW();
				client.sendFileFromUrl(from, randnsfw, '', mess.success, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					})
				break
			case 'loli':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				await client.reply(from, mess.wait, id);

				var urlLoli	= `https://mhankbarbar.moe/api/randomloli?apiKey=${apiMhBar}`;
				client.sendFileFromUrl(from, urlLoli, 'loli.jpeg', mess.success, id);
				break;
		
			// Search Any
			case 'imagens':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para pesquisar fotos do Pinterest\nUse: ${prefix}imagens [busca]\nExemplo: ${prefix}imagens naruto`, id);
				}

				const cariwall	= body.slice(8);
				const hasilwall	= await images.pinterest(cariwall);
				await client.sendFileFromUrl(from, hasilwall, '', '', id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'sreddit':
				if (!isNsfw) {
					return client.reply(from, '[❌] O NSFW não está ativado', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para procurar uma imagem de um subreddit\nuse: ${prefix}sreddit [search]\nExemplo: ${prefix}sreddit naruto`, id);
				}

				await client.reply(from, mess.wait, id);

				const carireddit	= body.slice(9);
				const hasilreddit	= await images.sreddit(carireddit);
				await client.sendFileFromUrl(from, hasilreddit, '', '', id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
			break;
			case 'receitas':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para pesquisar receitas de comida\nuse: ${prefix}receitas [busca]\n\nExemplo: ${prefix}receitas frango assado`, id)
				}

				const cariresep		= body.slice(7);
				const hasilresep	= await resep.resep(cariresep);
				await client.reply(from, hasilresep + '\n\nEsta é a receita da comida...', id)
					.catch(() => {
						client.reply(from, mess.error.cA, id)
					});
				break;
			case 'stalkig':
				if (!isOwnerBot) return;

				if (args.length == 0) {
					return client.reply(from, `Para Stalkear uma conta no Instagram\nUse ${prefix}stalkig [usuário]\nExemplo: ${prefix}stalkig fmedeiros95`, id)
				}

				InstaClient.authBySessionId(tokenInsta)
				InstaClient.getProfile(args[0])
					.then((profile) => {
						var igstalk	= `*ID:* ${profile.id}\n*Nome:* ${profile.name}\n*Bio:* ${profile.bio}\n*Seguidores:* ${highamount(profile.followers)}\n*Seguindo:* ${highamount(profile.following)}\n*Postagens:* ${highamount(profile.posts)}`;
						if (profile.verified) {
							igstalk += '\n✅ *Este é um perfil verificado!*';
						}
						if (profile.private) {
							igstalk += '\n❌ *Este é um perfil privado!*';
						}
						igstalk	+= `\n\n*Link:* ${profile.link}`;

						client.sendFileFromUrl(from, profile.pic, '', igstalk, id)
							.catch((err) => client.reply(from, mess.error.cA, id));
					}).catch((err) => client.reply(from, mess.error.cA, id));
				break;
			case 'stalktiktok':
				try {
					if (args.length < 1) {
						return client.sendMessage(from, 'Nome? ', text, {quoted: mek})
					}

					await client.reply(from, mess.wait, id);

					let { user, stats } = await tiktod.getUserProfileInfo(args[0])

					await client.reply(from, mess.wait, id);
					var text	= `*ID:* ${user.id}\n*Usuário:* ${user.uniqueId}\n*Apelido:* ${user.nickname}\n*Seguidores:* ${highamount(stats.followerCount)}\n*Seguindo:* ${highamount(stats.followingCount)}\n*Posts:* ${highamount(stats.videoCount)}\n*Luv:* ${highamount(stats.heart)}\n`
					await client.sendFileFromUrl(from, user.avatarLarger, '', text, id)
						.catch(() => {
							client.reply(from, mess.error.cA, id);
						});
				} catch (err) {
					client.reply(from, mess.error.cA, id);
				}
				break;
			case 'wiki':
				if (args.length == 0) {
					return client.reply(from, `Para pesquisar uma palavra da wikipedia\nExemplo: ${prefix}wiki [busca]`, id)
				}

				const wikip	= body.slice(6);
				const wikis	= await api.wiki(wikip);
				await client.reply(from, wikis, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'clima':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para ver o clima em uma área\nExemplo: ${prefix}clima [área]`, id);
				}
				const weatherq	= body.slice(7);
				const weatherp	= await api.weather(weatherq);
				await client.reply(from, weatherp, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'printlink': // if there is an error, please open the file in the settings/api.json folder and change the apiSS 'API-KEY' that you got from the website https://apiflash.com/
				if (args.length == 0) {
					return client.reply(from, `Faça uma captura de tela do bot em uma web\n\nUse: ${prefix}printLink [url]\n\nExemplo: ${prefix}printLink https://google.com`, id)
				}

				const screen = await images.printLink(args[0]);
				await client.sendFile(from, screen, 'ss.jpg', mess.success, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			
			// Other Command
			case 'buscacep':
				if (args.length !== 1) {
					return client.reply(from, 'Me conta seu CEP ai vai?!', id);
				}

				let response	= await axios.get(`https://viacep.com.br/ws/${args[0]}/json/`)
				const {
					logradouro, bairro,
					localidade, siafi, ibge
				} = response.data;

				await client.reply(from, mess.wait, id);
				await client.sendText(from, `🌎️ *Endereço:* ${logradouro}, ${bairro}, ${localidade}\nSiafi: ${siafi}, Ibge: ${ibge} `)

				break
			case 'meunumero':
				let chatNumber	= pengirim.split('-');
				let ddd			= chatNumber[0].substring(2, 4);
				let number		= chatNumber[0].substring(4, 12);

				await client.reply(from, `Seu numero é *${number}* e seu DDD é *${ddd}*!`, id);
				break;
			case 'meexpulsa':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (isGroupAdmins) {
					return client.reply(from, mess.error.Ki, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				await client.reply(from, 'É pra agooora! kkkk', id)
					.then(() => {
						client.removeParticipant(groupId, pengirim);
					});
				break;
			case 'donogrupo':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				const Owner_	= chat.groupMetadata.owner;
				if (typeof Owner_ !== 'undefined') {
					client.sendTextWithMentions(from, `*O dono do grupo é o(a):* @${Owner_}`);
				} else {
					client.reply(from, `Cara, parece que o criador do grupo não ta mais aqui...\nDigita *${prefix}adminsGrupo* para ver os administradores.`, id);
				}
				break;
			case 'adminsgrupo':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				var list		= '╔══✪〘 *Admins do Grupo* 〙✪══\n';
				for (var admin of groupAdmins) {
					list += `╠➥ @${admin.replace(/@c.us/g, '')}\n`;
				}
				await client.sendTextWithMentions(from, list);
				break;
			case 'tts2':
				if (quotedMsg && !isQuotedImage && !isQuotedVideo) {
					var ttsText	= quotedMsg.body;					
					console.log(dataText);
				} else {
					var ttsText	= body.slice(5);
				}
				
				if (ttsText === '') {
					return client.reply(from, 'Cadê o texto..?', id);
				}

				if (ttsText.length > 250) {
					return client.reply(from, 'O texto é muito longo...', id);
				}

				try {
					ttsGB.save('./media/tts.mp3', ttsText, function () {
						client.sendPtt(from, './media/tts.mp3', id);
					})
				} catch (err) {
					client.reply(from, err, id);
				}
				break;
			case 'tts':
				var dataText	= body.slice(5);
				if (dataText === '') {
					return client.reply(from, 'Você não informou o texto...', id);
				}

				if (dataText.length > 250) {
					return client.reply(from, 'Você informou um texto muito longo...', id);
				}

				try {
					ttsGB.save('./media/tts.mp3', dataText, function () {
						client.sendPtt(from, './media/tts.mp3', id);
					})
				} catch (err) {
					client.reply(from, err, id);
				}
				break;
			case 'traduzir':
				if (!isOwnerBot) {
					return client.reply(from, 'Este comando está passando por manutenção!', id);
				}

				if (args.length != 1) {
					return client.reply(from, `Desculpe, o formato da mensagem está errado.\nResponda a uma mensagem com o comando ${prefix}translate <idioma>\nExemplo ${prefix}translate pt`, id)
				}

				if (!quotedMsg) {
					return client.reply(from, `Desculpe, o formato da mensagem está errado.\nResponda a uma mensagem com o comando ${prefix}translate <idioma>\nExemplo ${prefix}translate pt`, id);
				}

				const quoteText	= quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''

				translation.trans(quoteText, args[0])
					.then((result) => client.sendText(from, result))
					.catch(() => client.sendText(from, 'Não foi possível realizar a tradução!'))
				break;
			case 'shortlink':
				if (args.length == 0) {
					return client.reply(from, `Exemplo: ${prefix}shortlink [url]`, id);
				}

				if (!isUrl(args[0])) {
					return client.reply(from, 'Desculpe, a url que você enviou é inválida.', id);
				}

				const shortlink	= await urlShortener(args[0])
				await client.reply(from, `*Pega o link:* ${shortlink}`, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id)
					});
				break;

			// Fun Menu
			case 'dado':
				await client.reply(from, mess.wait, id);
				fetch('https://raw.githubusercontent.com/rashidsiregar28/data/main/Dadu')
					.then(res => res.text())
					.then(body => {
						const dices	= body.split('\n')
						// const dice	= dices[Math.floor(Math.random() * (dices.length - 1))]
						const dice	= dices[Math.random() * dices.length | 0]
						client.sendStickerfromUrl(from, dice);
					})
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					})
				break;
			case 'querotreta':
				client.sendPtt(from, './media/queroTreta.mp3', id);
				break;
			case 'cheiroxoxota':
				client.sendPtt(from, './media/cheiroXoxota.mpeg', id);
				break;
			case 'golvila':
				client.sendPtt(from, './media/golVila.mp4', id);
				break;
			case 'golgoias':
				client.sendPtt(from, './media/golGoias.mp4', id);
				break;
			case 'acorda':
				client.sendPtt(from, './media/acorda.mp3', id);
				break;
			case 'acordacorno':
				client.sendPtt(from, './media/acordaCorno.mp3', id);
				break;
			case 'berrante':
				client.sendPtt(from, './media/berrante.mpeg', id);
				break;
			case 'bomdia':
				client.sendPtt(from, './media/bomDiaStreetFighter.mp3', id);
				break;
			case 'bomdiasexta':
				client.sendPtt(from, './media/acordaSexta.mp3', id);
				break;
			case 'buzinatrem':
				client.sendPtt(from, './media/buzinaTrem.mp3', id);
				break;
			case 'coracaobom':
				client.sendPtt(from, './media/coracaoBom.mp3', id);
				break;
			case 'eusoulouco':
				client.sendPtt(from, './media/euSouLoco.mp3', id);
				break;
			case 'gentebacana':
				client.sendPtt(from, './media/genteBacana.mp3', id);
				break;
			case 'quecalor':
				client.sendPtt(from, './media/queCalor.mp3', id);
				break;
			case 'trembala':
				client.sendPtt(from, './media/tremBala.mp3', id);
				break;
			case 'vaiamerda':
				client.sendPtt(from, './media/vaiPraMerda.mp3', id);
				break;
			case 'educu':
				client.sendPtt(from, './media/eduCu.mp3', id);
				break;
			case 'vamosocializar':
				client.sendPtt(from, './media/vamoSocializar.mp3', id);
				break;
			case 'raparigacerta':
				client.sendPtt(from, './media/raparigaCerta.mp3', id);
				break;
			case 'sonhodoido':
				client.sendPtt(from, './media/sonhoDoido.mp3', id);
				break;
			case 'boanoite':
				client.sendPtt(from, './media/boaNoite.mp3', id);
				break;
			case 'risada':
				client.sendPtt(from, './media/risada.mp3', id);
				break;
			case 'pokemonraro':
				client.sendPtt(from, './media/pokemonRaro.mp3', id);
				break;
			case 'quepokemon':
				client.sendPtt(from, './media/quePokemon.mp3', id);
				break;
			case 'vamosacordar':
				client.sendPtt(from, './media/vamosAcordar.mp3', id);
				break;
			case 'cricri':
				client.sendPtt(from, './media/cricri.mp3', id);
				break;
			case 'grupomorrer':
				client.sendPtt(from, './media/grupoMorrer.mp3', id);
				break;
			case 'naointerage':
				client.sendPtt(from, './media/naoInterage.mp3', id);
				break;
			case 'despertador':
				client.sendPtt(from, './media/despertador.mp3', id);
				break;
			case 'gosteidogrupo':
				client.sendPtt(from, './media/gosteiGrupo.mp3', id);
				break;
			case 'naobebomais':
				client.sendPtt(from, './media/naoBeboMais.mp3', id);
				var gif	= await fs.readFileSync('./media/naoBeboMais.jpg', { encoding: "base64" })
				await client.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
				break;
			case 'wanted':
			case 'procurado':
			case 'caraprocurado':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				await client.reply(from, '[🖥️] Calma ai, eu tõ consultando o computador da polícia...', id);

				var groupMembers		= await client.getGroupMembers(groupId);
				const randomMember		= await images.randomMember(client, author, botNumber, groupMembers);
				if (!randomMember) {
					return client.reply(from, '[🤖] Fiquem tranquilos, não existe nenhum procurado(a) neste grupo!', id);
				}

				var crimes			= [
					['Estava roubando WiFi 😱', 'O elemento estava roubando WiFi!'],
					['Destruidor de corações 💔', 'O elemento é destruidor(a) de corações'],
					['Andou de bicicleta na calçada 🤭', 'O elemento andou de bicicleta na calçada'],
					['Passou de carro na poça d\'água para molhar pedestres 😂', 'O elemento passou de carro na poça d\'água para molhar pedestres'],
					['Bebeu de mais e ligou pro(a) ex 🤦‍♂️', 'O elemento bebeu de mais e ligou pro(a) ex'],
					['Dormiu de mais e perdeu um compromisso 😴', 'O elemento dormiu de mais e perdeu um compromisso'],
					['Dar descarga no vaso à noite 🚽🌃', 'O elemento deu descarga no vaso à noite'],
					['Xingar em público 🤬', 'O elemento realizou xingamentos em público'],
					['Passou trote no 190 🚔', 'O elemento passou trote no 190'],
				];
				var crime			= getRandom(crimes);

				var avatarMember	= await client.getProfilePicFromServer(randomMember.id);
				if (!isUrl(avatarMember)) {
					return client.reply(from, '[🤖] Fiquem tranquilos, não existe nenhum procurado(a) neste grupo!', id);
				}
				var ImgContent		= await fetchBase64(avatarMember);
				var ImgBuffer		= Buffer.from(ImgContent.split(',')[1], "base64");
				var ImgUrl			= await uploadImages(ImgBuffer, false);
				var ImgBase64		= await images.makeWanted(ImgUrl, crime[1]);
				var marker			= randomMember.id.replace(/@c.us/g, '');

				await client.sendFile(from, ImgBase64, 'wanted.png', `🚨 *Procurado(a):* @${marker}\n-❥ *Crime:* ${crime[0]}\n-❥ *Pena:* 50 anos de reclusão e 500 dias-multa`, id, true)
					.then((res) => {
						// client.sendPtt(from, './media/caraProcurado.mp3', res);
					})
					.catch((err) => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			
			case 'somporcaria':
				client.sendPtt(from, './media/somPorcaria.mp3', id);
				break;
			case 'manesom':
				client.sendPtt(from, './media/maneSom.mp3', id);
				break;

			// Group Commands (group admin only)
			case 'edotensei':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (mentionedJidList.length === 0) {
					return client.reply(from, `Comando para expulsar e adicionar membros, enviar pedidos ${prefix}edotensei @tag`, id)
				}

				for (let i = 0; i < mentionedJidList.length; i++) {
					if (groupAdmins.includes(mentionedJidList[i])) {
						return client.reply(from, mess.error.Ki, id);
					}

					await client.removeParticipant(groupId, mentionedJidList[i])

					client.reply(from, 'Agora vamos adicionar eles de volta né?!', id);
					await sleep(3000);
					await client.addParticipant(from, mentionedJidList);
				} 
				break;
			case 'add':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args.length !== 1) {
					return client.reply(from, `Comando: ${prefix}add [número]>\nExemplo: ${prefix}add 5512982242643`, id)
				}

				var addUser = args[0] + '@c.us';
				try {
					await client.addParticipant(from, addUser)
				}  catch (err) {
					console.log(color('[EROR]', 'red'), err);
					client.reply(from, 'Não foi possível adicionar.', id);
				}
				break;
			case 'expulsar':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (mentionedJidList.length === 0) {
					return client.reply(from, 'Desculpe, o formato da mensagem está errado.\nMarque uma ou mais pessoas a serem expulsas.', id);
				}

				if (mentionedJidList[0] === botNumber) {
					return await client.reply(from, 'Desculpe, o formato da mensagem está errado.\nImpossível usar o comando conta própria BOT!', id);
				}

				await client.sendTextWithMentions(from, `Solicitação recebida, números:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
				for (let i = 0; i < mentionedJidList.length; i++) {
					if (groupAdmins.includes(mentionedJidList[i])) {
						return await client.sendText(from, 'Você não pode remover um administrador do grupo.');
					}

					await client.removeParticipant(groupId, mentionedJidList[i]);
				}
				break;
			case 'promover':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (mentionedJidList.length !== 1) {
					return client.reply(from, 'Você só pode promover 1 usuário por vez!', id);
				}

				if (groupAdmins.includes(mentionedJidList[0])) {
					return await client.reply(from, 'Este usuário já é um administrador.', id);
				}

				if (mentionedJidList[0] === botNumber) {
					return await client.reply(from, 'Desculpe, o formato da mensagem está errado.\nImpossível usar o comando conta própria BOT!', id)
				}

				await client.promoteParticipant(groupId, mentionedJidList[0]);
				await client.sendTextWithMentions(from, `Pronto! Agora @${mentionedJidList[0].replace('@c.us', '')} é um administrador.`);
				break;
			case 'rebaixar':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (mentionedJidList.length !== 1) {
					return client.reply(from, 'Você só pode rebaixar 1 usuário por vez!', id);
				}

				if (!groupAdmins.includes(mentionedJidList[0])) {
					return await client.reply(from, 'Este usuário não é um administrador.', id);
				}

				if (mentionedJidList[0] === botNumber) {
					return await client.reply(from, 'Desculpe, o formato da mensagem está errado.\nImpossível usar o comando conta própria BOT!', id);
				}

				await client.demoteParticipant(groupId, mentionedJidList[0])
				await client.sendTextWithMentions(from, `Pronto! Agora @${mentionedJidList[0].replace('@c.us', '')} não é mais um administrador.`)
				break;
			case 'vaiembora':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				await client.sendText(from, 'Até a próxima! ( ⇀‸↼‶ )').then(() => {
					client.leaveGroup(groupId);
				});
				break
			case 'apagar':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!quotedMsg) {
					return client.reply(from, `Desculpe, formato de mensagem errado, por favor.\nResponda às mensagens do bot com o comando ${prefix}apagar`, id);
				}

				if (!quotedMsgObj.fromMe) {
					return client.reply(from, `Desculpe, formato de mensagem errado, por favor.\nResponda às mensagens do bot com o comando ${prefix}apagar`, id);
				}

				await client.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false);
				break;
			case "atualizarconvite":
				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (isBotGroupAdmins) {
					client.revokeGroupInviteLink(from)
						.then((res) => {
							client.reply(from, `O convite foi atualizado!\n\nPara obter o link de convite do grupo, use o comando:\n*${prefix}conviteGrupo* `, id);
						})
						.catch((err) => {
							console.log(`[ERR] ${err}`);
						});
				}
				break;
			case 'marcartodos':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				const groupMem	= await client.getGroupMembers(groupId)
				var list		= '╔══✪〘 Membros do Grupo 〙✪══\n';
				for (var i = 0; i < groupMem.length; i++) {
					list += `╠➥ @${groupMem[i].id.replace(/@c.us/g, '')}\n`;
				}
				await client.sendTextWithMentions(from, list);
				break;
			case 'apenasadm':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, 'Você precisa adicionar o bot como administrador do grupo!', id);
				}

				if (args.length !== 1) {
					return client.reply(from, `Alterar configurações do grupo para que apenas administradores possam enviar mensagens.\n\nComo usar:\n${prefix}mutegrup on\n${prefix}mutegrup off`, id);
				}

				if (args[0] == 'on') {
					client.setGroupToAdminsOnly(groupId, true).then(() => client.sendText(from, 'Pronto! Agora apenas administradores podem enviar mensagens!'));
				} else if (args[0] == 'off') {
					client.setGroupToAdminsOnly(groupId, false).then(() => client.sendText(from, 'Pronto! Agora todos os membros do grupo podem enviar mensagens!'));
				} else {
					client.reply(from, `Alterar configurações do grupo para que apenas administradores possam enviar mensagens.\n\nComo usar:\n${prefix}mutegrup on\n${prefix}mutegrup off`, id);
				}
				break;
			case 'setprofile':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id)
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id)
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, 'Você precisa adicionar o bot como administrador do grupo!', id)
				}

				if (isMedia && type == 'image' || isQuotedImage) {
					const dataMedia		= isQuotedImage ? quotedMsg : message
					const _mimetype		= dataMedia.mimetype
					const mediaData		= await decryptMedia(dataMedia, uaOverride)
					const imageBase64	= `data:${_mimetype};base64,${mediaData.toString('base64')}`

					await client.setGroupIcon(groupId, imageBase64)
				} else if (args.length === 1) {
					if (!isUrl(url)) {
						await client.reply(from, mess.error.Iv, id)
					}

					client.setGroupIconByUrl(groupId, url)
						.then((r) => {
							if (!r && r !== undefined) {
								client.reply(from, 'Desculpe, o link que você enviou não contém uma imagem.', id);
							} else {
								client.reply(from, 'Imagem do grupo foi atualizada!', id)
							}
						});
				} else {
					client.reply(from, `Este comando é utilizado para alterar a imagem do grupo\n\n\nComo usar:\n1. Envie ou responda uma imagem com o comando *${prefix}setProfile*\n\n2. Use o comando ${prefix}setProfile linkImage`);
				}
				break;
			case 'bemvindo':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args.length !== 1) {
					return client.reply(from, `Faça o BOT dar boas-vindas aos  novos membros do grupo!\n\nComo usar:\n${prefix}bemvindo on\n${prefix}bemvindo off`, id);
				}

				if (args[0] == 'on') {
					if (isWelcomeOn) {
						return client.reply(from, 'A mensagem de boas-vindas já está ativa!', id);
					}

					welcome.push(chatId);
					fs.writeFileSync('./data/welcome.json', jsonEncode(welcome));

					client.reply(from, 'A mensagem de boas-vindas agora está ativada!', id);
				} else if (args[0] == 'off') {
					if (!isWelcomeOn) {
						return client.reply(from, 'A mensagem de boas-vindas já está inativa!', id);
					}

					var xporn = welcome.indexOf(chatId);
					welcome.splice(xporn, 1);
					fs.writeFileSync('./data/welcome.json', jsonEncode(welcome));

					client.reply(from, 'A mensagem de boas-vindas agora está desativada!', id);
				} else {
					client.reply(from, `Faça o BOT dar boas-vindas aos novos membros do grupo!\n\nComo usar:\n${prefix}bemvindo on\n${prefix}bemvindo off`, id);
				}
				break;
			case 'nsfw':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, mess.error.bA, id);
				}

				if (args.length !== 1) {
					return client.reply(from, `Habilitar / Desabilitar NSFW\n\nComo usar:\n${prefix}nsfw on\n${prefix}nsfw off`, id);
				}

				if (args[0] == 'on') {
					if (isNsfw) {
						return client.reply(from, 'NSFW já está ativa!', id);
					}

					nsfw.push(chatId);
					fs.writeFileSync('./data/nsfw.json', jsonEncode(nsfw));

					client.reply(from, 'NSFW agora está ativada!', id);
				} else if (args[0] == 'off') {
					if (!isNsfw) {
						return client.reply(from, 'NSFW já está inativa!', id);
					}

					var xporn = nsfw.indexOf(chatId);
					nsfw.splice(xporn, 1);
					fs.writeFileSync('./data/nsfw.json', jsonEncode(nsfw));

					client.reply(from, 'NSFW agora está desativada!', id);
				} else {
					client.reply(from, `Habilitar / Desabilitar NSFW\n\nComo usar:\n${prefix}nsfw on\n${prefix}nsfw off`, id);
				}
				break;

			case 'btn':
				await client.sendButtons(from, 'Escolha uma das opções abaixo:',  [
					{
						"id": "id1",
						"text": "Botão 1"
					}, {
						"id": "id2",
						"text": "Botão 2"
					}
				], "Isso é um teste de botões", "Esse texto vai dentro do corpo da mensagem dos botões");
				break;
			// Owner Group
			case 'expulsartodos': // remover todos os membros
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				let isOwner = chat.groupMetadata.owner == pengirim
				if (!isOwner) {
					return client.reply(from, 'Desculpe, este comando só pode ser usado pelo criador do grupo!', id);
				}

				if (!isBotGroupAdmins) {
					return client.reply(from, 'Você precisa adicionar o bot como administrador do grupo!', id);
				}

				const allMem = await client.getGroupMembers(groupId)
				for (let i = 0; i < allMem.length; i++) {
					if (!groupAdmins.includes(allMem[i].id)) {
						await client.removeParticipant(groupId, allMem[i].id)
					}
				}
				client.reply(from, 'Pronto! Todos os membros do grupo foram expulsos.', id)
			break

			// Owner Bot
			case 'botstat':
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				const loadedMsg			= await client.getAmountOfLoadedMessages();
				const chatIds			= await client.getAllChatIds();
				const groups			= await client.getAllGroups();

				const batteryLevel		= await client.getBatteryLevel();
            	const isPlugged			= await client.getIsPlugged(from);
            	const connectionState	= await client.getConnectionState();
            
				await client.reply(from, `Informações:\n-❥ *Status:* ${connectionState}\n-❥ *Bateria:* ${batteryLevel}%\n-❥ *Carregando:* ${(isPlugged) ? '✅' : '❌' }\n\nContadores:\n-❥ *Mensagens:* ${loadedMsg}\n-❥ *Grupos:* ${groups.length}\n-❥ *Conversas:* ${chatIds.length - groups.length}\n-❥ *Total:* ${chatIds.length}`, id);
				break;
			case 'listblock':
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				if (!blockNumber.length) {
					return client.reply(from, 'Nenhum número bloqueado!', id);
				}

				var textBlock	= '╔══✪〘 Números Bloqueados 〙✪══\n';
				for (let i of blockNumber) {
					textBlock += `╠➥ @${i.replace(/@c.us/g,'')}\n`;
				}

				client.sendTextWithMentions(from, textBlock, id);
				break;
			case 'getses':
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				const sesPic = await client.getSnapshot();
				client.sendFile(from, sesPic, 'session.png', mess.success, id);
				break;
			case 'ban':
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para banir alguém de poder usar comandos\n\nComo usar:\n${prefix}ban add 628xx\n${prefix}ban del 628xx\n\nPara banir vários, use:\n${prefix}ban @tag @tag @tag`, id);
				}

				if (args[0] == 'add') {
					banneds.push(args[1] + '@c.us');
					fs.writeFileSync('./data/banneds.json', jsonEncode(banneds));
					client.reply(from, 'Feito! Número banido.');
				} else if (args[0] == 'del') {
					let xnxx = banneds.indexOf(args[1] + '@c.us');
					banneds.splice(xnxx, 1);
					fs.writeFileSync('./data/banneds.json', jsonEncode(banneds));
					client.reply(from, 'Feito! Número desbanido.');
				} else {
					for (let i = 0; i < mentionedJidList.length; i++) {
						banneds.push(mentionedJidList[i]);
						fs.writeFileSync('./data/banneds.json', jsonEncode(banneds));
						client.reply(from, 'Feito! Números banidos.');
					}
				}
				break;
			case 'bc': // para transmissão ou promoção
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				if (args.length == 0) {
					return client.reply(from, `Para transmitir para todos os chats, use:\n${prefix}bc [texto]`);
				}

				let msg		= body.slice(4);
				const chatz	= await client.getAllChatIds();
				for (let idk of chatz) {
					var cvk	= await client.getChatById(idk)
					if (!cvk.isReadOnly) {
						client.sendText(idk, `〘 *Z Y R O N  B O T* 〙\n\n${msg}`);
					}

					if (cvk.isReadOnly) {
						client.sendText(idk, `〘 *Z Y R O N  B O T* 〙\n\n${msg}`)
					}
				}
				client.reply(from, mess.success, id);
				break;
			case 'leaveall': // remova bots de todos os grupos e exclua chats
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				const allChatz	= await client.getAllChatIds()
				const allGroupz	= await client.getAllGroups()
				for (let gclist of allGroupz) {
					await client.sendText(gclist.contact.id, `O BOT está limpando... Total de chats: ${allChatz.length}`);
					await client.leaveGroup(gclist.contact.id);
					await client.deleteChat(gclist.contact.id);
				}

				client.reply(from, mess.success, id);
				break;
			case 'clearall': // deletar todas as mensagens na conta do bot
				if (!isOwnerBot) {
					return client.reply(from, mess.error.oO, id);
				}

				const allChatx	= await client.getAllChats();
				for (let dchat of allChatx) {
					await client.deleteChat(dchat.id);
				}

				client.reply(from, mess.success, id);
				break;
			default:
				if (isCmd) {
					client.reply(from, mess.error.nC, id);
				}
				break;
		}
	} catch (err) {
		await client.sendText(`Puts, deu merda... Usa o comando *${prefix}reportar* e envia isso aqui:\n\n${err}`);

        console.log(color('[ERROR]', 'red'), err);
        client.kill().then(a => console.log(a));
	}
}
