import { Injectable, Inject } from '@nestjs/common';
import { Client } from 'discord.js';
import { DISCORD_CLIENT } from 'src/constant/discord';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GitCodeReply{
    
    private readonly octokit: Octokit;
    dict = {};

    constructor(@Inject(DISCORD_CLIENT) private readonly client: Client) {
        this.octokit = new Octokit();
    }

    async send(interaction): Promise<any> {
        const id = interaction.options.getString('user-name');

        const res = await this.octokit.request('GET /users/{id}/repos', {
            id: id,
            headers: {
                'X-GiHub-Api-Version': '2022-11-28'
            }
        });

        for (var i = 0; i < res.data.length; i++) {
            const lan = await this.octokit.request('GET {url}', {
                url: res.data[i].languages_url,
                headers: {
                    'X-GiHub-Api-Version': '2022-11-28'
                }
            });

            for (var key in lan.data) {
                if (key in this.dict) {
                    this.dict[key] += lan.data[key];
                } else {
                    this.dict[key] = lan.data[key];
                }
            }
        }

        var sortable = [];
        for (var name in this.dict) {
            sortable.push([name, this.dict[name]]);
        }

        sortable.sort(function (a, b) {
            return b[1] - a[1];
        });

        return interaction.reply(
            `${id} ���� ���� ���� ����� ���� ${sortable[0].key} �Դϴ�.`
        );
    }
}

