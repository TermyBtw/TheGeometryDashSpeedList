import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 * FIX: use relative path for GitHub Pages compatibility
 */
const dir = './data';

export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        const list = await listResult.json();

        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/${path}.json`);
                    const level = await levelResult.json();

                    return [
                        {
                            ...level,
                            path,
                            records: Array.isArray(level.records)
                                ? level.records.sort((a, b) => b.percent - a.percent)
                                : [],
                        },
                        null,
                    ];
                } catch (e) {
                    console.error(`Failed to load level #${rank + 1}: ${path}`, e);
                    return [null, path];
                }
            })
        );
    } catch (e) {
        console.error(`Failed to load list.`, e);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const res = await fetch(`${dir}/_editors.json`);
        return await res.json();
    } catch (e) {
        console.error("Failed to load editors.", e);
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];

    list?.forEach(([level, err], rank) => {
        if (err || !level) {
            errs.push(err || `level-${rank}`);
            return;
        }

        // Verification
        const verifier =
            Object.keys(scoreMap).find(
                u => u.toLowerCase() === level.verifier?.toLowerCase()
            ) || level.verifier;

        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };

        scoreMap[verifier].verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records?.forEach(record => {
            const user =
                Object.keys(scoreMap).find(
                    u => u.toLowerCase() === record.user?.toLowerCase()
                ) || record.user;

            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };

            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
            } else {
                scoreMap[user].progressed.push({
                    rank: rank + 1,
                    level: level.name,
                    percent: record.percent,
                    score: score(rank + 1, record.percent, level.percentToQualify),
                    link: record.link,
                });
            }
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const total = [...scores.verified, ...scores.completed, ...scores.progressed]
            .reduce((sum, cur) => sum + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [
        res.sort((a, b) => b.total - a.total),
        errs,
    ];
}
