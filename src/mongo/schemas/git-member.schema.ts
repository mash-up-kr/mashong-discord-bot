import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GitMemberDocument = HydratedDocument<GitMemberModel>;

@Schema()
export class GitMemberModel {
    @Prop()
    githubId: string;

    @Prop()
    team: string;
}

export const GitMemberSchema = SchemaFactory.createForClass(GitMemberModel);
