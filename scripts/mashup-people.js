const { default: axios } = require('axios');
const { load } = require('cheerio');
const { writeFileSync } = require('fs');

/**
 * @todo github 비로그인 상태면 전체 유저 가져올 수 없음
 */

async function getPeopleGithubIds(page = 1) {
    const response = await axios.get(`https://github.com/orgs/mash-up-kr/people?page=${page}`);
    const html = response.data;

    const $ = load(html);

    const githubIds = $('#org-members-table > ul > li')
        .map((i, el) => {
            const [name, id] = $(el)
                .children('div.py-3.css-truncate.pl-3.flex-auto')
                .text()
                .trim()
                .split('\n')
                .map((value) => value.trim());

            if (id) {
                return id;
            }

            return name;
        })
        .toArray();

    return githubIds;
}

async function run() {
    try {
        const ids = [];
        const pageLength = 8;

        for (let i = 3; i <= pageLength; i++) {
            const _ids = await getPeopleGithubIds(i);
            ids.push(..._ids);
        }

        writeFileSync('./scripts/output/sample.txt', ids.join('\n'));
    } catch (error) {
        console.log(error);
    }
}

run();
