const { default: translate } = require('google-translate-open-api')

/**
 * Translate Text
 * @param  {String} text
 * @param  {String} lang
 */

 const trans = (text, lang) => new Promise((resolve, reject) => {
    console.log(`Translate text to ${lang}...`)
    translate(text, { to: lang })
        .then((text) => resolve(text.data[0]))
        .catch((err) => reject(err))
});
module.exports = {
    trans
}