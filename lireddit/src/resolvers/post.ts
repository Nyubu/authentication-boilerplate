import { Post } from '../entities/Post';
import { Query,Resolver,Arg,Int,Mutation, Field, Ctx, InputType, UseMiddleware, Root, FieldResolver } from 'type-graphql';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';

@InputType()
class PostInput {
    @Field()
    title: string 
    @Field()
    text: string
}

@Resolver(Post) // <- mandated by field resolver
export class PostResolver {  
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ) {
        return root.text.slice(0,50); // Allows you to pull only this much ( have to edit query in fr-end )
    }

    // Get all posts
    @Query(() => [Post])
    async posts( 
        @Arg('limit', () => Int) limit: number, // For pagination
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<Post[]> {
        const realLimit = Math.min(50, limit);
        const qb = getConnection() // getConnection from typeorm
            .getRepository(Post)
            .createQueryBuilder("p")
            .orderBy('"createdAt"', "DESC") // Double quotes to reference the column
            .take(realLimit); // Cap the number of posts

        if (cursor) {
            qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) })
        }

        return qb.getMany(); // getMany actually executes the sql, so we do settings first
    
    }
    
    @Query(() => Post, { nullable: true }) // getting data
    post( @Arg('id', () => Int) id: number): Promise<Post | undefined> { //typescript type
        return Post.findOne(id);
    }

    @Mutation(() => Post) // Mutation is for update, insert, delete
    @UseMiddleware(isAuth)
    async createPost( 
        @Arg("input") input: PostInput,
        @Ctx() {req}: MyContext
    ): Promise<Post> {
       
        // Post.create({ ...input, creatorId: req.session.id, }).save();
        Post.create({ ...input, creatorId: req.session.id, } as any)
        return Post.save({ ...input, creatorId: req.session.id, } as any);
    }

    @Mutation(() => Post, { nullable: true }) // Mutation is for update, insert, delete
    async UpdatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, {nullable: true}) title: string,
        ): Promise<Post | null> {
            const post = await Post.findOne(id);
            if (!post) {
                return null;
            }
            if (typeof title !== 'undefined') { // update if title isn't blank
                await Post.update({id}, {title});
            }
            return post;
        }

    @Mutation(() => Boolean) // Mutation is for update, insert, delete
    async deletePost(
        @Arg('id') id: number): Promise<boolean> {
            try {
                await Post.delete(id);
            } catch(err) {
                console.error(err);
                return false;
            }
            return true;
        }
}