import argon2 from "argon2";
import { User } from '../entities/User';
import { MyContext } from '../types';
import { Query, Ctx, Resolver,Mutation, Field,Arg,ObjectType } from 'type-graphql';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from 'uuid';
import { getConnection } from 'typeorm'

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

// Return the object you want and any errors
@ObjectType() // You return object types
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver()
export class UserResolver {  

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return { errors: [
                    {
                        field: 'newPassword',
                        message: 'Password must be greater than 2 characters'
                    },
                ]
            }
        }

        // Check if token is good
        const key = FORGET_PASSWORD_PREFIX + token
        const userId = await redis.get(key);

        if (!userId) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'Token expired'
                    },
                ]
            }
        }

        // Update user
        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

        if (!user) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'User no longer exists'
                    },
                ]
            }
        }

        // Remember to hash new password!
        await User.update({id: userIdNum}, {password: await argon2.hash(newPassword)});

        redis.del(key);
        // login user after changing password
        req.session.userId = user.id;

        return { user };
    }
    

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis } : MyContext
    ) {
        const user = await User.findOne({ where: {email} }); // fetch the user by email. Use where for non-PK
        
        if (!user) { // email not in database
            return true;
        }

        const token = v4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token, 
            user.id, 
            'ex', 
            1000 * 60 * 60 * 24 * 3
        ) // three days reset pass

        await sendEmail(email, `<a href="localhost:3000:/change-password/${token}">Reset Password</a>`)

        return email;
    }

    // Figure out who the person is based on cookie
    @Query(() => User, {nullable: true})
    async me (
        @Ctx() { req }: MyContext
    ) {

        // Not logged in
        if (!req.session.userId) {
            return null;            
        }

        return await User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {    
        
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password)
        let user;
        try { // insert user and return it back
            const result = await getConnection()
            .createQueryBuilder()
            .insert().
            into(User).
            values({
                username: options.username,
                email: options.email,
                password: hashedPassword,
            })
            .returning("*") // return all from user 
            .execute(); 
            user = 5 as any;
            console.log(result);
        } catch(err) {

            if (err.detail.includes('already exists')) {
                return {
                    errors: [{
                        field: 'username',
                        message: "Username already taken",
                    }]
                };
            }
            console.log("Message ", err.message);
        }

        // Store user id session
        // This will set a cookie and keep them logged in
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse> {   
        const user = await User.findOne(            
            usernameOrEmail.includes("@") 
                ? { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }         
        );
        if (!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: "That username doesn't exist",
                    },
                ]
            }
        }
        const valid = await argon2.verify(user.password, password); // Compare hashed password with plain text pass
        
        if (!valid) {
            return {

                errors: [
                    {
                        field: 'password',
                        message: "Incorrect Password",
                    },
                ]
            };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() {req, res}: MyContext) {
        return new Promise( (resolve) => 
            req.session.destroy(err => {  // Remove session from redis
                res.clearCookie(COOKIE_NAME)
                if (err) {
                    console.log(err)
                    resolve(false)
                    return;
                }

                resolve(true)
            })
        )     
    }
}