const axios		= require('axios');

const ytmp3 = async (url, apiKey) => new Promise((resolve, reject) => {
    axios.get(`https://mhankbarbar.moe/api/yta?url=${url}&apiKey=${apiKey}`)
		.then((res) => {
			resolve(res.data);
		})
		.catch((err) =>{
			reject(err);
		});
});

const ytmp4 = async (url, apiKey) => new Promise((resolve, reject) => {
    axios.get(`https://mhankbarbar.moe/api/ytv?url=${url}&apiKey=${apiKey}`)
		.then((res) => {
			resolve(res.data);
		})
		.catch((err) =>{
			reject(err);
		});
});

const bible = async () => new Promise((resolve, reject) => {
	axios.get('https://www.abibliadigital.com.br/api/verses/nvi/random')
		.then((res) => {
			let data = res.data
			resolve({
				book:		data.book.name,
				chapter:	data.chapter,
				number:		data.number,
				text:		data.text
			});
		})
		.catch((err) =>{
			reject(err)
		})
});

const cripto = async (coin) => new Promise((resolve, reject) => {
    axios.get(`https://www.mercadobitcoin.net/api/${coin}/ticker`)
		.then((res) => {
			let data = res.data.ticker
			resolve({
				high:	parseFloat(data.high).toFixed(2),
				low:	parseFloat(data.low).toFixed(2),
				vol:	parseFloat(data.vol).toFixed(8),
				last:	parseFloat(data.last).toFixed(2),
				buy:	parseFloat(data.buy).toFixed(2),
				sell:	parseFloat(data.sell).toFixed(2),
				open:	parseFloat(data.open).toFixed(2),
				date:	parseInt(data.date)
			});
		})
		.catch((err) =>{
			reject(err)
		});
})

const quotation = async (coin1, coin2) => new Promise((resolve, reject) => {
    axios.get(`https://economia.awesomeapi.com.br/last/${coin1}-${coin2}`)
		.then((res) => {
			let data = res.data[coin1 + '' + coin2]
			resolve({
				name:	data.name,
				high:	parseFloat(data.high).toFixed(2),
				low:	parseFloat(data.low).toFixed(2),
				varBid:	data.varBid,
				bid:	parseFloat(data.bid).toFixed(2)
			})
		})
		.catch((err) =>{
			reject(err)
		})
})

const fb = async (url) => new Promise((resolve, reject) => {
	axios.get(`https://arugaz.herokuapp.com/api/fb?url=${url}`)
		.then((res) => {
			if (res.data.error) {
				resolve({
					status: 'error',
					link: res.data.result
				});
			}

			resolve({
				linkhd: res.data.result.hd,
				linksd: res.data.result.sd
			});
		})
		.catch((err) =>{
			reject(err)
		})
});

const stalkig = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://arugaz.herokuapp.com/api/stalk?username=${url}`)
		.then((res) => {
			if (res.data.error) {
				resolve(res.data.error);
			}

			const text = `Usuário: ${res.data.Username}\nNome: ${res.data.Name}\nBio: ${res.data.Biodata}\nSeguidores: ${res.data.Jumlah_Followers}\nSeguindo: ${res.data.Jumlah_Following}\nPostagens: ${res.data.Jumlah_Post}`
			resolve(text);
		})
		.catch((err) =>{
			reject(err);
		});
});

const stalkigpict = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://arugaz.herokuapp.com/api/stalk?username=${url}`)
    .then((res) => {
		if (res.data.error) {
			resolve('https://c4.wallpaperflare.com/wallpaper/976/117/318/anime-girls-404-not-found-glowing-eyes-girls-frontline-wallpaper-preview.jpg');
		}

		resolve(`${res.data.Profile_pic}`);
    })
    .catch((err) =>{
        reject(err);
    })
});

const quote = async () => new Promise((resolve, reject) => {
    axios.get(`https://arugaz.herokuapp.com/api/randomquotes`)
		.then((res) => {
			const text = `Autor: ${res.data.author}\n\nCitação: ${res.data.quotes}`;
			resolve(text);
		})
		.catch((err) =>{
			reject(err);
		});
});

const wiki = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://arugaz.herokuapp.com/api/wiki?q=${url}`)
		.then((res) => {
			resolve(res.data.result);
		})
		.catch((err) =>{
			reject(err);
		});
});

const weather = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://rest.farzain.com/api/cuaca.php?id=${url}&apikey=O8mUD3YrHIy9KM1fMRjamw8eg`)
		.then((res) => {
			if (res.data.respon.cuaca == null) {
				resolve('Desculpe, sua área não está disponível!');
			}

			const text = `Tempo em: ${res.data.respon.tempat}\n\nClima: ${res.data.respon.cuaca}\nVento: ${res.data.respon.angin}\nDesk: ${res.data.respon.deskripsi}\nUmidade: ${res.data.respon.kelembapan}\nTemperatura: ${res.data.respon.suhu}\nAr: ${res.data.respon.udara}`
			resolve(text);
		})
		.catch((err) =>{
			reject(err);
		});
});

const write = async (teks, apiKey) => new Promise((resolve, reject) => {
	let url = `https://mhankbarbar.moe/api/nulis?font=1&buku=1&text=${encodeURIComponent(teks)}&apiKey=${apiKey}`
    axios.get(url)
		.then((res) => {
			resolve(`${res.data.result}`);
		})
		.catch((err) => {
			reject(err);
		});
});

const movie = async (title) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/sdmovie?film=${encodeURIComponent(title)}`)
		.then((res) => {
			if (res.data.error) {
				return resolve({status: 'error', hasil: res.data.result});
			}

			const teksmov = `Título: ${res.data.result.title}\nAvaliação: ${res.data.result.rating}\nSinopse: ${res.data.result.sinopsis}\nLink: ${res.data.result.video}`
			resolve({
				status:	'success',
				hasil:	teksmov,
				link:	res.data.result.thumb
			});
		})
		.catch((err) => {
			reject(err);
		});
});

const qrcode = async (url, size) => new Promise((resolve, reject) => {
	axios.get(`http://api.qrserver.com/v1/create-qr-code/?data=${url}&size=${size}x${size}`)
		.then((res) => {
			resolve(`http://api.qrserver.com/v1/create-qr-code/?data=${url}&size=${size}x${size}`);
		})
		.catch((err) => {
            reject(err);
        });
});

const qrread = async (url) => new Promise((resolve, reject) => {
	axios.get(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${url}`)
		.then((res) => {
			if (res.data[0].symbol[0].data == null) {
				return resolve(`[❌] Nenhuma informação encontrada!`);
			}

			const textqr = `*Informações:* ${res.data[0].symbol[0].data}`
			resolve(textqr);
		})
		.catch((err) => {
            reject(err);
        })
});

module.exports = {
	bible,
	quotation,
	cripto,
    ytmp3,
    ytmp4,
	fb,
    stalkig,
    stalkigpict,
    quote,
    wiki,
    weather,
    write,
	movie,
	qrcode,
	qrread
}
