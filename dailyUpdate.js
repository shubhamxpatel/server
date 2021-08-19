const MongoClient = require('mongodb').MongoClient;
const fetch = require('node-fetch')
const uri = "mongodb+srv://shubhamp:Kumar@123@cluster0.n5lab.mongodb.net/test?retryWrites=true&w=majority";
var db;
var arr = []
var count;
var h, w;
var weight = [.05, .2, .3, .3, .1, .05]
var list = []
var responsarr = []

function cal(s1, s2) {

    let x1 = (s1) ? s1.split(" ") : []
    let x2 = (s2) ? s2.split(" ") : []
    let x3 = x1.filter(x => x2.includes(x))
    let x4 = new Set([...x1, ...x2])


    return x3.length / x4.size
}

function corr(a, b) {
    let p = 0;
    for (let i = 0; i < w; i++) {
        p = p + weight[i] * cal(list[a][i], list[b][i])
    }
    return p;
}
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function get(img_url, s) {
    let reg = new RegExp(s, 'i')
        //console.log(reg)
    for (let x of img_url) {
        //console.log(x[0])
        let p = await x[0].match(reg)
            // console.log(p)
        if (p) {
            //   console.log(x[1])
            return `https:${x[1]}`
        }
    }
    return ""
}
async function getimdbId(s) {

    let q = s
    console.log(`https://www.google.com/search?q=${(q+" imdb").split(" ").join("+")}`)
    let result = await fetch(`https://www.google.com/search?q=${(q+" imdb").split(" ").join("+")}`);
    let text1 = await result.text()
    let m = text1.match(/\<a.*?href="\/url\?q=https:\/\/www.imdb.com\/name\/(.*?)\//)
        //console.log(text1)
    if (m) {
        return `https://www.imdb.com/name/${m[1]}`
    }
    return ""
}
async function addActor(s) {

    let query = await getimdbId(s)
    if (query !== "") {
        let result = await fetch(query)
        let text = await result.text()
            //console.log(text)
        let img_url1 = text.match(/\<img id="name-poster"(\s|.)*?src="(.*?)"/)
            //let img_url = await get(img_url1)
        let img_url = (img_url1) ? img_url1[2] : "";
        console.log(img_url, s)

        client.db().collection("actors").insertOne({ name: s, img_url: img_url, wiki_link: `${query}` }, (err, res) => { /*console.log(res, err) */ })
    }


}

async function getTrailer(query) {
    //return query
    let ans = await fetch(`https://www.google.com/search?q=${query+" movie trailer"}`).then(async res => {
        console.log(query)
        let text = await res.text()
        let result = text.matchAll(/href=".*?"/g)
        let arr1 = []
        for (x of result) { arr1.push(unescape(x[0])) }
        for (let p of arr1) {
            if (p.match(/https:\/\/www\.youtube\.com.*?"/g)) {
                let x = "";
                if (p.match(/watch\?v=(.*?)&/)) {
                    x = `${p.match(/watch\?v=(.*?)&/)[1]}`;
                }
                console.log(`https://www.youtube.com/embed/${x}`, " 1")
                return `https://www.youtube.com/embed/${x}`;
            }
        }
        return ""

    })
    return ans;
}
async function fun(movie) {
    console.log(movie)
    let result = await fetch(`http://www.omdbapi.com/?i=tt3896198&apikey=ad2b8365&t=${escape(movie)}`)
    let text;

    try {
        text = await result.json();
        console.log(text, "hello")
    } catch (error) {
        console.log(error, "json error occured")
    }

    if (text && text.Title) {
        let movie_db = {
            movie_name: text.Title,
            movie_lang: (text.Language) ? text.Language.split(", ") : [],
            movie_actors: (text.Actors) ? text.Actors.split(", ") : [],
            movie_gener: (text.Genre) ? text.Genre.split(", ") : [],
            like: 0,
            dislike: 0,
            admin: "shubham patel",
            story: text.Plot,
            createTime: new Date(),
            director_name: text.Director,
            release_date: new Date(text.Released),
            page_visited: 0,
            run_time: parseInt((text.Runtime) ? text.Runtime.split(" ")[0] : "not found")


        }
        for (let x in movie_db) {
            if (typeof(movie_db[x]) === "string") {
                movie_db[x] = movie_db[x].toLowerCase()
            }
            if (typeof(movie_db[x]) === "object") {
                for (let i = 0; i < movie_db[x].length; i++) {
                    movie_db[x][i] = movie_db[x][i].toLowerCase()
                }
            }

        }
        // console.log(text.Released)
        await getTrailer(movie_db.movie_name + " " + text.Released.split(" ")[2]).then(async trailer => {

            movie_db.movie_trailer = trailer
            movie_db.poster_url = text.Poster

            //console.log(movie_db)

            db.collection("movies").insertOne(movie_db, async(err, res) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(movie_db.movie_name + " inserted into mongo database")
                    for (let r of movie_db.movie_actors) {
                        await addActor(r);
                        console.log(r)
                    }


                }


            })


        })

    }
    count++;
    await db.collection("pendingmovies").deleteMany({ name: movie })
    console.log(count)
    if (count < arr.length) {
        //.then(async() => {

        //  console.log('connection closed')
        //console.log('connection closed')
        fun(arr[count])
            //})

    } else {
        console.log("hello")
        await creatematch()

    }
}
async function pendingmovie() {
    await client.connect(async err => {
        db = client.db("test")
        console.log('connected')
            //pendingmovie()

        arr = []
        list = []
        let result = await db.collection('pendingmovies').find({})
        await result.toArray().then(mv => {

            for (let xr of mv) {
                arr.push(xr.name);
                console.log(xr)
            }
        })
        if (arr.length > 0) {
            count = 0;
            console.log(arr[0])
            fun(arr[count])
        } else {
            await creatematch()
                // console.log('connection closed')

        }
    });



}


async function creatematch() {
    let result = await db.collection("movies").find()
        //responsarr = await 
    result.toArray().then(responsarr => {
        //console.log(responsarr)
        //responsarr.filter()
        if (responsarr.length > 0) {
            for (let i = 0; i < responsarr.length; i++) {
                if (!responsarr[i]) { console.log("undefined fiels") }
                //console.log(responsarr[i].movie_name)
                list.push([])
                list[i].push(responsarr[i].movie_name)
                list[i].push(responsarr[i].movie_lang.join(" "))
                list[i].push(responsarr[i].movie_actors.join(" "))
                list[i].push(responsarr[i].movie_gener.join(" "))
                list[i].push(responsarr[i].director_name)
                list[i].push(`${responsarr[i].release_date}`.split("-")[0])

            }
            h = list.length
            w = list[0].length
            let corrarr = []
            let movies1 = []
            for (let i = 0; i < h; i++) {
                corrarr.push([])
                for (let j = 0; j < h; j++) {
                    if (responsarr[i] && responsarr[j]) {
                        let x = corr(i, j)
                            //console.log(x)
                        corrarr[i].push({ index: j, movie_name: responsarr[j].movie_name, poster_url: responsarr[j].poster_url, matchP: x })
                    }
                }
                corrarr[i].sort((a, b) => {
                        if (a.matchP == b.match) {
                            return responsarr[b.index].page_visited - responsarr[a.index].page_visited
                        } else {
                            return -a.matchP + b.matchP
                        }
                    })
                    //console.log(corrarr[i])

                corrarr[i] = corrarr[i].slice(0, 20)


            }
            let p = 0;

            function sett() {
                if (p == h) {

                    console.log("all movies updated and connection closed");
                    //client.close();
                    return;
                }
                // setTimeout(() => {
                db.collection("recommend").updateOne({ movie: responsarr[p].movie_name }, {
                        $set: {
                            movie: responsarr[p].movie_name,
                            recommendArr: corrarr[p],
                            lastModified: new Date().toTimeString()
                        }
                    }, { upsert: true },
                    (err, res) => {
                        console.log(responsarr[p].movie_name + "updated")
                            //console.log("hello")
                        p++
                        sett()
                    })


                // }, 100);

            }
            sett()

        }
    })
}
//pendingmovie()
module.exports = pendingmovie