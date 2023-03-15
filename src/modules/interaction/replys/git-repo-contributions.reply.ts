import { Injectable, Inject } from '@nestjs/common';
import { Client, SlashCommandBuilder } from 'discord.js';
import { DISCORD_CLIENT } from 'src/constant/discord';
import { Octokit } from '@octokit/rest';
import { setTimeout } from 'timers/promises';
import DiscordInteraction from '../../../domains/discord/interaction';
import { Command } from 'src/decorator/command.decorator';
import { InteractionReply } from './reply';

@Command(
    new SlashCommandBuilder()
        .setName('git-repo-contributions')
        .setDescription('get user git repository contributions')
        .addStringOption((option) => {
            return option
                .setName('repo-url')
                .setDescription('name of repository')
                .setRequired(true);
        }),
)
@Injectable()
export class GitRepoContributionsReply implements InteractionReply {
    private readonly MAX_ATTEMPTS = 12;
    octokit: Octokit;
    constructor(@Inject(DISCORD_CLIENT) private readonly client: Client) {
        // TODO: 밖에서 주입해주도록 수정
        this.octokit = new Octokit();
    }

    private parseParam(interaction: DiscordInteraction) {
        const url = interaction.options.getString('repo-url');
        const regEx = new RegExp(
            /(https:\/\/|http:\/\/)?(github.com)\/(?<owner>[\w\.@\:/\-~]+)\/(?<repo>[\w\.@\:/\-~]+)/,
            'gi',
        );
        const regRes = regEx.exec(url);
        const owner = regRes.groups.owner;
        const repo = regRes.groups.repo;
        if (!repo || !owner) {
            throw new Error('repository 주소 형식이 유효하지 않습니다.');
        }
        return { owner, repo };
    }

    private createMsg(gitResponse) {
        return gitResponse.data
            .map((user) => {
                return `${user.author.login} 님의 총 커밋 수: ${user.total}`;
            })
            .join('\n');
    }

    async send(interaction: DiscordInteraction): Promise<any> {
        try {
            const { owner, repo } = this.parseParam(interaction);

            await interaction.deferReply();
            for (let attempts = 1; attempts <= this.MAX_ATTEMPTS; attempts++) {
                const gitRes = (await this.octokit.rest.repos.getContributorsStats({
                    owner,
                    repo,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                })) as any;
                if (gitRes.status === 200) {
                    const msg = this.createMsg(gitRes);
                    await interaction.editReply(msg);
                    break;
                } else if (gitRes.status === 202) {
                    if (attempts == this.MAX_ATTEMPTS) throw new Error('요청을 실패하였습니다');
                    await setTimeout(10000);
                } else {
                    throw new Error('요청을 실패하였습니다');
                }
            }
        } catch (e) {
            await interaction.editReply(e.message);
        }
    }
}
