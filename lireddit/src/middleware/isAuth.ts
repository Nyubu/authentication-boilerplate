import { MiddlewareFn } from "type-graphql"
import { MyContext } from "../types"

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => { // Runs before the resolver
    if (!context.req.session.userId) {
        throw new Error("Not Authenticated")        
    }

    return next();
}