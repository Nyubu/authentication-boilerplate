import { InputType, Field } from 'type-graphql';


@InputType() // Use for arguments
export class UsernamePasswordInput {

    @Field()
    email: string;

    @Field()
    username: string;

    @Field()
    password: string;
}
