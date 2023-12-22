import express from 'express'
import exphbs from 'express-handlebars'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import {
    __dirname,
    PORT,
    MONGO_URI,
    MONGO_DB_NAME,
    SECRET_PASS,
} from './utils.js'
import run from './run.js'
import passport from 'passport'
import initializePassport from './config/passport.config.js'

// Configuración de Express
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(`${__dirname}/public`))

app.engine('hbs', exphbs.engine({ extname: '.hbs' }))
app.set('views', `${__dirname}/views`)
app.set('view engine', 'hbs')

// Configuración de sesión y Passport
app.use(
    session({
        store: MongoStore.create({
            mongoUrl: MONGO_URI,
            dbName: MONGO_DB_NAME,
        }),
        secret: SECRET_PASS,
        resave: true,
        saveUninitialized: true,
    })
)
initializePassport()
app.use(passport.initialize())
app.use(passport.session())

// Desactivar el modo estricto para consultas de Mongoose
mongoose.set('strictQuery', false)

// Conexión a la db y configuración del servidor
try {
    await mongoose.connect(`${MONGO_URI}${MONGO_DB_NAME}`)
    console.log('DB connected 😎')
    
    const serverHttp = app.listen(PORT, () =>
        console.log(`Server listening on port ${PORT}🏃🏃...`)
    )
    
    const io = new Server(serverHttp)
    app.set('socketio', io)

    run(io, app)
} catch (error) {
    console.log(`Cannot connect to dataBase: ${error.message}`)
    process.exit()
}
