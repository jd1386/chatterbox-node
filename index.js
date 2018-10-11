const express = require('express')
const fs = require('fs')
const moment = require('moment')
const exphbs = require('express-handlebars')
const cors = require('cors')

const app = express()
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

// middlewares
let myLogger = (req, res, next) => {
  console.log(`Received ${req.method} for ${req.originalUrl} at ${moment().utcOffset(9).format()}`)
  next()
}

// use middleware
app.use(myLogger)

// cors
app.use(cors())

// path
app.use(express.static('public'))

// view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// routes
app.get('/', (req, res) => {
  res.render('index')
})

let messages = []

app.route('/classes/messages')
  .get((req, res) => {
    fs.access('./public/storage.txt', (err) => {
      // no file; create a new one
      if (err) {
        if (err.code === 'ENOENT') {
          console.log('no storage file. create a new storage.txt file')
          fs.writeFileSync('./public/storage.txt', JSON.stringify(messages))
        }
      }
      // storage.txt still exists
      fs.readFile('./public/storage.txt', (err, data) => {
        messages = JSON.parse(data.toString())
      })
    })

    let result = { results: messages }

    res.send(JSON.stringify(result));
  })
  .post((req, res) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    })
    req.on('end', () => {
      messages.push(JSON.parse(body))
      // write to file
      fs.writeFile('./public/storage.txt', JSON.stringify(messages), (err) => {
        //if (err) throw err;
      });
    });
    
    var result = JSON.stringify({results: messages})
    
    res.send(result)
  })

app.listen(port, () => {
  console.log(`Express app listening on ${port}`)
})