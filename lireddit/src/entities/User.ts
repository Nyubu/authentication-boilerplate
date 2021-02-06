import { BaseEntity, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Column } from 'typeorm'
import { ObjectType, Field, Int } from 'type-graphql';
import { Post } from './Post';

@ObjectType()
@Entity()
export class User extends BaseEntity {
    
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(() => Post, post => post.creator) // Create foreign key in user table
    posts: Post[];

    @Field()
    @Column({unique: true}) // unique username
    username!: string;
    
    @Field()
    @Column({unique: true}) // unique email
    email!: string;
    
    @Column()
    password: string;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}