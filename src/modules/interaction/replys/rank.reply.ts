import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { SlashCommandBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { Now, toFormat } from 'src/common/date';
import DiscordInteraction from 'src/domains/discord/interaction';
import { SetCommand } from 'src/decorator/command.decorator';
import { InteractionReply } from './reply';

type GithubEvent = {
    id: number;
    type: 'PushEvent' | 'CreateEvent' | 'WatchEvent' | 'ForkEvent';
    actor: object;
    repo: object;
    payload: object;
    public: boolean;
    created_at: Date;
    org: object;
};

@Injectable()
export class RankReply implements InteractionReply {
    constructor(private readonly httpService: HttpService) {}

    @SetCommand()
    command() {
        return new SlashCommandBuilder()
            .setName('rank')
            .setDescription('Mash-Up Github Jandi Ranking');
    }

    async send(interaction: DiscordInteraction) {
        /**
         * @todo db에 저장해서 읽어오도록 바꾸기
         */
        const githubIds = readFileSync('./scripts/output/ids.txt', { encoding: 'utf-8' }).split(
            '\n',
        );

        const eventsByUsers = await Promise.all(
            githubIds.map(async (githubId) => {
                const response = await this.httpService.axiosRef.get(
                    `https://api.github.com/users/${githubId}/events?page=1`,
                );

                return response.data;
            }),
        );

        const mostCommiterIndex = this.getMostCommiterIndex(eventsByUsers);
        const mostCommiter = githubIds[mostCommiterIndex];
        interaction.reply(
            `오늘 가장 많은 잔디를 심은 매쉬업 멤버는.. \`${mostCommiter}\` 입니다!!`,
        );
    }

    private getMostCommiterIndex(eventsByUsers) {
        const today = Now().format('YYYY-MM-DD');

        const todayEventCountByUsers = eventsByUsers.map((eventsByUser) => {
            const todayEventByUser = eventsByUser.filter(isTodayEvent);
            return todayEventByUser.length;
        });

        return todayEventCountByUsers.indexOf(Math.max(...todayEventCountByUsers));

        function isTodayEvent(event: GithubEvent) {
            const createAt = toFormat(event.created_at, 'YYYY-MM-DD');
            return createAt === today;
        }
    }
}
