const { default: axios } = require('axios');
const { load } = require('cheerio');
const { writeFileSync } = require('fs');

/**
 * @todo github 비로그인 상태면 전체 유저 가져올 수 없음
 */

async function getPeopleGithubIds(page = 1) {
    const response = await axios.get(
        `https://api.github.com/orgs/mash-up-kr/members?page=${page}`,
        {
            headers: {
                Authorization: `token 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`,
            },
        },
    );
    const githubIds = response.data.map((user) => user.login);
    return githubIds;
}

async function run() {
    try {
        const ids = [];
        const pageLength = 8;

        for (let i = 1; i <= pageLength; i++) {
            const _ids = await getPeopleGithubIds(i);
            ids.push(..._ids);
        }

        writeFileSync('./scripts/output/sample.txt', ids.join('\n'));
    } catch (error) {
        console.log(error);
    }
}

run();
