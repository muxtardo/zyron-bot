require('dotenv').config();
const {
	decryptMedia
}	= require('@open-wa/wa-automate');

const moment	= require('moment-timezone');
moment.tz.setDefault('America/Sao_Paulo');

const axios	= require('axios');
const fetch	= require('node-fetch');

const tiktod	= require('tiktok-scraper');
const appRoot	= require('app-root-path');
const low		= require('lowdb');
const FileSync	= require('lowdb/adapters/FileSync');
const db_group	= new FileSync(appRoot + '/lib/data/group.json');

const db		= low(db_group);
db.defaults({
	group: []
}).write();


const {
	exec
}	= require('child_process');

const { 
	menuId, 
	urlShortener, 
	translation, 
	images,
	api,
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
	uploadImages
}	= require('./utils/fetcher');

const fs		= require('fs-extra');

const API		= jsonDecode(fs.readFileSync('./settings/api.json'));
const banneds	= jsonDecode(fs.readFileSync('./settings/banneds.json'));
const nsfw		= jsonDecode(fs.readFileSync('./settings/nsfw.json'));
const settings	= jsonDecode(fs.readFileSync('./settings/settings.json'));
const users		= jsonDecode(fs.readFileSync('./settings/users.json'));
const welcome	= jsonDecode(fs.readFileSync('./settings/welcome.json'));

const _levelings	= jsonDecode(fs.readFileSync('./settings/levelings.json'))
const _levels		= jsonDecode(fs.readFileSync('./settings/levels.json'))

let antisticker	= jsonDecode(fs.readFileSync('./lib/helper/antisticker.json'));
let stickerspam	= jsonDecode(fs.readFileSync('./lib/helper/stickerspam.json'));
let antilink	= jsonDecode(fs.readFileSync('./lib/helper/antilink.json'));

let { 
	ownerNumber, 
	groupLimit, 
	memberLimit,
	prefix
}	= settings;

const {
	apiMhBar
}	= API;

module.exports = msgHandler = async (client, message) => {
	try {
		const {
			type, id, from, t, sender, isGroupMsg, chat,
			chatId, caption, isMedia, mimetype,
			quotedMsg, quotedMsgObj, mentionedJidList
		}	= message
		let {
			body
		}	= message
		var {
			name,
			formattedTitle
		}	= chat
		let {
			pushname,
			verifiedName,
			formattedName
		}	= sender
		pushname	= pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account

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
				nC: `[❌] Cara, esse comando não existe, mas você pode sugerir, use o comando *${prefix}criador* e envie uma sugestão para o desenvolvedor.`,
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
                fs.writeFileSync('./settings/level.json', jsonEncode(_level));
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
                fs.writeFileSync('./settings/level.json', jsonEncode(_level));
            }
        }
        const addLevelingId = (userId) => {
            _levels[groupId].push({
				uid:	userId,
				xp:		1,
				level:	1
			});

			fs.writeFileSync('./settings/level.json', jsonEncode(_level));
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
			} catch (e) {
					console.log(e)
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
								fs.writeFileSync('./lib/helper/stickerspam.json', jsonEncode(stickerspam));
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
				fs.writeFileSync('./lib/helper/stickerspam.json', jsonEncode(stickerspam));

				return false;
			}  
		}

		const sleep = async (ms) => {
			return new Promise(resolve => setTimeout(resolve, ms));
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
				fs.writeFileSync('./lib/helper/stickerspam.json', jsonEncode(stickerspam));
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

		// [BETA] Avoid Spam Message
		msgFilter.addFilter(from);

		// function leveling
		if (isGroupMsg && isLevelingOn && !isCmd) {
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

		switch (command) {
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
					fs.writeFileSync('./settings/leveling.json', jsonEncode(_levelings));

					_levels[groupId] = [];
					fs.writeFileSync('./settings/level.json', jsonEncode(_level));

					client.reply(from, 'O sistema de nível foi ativado!', id);
				} else if (args[0] == 'off') {
					if (!isLevelingOn) {
						return client.reply(from, 'O sistema de níveis já está inativo!', id);
					}

					let xporn	= _levelings.indexOf(chatId);
					_levelings.splice(xporn, 1);
					fs.writeFileSync('./settings/leveling.json', jsonEncode(_levelings));

					delete _levels[groupId];
					fs.writeFileSync('./settings/level.json', jsonEncode(_level));

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
				fs.writeFileSync('./settings/users.json', jsonEncode(users));

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
			case 'pix':
			case 'doacao': 
			case 'doar':
			case 'fazumpix':
			case 'apoiarprojeto':
				await client.sendText(from, menuId.textDonate());
				break;
			case 'dev':
			case 'criador':
			case 'meucriador':
				await client.sendContact(from, ownerNumber)
					.then(() => client.sendText(from, 'Se você quiser solicitar um novo recurso, converse com ele!'));
				break
			case 'entraqui':
				if (args.length == 0) {
					return client.reply(from, `Quer adicionar o BOT ao seu grupo? Convide-o\nou use o comando: *${prefix}join [link_convite]*`, id)
				}

				let linkgrup	= body.slice(6);
				let islink		= linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi);
				let chekgrup	= await client.inviteInfo(linkgrup);
				if (!islink) {
					return client.reply(from, mess.error.Iv, id);
				}

				if (isOwnerBot) {
					await client.joinGroupViaLink(linkgrup)
						.then(async () => {
							await client.reply(from, '[✅] Entrou no grupo com sucesso por meio do link!', id);
							await client.sendText(chekgrup.id, `Eu sou o Zyron BOT. Para descobrir os comandos neste bot, use o comando *${prefix}menu*`);
						})
						.catch(() => {
							client.reply(from, mess.error.cA, id);
						})
				} else {
					let cgrup = await client.getAllGroups();
					if (cgrup.length > groupLimit) {
						return client.reply(from, `[❌] Desculpe, o BOT está sem vagas no momento.\nLimite de grupos: ${groupLimit}`, id);
					}

					if (cgrup.size < memberLimit) {
						return client.reply(from, `[❌] Desculpe, o BOT não entrará se os membros do grupo não excederem ${memberLimit} pessoas.`, id)
					}

					await client.joinGroupViaLink(linkgrup)
						.then(async () =>{
							await client.reply(from, '[✅] Entrou no grupo com sucesso por meio do link!', id);
							await client.sendText(chekgrup.id, `Eu sou o Zyron BOT. Para descobrir os comandos neste bot, use o comando *${prefix}menu*`);
						})
						.catch(() => {
							client.reply(from, mess.error.cA, id)
						});
				}
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
			// Sticker Creator
			case 'sticker':
				if ((isMedia || isQuotedImage) && args.length === 0) {
					await client.reply(from, mess.wait, id);

					var encryptMedia	= isQuotedImage ? quotedMsg : message;
					var _mimetype		= isQuotedImage ? quotedMsg.mimetype : mimetype;
					var mediaData		= await decryptMedia(encryptMedia, uaOverride);
					var imageBase64		= `data:${_mimetype};base64,${mediaData.toString('base64')}`;
					client.sendImageAsSticker(from, imageBase64)
						.then(() => {
							client.reply(from, '[✅] Pega aqui sua figurinha!');
						});
				} else if (args.length === 1) {
					if (!isUrl(url)) {
						await client.reply(from, mess.error.Iv, id);
					}

					await client.reply(from, mess.wait, id);

					client.sendStickerfromUrl(from, url)
						.then((r) => {
							if (!r && r !== undefined) {
								client.sendText(from, '[❌] Pô cara, tu tem que me mandar um link de alguma imagem!');
							} else {
								client.reply(from, '[✅] Pega aqui sua figurinha!');
							}
						});
				} else {
					await client.reply(from, `[❌] Cadê a imagem?\n\nEnvie ou responda uma foto com o comando\n${prefix}sticker\n\nOu então me envia uma mensagem com o comando:\n*${prefix}sticker [link_imagem]*`, id);
				}
				break;
			case 'stickergif':
				if (isMedia || isQuotedVideo) {
					var encryptMedia	= isQuotedVideo ? quotedMsg : message;
					var _mimetype		= isQuotedVideo ? quotedMsg.mimetype : mimetype;
					var mediaData		= await decryptMedia(encryptMedia, uaOverride);

					if (_mimetype === 'video/mp4' && encryptMedia.duration < 10 || _mimetype === 'image/gif' && encryptMedia.duration < 10) {

						client.reply(from, mess.wait, id);
						var filename	= `./media/stickergif.${_mimetype.split('/')[1]}`
						await fs.writeFileSync(filename, mediaData)
						await exec(`gify ${filename} ./media/stickergf.gif --fps=30 --scale=240:240`, async function (error, stdout, stderr) {
							var gif	 = await fs.readFileSync('./media/stickergf.gif', { encoding: "base64" })
							await client.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
								.catch(() => {
									client.reply(from, 'Desculpe, o arquivo é muito grande!', id)
								})
						})
					} else {
						client.reply(from, `[❌] Enviar ou responder um GIF com o comando *${prefix}stickerGif* (máx. 10s)`, id)
					}
				} else {
					client.reply(from, `[❌] Enviar ou responder um GIF com o comando *${prefix}stickerGif* (máx. 10s)`, id)
				}
				break;
			case 'stickergiphy':
				if (args.length !== 1) {
					return client.reply(from, `[❌] O formato da mensagem está errado.\nDigite uma mensagem com ${prefix}stickergiphy <link_giphy>`, id);
				}

				const isGiphy		= url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'));
				const isMediaGiphy	= url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'));
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
				} else if (isMediaGiphy) {
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
						fs.writeFileSync('./lib/helper/antisticker.json', jsonEncode(antisticker));
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
						fs.writeFileSync('./lib/helper/antisticker.json', jsonEncode(antisticker));
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
						fs.writeFileSync('./lib/helper/antilink.json', jsonEncode(antilink));
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
						fs.writeFileSync('./lib/helper/antilink.json', jsonEncode(antilink));
						client.reply(from, '*[Anti Group Link]* foi desabilitado', id);
					}
				} else {
					client.reply(from, `*Selecione:* on / off\n\n*[Anti Group Link]*\nSe o participante enviar um convite para grupo, eu irei expulsá-lo!`, id);
				}
				break;
			case 'qrread':
				if (args.length !== 1) {
					return client.reply(from, `Use o comando:\n*${prefix}qrread [url]*\n\n*Exemplo:* ${prefix}qrread https://i.ibb.co/phSpp2h/00bed2bb-8b90-4d49-ace1-fe0ac9f73dff.jpg\n\n*Nota:* Primeiro carregue o seu QRCode para https://pt-br.imgbb.com`, id);
				}

				await client.reply(from, mess.wait, id);
				api.qrread(args[0])
					.then(async (res) => {
						await client.reply(from, res, id);
					});
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

					const top			= arg.split('|')[0];
					const bottom		= arg.split('|')[1];
					const encryptMedia	= isQuotedImage ? quotedMsg : message;
					const mediaData		= await decryptMedia(encryptMedia, uaOverride);
					const getUrl		= await uploadImages(mediaData, false);
					const ImageBase64	= await images.makeMeme(getUrl, top, bottom);
					client.sendFile(from, ImageBase64, 'image.png', '[✅] Ta na não chefe!', id, true)
						.then(() => {
							// client.reply(from, 'Pronto!',id)
						})
						.catch(() => {
							client.reply(from, mess.error.cA)
						})
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
					client.reply(from, `Comando: *${prefix}citar |texto|autor*\n\n*Exemplo:* ${prefix}citar |Eu amo Você|-Zyron BOT`);
				}
				break;
			case 'escreva':
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
				await client.reply(from, mess.wait, id);

				var urlLoli	= `https://mhankbarbar.moe/api/randomloli?apiKey=${apiMhBar}`;
				client.sendFileFromUrl(from, urlLoli, 'loli.jpeg', mess.success, id);
				break;
		
			// Search Any
			case 'imagens':
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
				if (args.length == 0) {
					return client.reply(from, `Para Stalkear uma conta no Instagram\nUse ${prefix}stalkig [usuário]\nExemplo: ${prefix}stalkig fmedeiros95`, id)
				}

				const igstalk		= await api.stalkig(args[0])
				const igstalkpict	= await api.stalkigpict(args[0])
				await client.sendFileFromUrl(from, igstalkpict, '', igstalk, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			case 'tiktokstalk':
				try {
					if (args.length < 1) {
						return client.sendMessage(from, 'Nome? ', text, {quoted: mek})
					}

					await client.reply(from, mess.wait, id);

					let { user, stats } = await tiktod.getUserProfileInfo(args[0])

					await client.reply(from, mess.wait, id);
					var text	= `*ID* : ${user.id}\n*Usuário:* ${user.uniqueId}\n*Apelido:* ${user.nickname}\n*Seguidores:* ${highamount(stats.followerCount)}\n*Seguindo:* ${highamount(stats.followingCount)}\n*Posts:* ${highamount(stats.videoCount)}\n*Luv:* ${highamount(stats.heart)}\n`
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

				const screen = await images.printLink(args[0])
				await client.sendFile(from, screen, 'ss.jpg', mess.success, id)
					.catch(() => {
						client.reply(from, mess.error.cA, id);
					});
				break;
			
			// Other Command
			case 'tts':
				let ttsGB		= require('node-gtts')('pt');
				let dataText	= body.slice(5);
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
					return client.reply(from, `Exemplo: ${prefix}shortlink <url>`, id);
				}

				if (!isUrl(args[0])) {
					return client.reply(from, 'Desculpe, a url que você enviou é inválida.', id);
				}

				const shortlink	= await urlShortener(args[0])
				await client.sendText(from, shortlink)
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
			case 'acorda':
				client.sendPtt(from, './media/acorda.mp3', id);
				break;
			case 'acordacorno':
				client.sendPtt(from, './media/acordaCorno.mp3', id);
				break;
			case 'berrante':
				client.sendPtt(from, './media/berrante.mp3', id);
				break;
			case 'bomdia':
				client.sendPtt(from, './media/bomDiaStreetFighter.mp3', id);
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
				break
			case 'tchau':
			case 'vaiembora':
				if (!isGroupMsg) {
					return client.reply(from, mess.error.nG, id);
				}

				if (!isGroupAdmins) {
					return client.reply(from, mess.error.oA, id);
				}

				client.sendText(from, 'Até a próxima! ( ⇀‸↼‶ )').then(() => client.leaveGroup(groupId));
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

				client.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false);
				break
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
							client.reply(from, `O convite foi redefinido!\n\nPara obter o link de convite do grupo, use o comando:\n*${prefix}conviteGrupo* `, id);
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
				let hehex		= '╔══✪〘 Membros do Grupo 〙✪══\n';
				for (let i = 0; i < groupMem.length; i++) {
					hehex += '╠➥';
					hehex += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`;
				}
				hehex += '╚═〘 *Z Y R O N  B O T* 〙'
				await client.sendTextWithMentions(from, hehex);
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
					fs.writeFileSync('./settings/welcome.json', jsonEncode(welcome));

					client.reply(from, 'A mensagem de boas-vindas agora está ativada!', id);
				} else if (args[0] == 'off') {
					if (!isWelcomeOn) {
						return client.reply(from, 'A mensagem de boas-vindas já está inativa!', id);
					}

					var xporn = welcome.indexOf(chatId);
					welcome.splice(xporn, 1);
					fs.writeFileSync('./settings/welcome.json', jsonEncode(welcome));

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
					fs.writeFileSync('./settings/nsfw.json', jsonEncode(nsfw));

					client.reply(from, 'NSFW agora está ativada!', id);
				} else if (args[0] == 'off') {
					if (!isNsfw) {
						return client.reply(from, 'NSFW já está inativa!', id);
					}

					var xporn = nsfw.indexOf(chatId);
					nsfw.splice(xporn, 1);
					fs.writeFileSync('./settings/nsfw.json', jsonEncode(nsfw));

					client.reply(from, 'NSFW agora está desativada!', id);
				} else {
					client.reply(from, `Habilitar / Desabilitar NSFW\n\nComo usar:\n${prefix}nsfw on\n${prefix}nsfw off`, id);
				}
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

				const loadedMsg	= await client.getAmountOfLoadedMessages()
				const chatIds	= await client.getAllChatIds()
				const groups	= await client.getAllGroups()
				client.sendText(from, `Status:\n- *${loadedMsg}* Loaded Messages\n- *${groups.length}* Group Chats\n- *${chatIds.length - groups.length}* Personal Chats\n- *${chatIds.length}* Total Chats`)
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
				textBlock += '╚═〘 *Z Y R O N  B O T* 〙'

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
					fs.writeFileSync('./settings/banneds.json', jsonEncode(banneds));
					client.reply(from, 'Feito! Número banido.');
				} else if (args[0] == 'del') {
					let xnxx = banneds.indexOf(args[1] + '@c.us');
					banneds.splice(xnxx, 1);
					fs.writeFileSync('./settings/banneds.json', jsonEncode(banneds));
					client.reply(from, 'Feito! Número desbanido.');
				} else {
					for (let i = 0; i < mentionedJidList.length; i++) {
						banneds.push(mentionedJidList[i]);
						fs.writeFileSync('./settings/banneds.json', jsonEncode(banneds));
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
		console.log(color('[EROR]', 'red'), err)
	}
}
