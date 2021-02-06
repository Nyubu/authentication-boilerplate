import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Column } from 'typeorm'
import { ObjectType, Field, Int } from 'type-graphql';
import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    

    // Columns in our database
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;     
   
    // Single title field
    @Field() // You can eliminate this to make distinctions (hide or show graphql)
    @Column() // <- without this it is just a field in a class
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({ type: "int", default: 0})
    points!: number;

    @Field()
    @Column()
    creatorId: number;

    @ManyToOne(() => User, user => user.posts) // Create foreign key in user table
    creator: User;

    // Dates when the object was created (doesn't work with nativeInsert because an object isn't instantiated)
    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn() // Hook that creates a new date every update
    updatedAt: Date;
 
}