const { resolve, reject } = require('promise')
const { fetchJson, fetchBase64 } = require('../utils/fetcher')
const { shuffle } = require('../utils')
const fs = require('fs-extra')
const {
    apiSS
} = JSON.parse(fs.readFileSync('./settings/api.json'))

/**
 * Get random meme
 *
 * @return  {Promise} return meme 
 */
const randomMeme = async () => new Promise((resolve, reject) => {
    fetchJson('https://kagchi-api.glitch.me/meme/memes', { method: 'get' })
        .then((result) => resolve(`https://imgur.com/${result.hash}.jpg`))
        .catch((err) => reject(err));
});

/**
 * Get nsfw from random subreddit
 *
 * @param  {String} _subreddit
 * @return  {Promise} return meme 
 */
const randomNSFW = async (_subreddit) => new Promise((resolve, reject) => {
    var subreddits = [
        'animebooty', 'sideoppai', 'ahegao',
        'animethighss',  'animefeets', 'animearmpits'
    ]

    const randSub = subreddits[Math.random() * subreddits.length | 0]
    console.log('looking for nsfw on ' + randSub)

    fetchJson('https://meme-api.herokuapp.com/gimme/' + randSub)
        .then((result) => resolve(result.url))
        .catch((err) => reject(err))
});

/**
 * Create custom meme
 * @param  {String} imageUrl
 * @param  {String} topText
 * @param  {String} bottomText
 */
const makeMeme = async (imageUrl, top, bottom) => new Promise((resolve, reject) => {
    topText     = top.trim().replace(/\s/g, '_').replace(/\?/g, '~q').replace(/\%/g, '~p').replace(/\#/g, '~h').replace(/\//g, '~s')
    bottomText  = bottom.trim().replace(/\s/g, '_').replace(/\?/g, '~q').replace(/\%/g, '~p').replace(/\#/g, '~h').replace(/\//g, '~s')
    fetchBase64(`https://docs-jojo.herokuapp.com/api/meme-gen?top=${topText}&bottom=${bottomText}&img=${imageUrl}`, 'image/png')
        .then((result) => resolve(result))
        .catch((err) => reject(err))
});

/**
 * Create wanted meme
 * @param  {String} imageUrl
 */
const makeWanted = async (imageUrl, crime) => new Promise((resolve, reject) => {
    var topText     = encodeURIComponent('Procurado(a)');
    var bottomText  = encodeURIComponent(crime); // 'Ligue: 190';

    // topText     = topText.trim().replace(/\s/g, '_').replace(/\?/g, '~q').replace(/\%/g, '~p').replace(/\#/g, '~h').replace(/\//g, '~s')
    // bottomText  = bottomText.trim().replace(/\s/g, '_').replace(/\?/g, '~q').replace(/\%/g, '~p').replace(/\#/g, '~h').replace(/\//g, '~s')
    // var linkAPI = `https://docs-jojo.herokuapp.com/api/meme-gen?top=${topText}&bottom=${bottomText}&img=${imageUrl}`;
    var linkAPI = `https://api.memegen.link/images/custom/${topText}/${bottomText}.png?background=${imageUrl}`;
    fetchBase64(linkAPI, 'image/png')
        .then((result) => resolve(result))
        .catch((err) => reject(err))
});

const printLink = async (url) => new Promise((resolve, reject) => {
    fetchBase64(`https://api.apiflash.com/v1/urltoimage?access_key=${apiSS}&url=${url}`)
    .then((res) => resolve(res))
    .catch((err) => reject(err))
});


/**
 *
 * @param  {String} query
 *
 */
 const pinterest = async (wall) => new Promise((resolve, reject) => {
     fetchJson('http://api.fdci.se/rep.php?gambar=' + wall)
        .then((result) => {
            const andwall = Math.floor(Math.random() * 41)
            resolve(result[andwall])
        })
        .catch((err) => {
            reject(err)
        })
 })

 /**
 *
 * @param  {String} 
 * @param  {String}
 * @param  {String}
 * 
 */
const quote = async (quotes, author , type) => new Promise((resolve, reject) => {
     const q = quotes.replace(/ /g, '%20').replace('\n','%5Cn')
     fetchJson('https://terhambar.com/aw/qts/?kata=' + q + '&author=' + author + '&tipe=' + type + '/')
        .then((res) => {
            resolve(res.result)
     })
        .catch((err) => {
             reject(err)
     })
     
 })

 /**
 *
 * @param  {String} query
 *
 */
const sreddit = async (reddit) => new Promise((resolve, reject) => {
     fetchJson('https://meme-api.herokuapp.com/gimme/' + reddit + '/')
       .then((rest) => {
           resolve(rest.url)
        })
       .catch((errr) => {
           reject(errr)
       })
});

const randomMember = async (client, author, botNumber, groupMembers) => {
    let $member     = false;
    let $attempts	= 0;

	groupMembers = shuffle(groupMembers);
    for await (let random of groupMembers) {
        if ($attempts >= 10) {
            random	= false;
            break;
        }
        ++$attempts;

        // Se retornar undefined, fala que não tem ninguem procurado no grupo
        if (typeof random == 'undefined') {
            continue;
        }

        // Não seleciona o bot
        if (botNumber == random.id) {
            continue;
        }

		// Não seleciona o mané que usou o comando
        if (author == random.id) {
            continue;
        }

        // O procurado ta sem foto, vamos fazer um segundo sorteio
        let profilePic		= await client.getProfilePicFromServer(random.id)
            .catch(() => {});
        if (profilePic == '' || profilePic == undefined) {
            continue;
        } else {
            // Achou a princesinha aqui, vamos parar!
			$member	= random;
            break;
        }
    }

    return $member;
};

module.exports = {
    randomMember,
    makeWanted,
    randomMeme,
    makeMeme,
    printLink,
    pinterest,
    quote,
    sreddit,
    randomNSFW
}
