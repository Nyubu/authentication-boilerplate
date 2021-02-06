import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from "./constants";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from './resolvers/user';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis'
import cors from "cors";
import { createConnection } from 'typeorm'
import { Post } from './entities/Post';
import { User } from './entities/User';
import path from 'path';

// rerun
const main = async () => {
    const conn = await createConnection({
        url: 'http://localhost:5433',
        type: 'postgres',
        database: 'lireddit2',        
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, User],        
    })        
    await conn.runMigrations();
    const app = express();

    // The order that you add express middleware is the order it runs
    // Session middleware must run before apollo middleware because we're
    // using session middleware inside apollo
    const RedisStore = connectRedis(session)
    const redis = new Redis()
    app.set("trust proxy", 1);
    app.use(
      cors({
        // origin: process.env.CORS_ORIGIN,
        origin: "http://localhost:3000",
        credentials: true,
      })
    );
    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redis,
                disableTouch: true,
            }),
            
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true, // Good for security - can't access cookie from frontend js
                sameSite: "lax", // csrf
                secure: false,
                //secure: __prod__, // cookie only works in https
            },
            saveUninitialized: false,
            secret: 'adfgadfgg', // You want to hide this (make env variable)
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}) => ({ // acessible by all resolvers, we want to access the orm object
            req,
            res,
            redis
        }),
    })

    apolloServer.applyMiddleware({
        app, 
        cors: false, 
    });

    app.listen(5000, () => {
        console.log('server started on localhost:5000');
    })
    // const post = orm.em.create(Post, {title: 'my first post'}); // Does nothing to the database as is
    // await orm.em.persistAndFlush(post); // Now gets inserted to database using sql
    // const posts = await orm.em.find(Post, {}); // Get all posts in database - returns a promise so await
    // console.log(posts);
};



main().catch((err) => {
    console.error(err);
})

