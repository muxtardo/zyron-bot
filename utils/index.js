const request   = require('request')
const fs        = require('fs-extra')
const chalk     = require('chalk')
const moment    = require('moment-timezone')
moment.tz.setDefault('America/Sao_Paulo')

/**
 * Get text with color
 * @param  {String} text
 * @param  {String} color
 * @return  {String} Return text with color
 */
const color = (text, color) => {
    return !color ? chalk.blueBright(text) : chalk.keyword(color)(text)
}

const jsonEncode = (data) => {
    return JSON.stringify(data, null, 4);
}

const jsonDecode = (data) => {
    return JSON.parse(data);
}

// Message type Log
const messageLog = (fromMe, type) => {
    const stat  = jsonDecode(fs.readFileSync('./utils/stat.json'));
    if (fromMe) {
        if (stat.sent[type]) {
            stat.sent[type] += 1;
        } else {
            stat.sent[type] = 1;
        }
    } else {
        if (stat.receive[type]) {
            stat.receive[type] += 1;
        } else {
            stat.receive[type] = 1;
        }
    }
    fs.writeFileSync('./utils/stat.json', jsonEncode(stat));
}

/**
 * Get Time duration
 * @param  {Date} timestamp
 * @param  {Date} now
 */
const processTime = (timestamp, now) => {
    // timestamp => timestamp when message was received
    return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

/**
 * is it url?
 * @param  {String} url
 */
const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi))
}

// Message Filter / Message Cooldowns
const usedCommandRecently = new Set()

/**
 * Check is number filtered
 * @param  {String} from
 */
const isFiltered = (from) => {
    return !!usedCommandRecently.has(from)
}

/**
 *Download any media from URL
 *@param {String} url
 *@param {Path} locate
 *@param {Callback} callback
 */
const download = (url, path, callback) => {
  request.head(url, () => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}


/**
 * Add number to filter
 * @param  {String} from
 */
const addFilter = (from) => {
    usedCommandRecently.add(from)
    setTimeout(() => {
        return usedCommandRecently.delete(from)
    }, 5000) // 5sec is delay before processing next command
}

module.exports = {
    msgFilter: {
        isFiltered,
        addFilter
    },
    jsonEncode,
    jsonDecode,
    processTime,
    isUrl,
    color,
    messageLog,
	download
}
