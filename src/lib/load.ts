import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

import { initDuckDb } from "./db";

function createTimestamps(line: string, regex: RegExp, value: string, n: number) {
    let i = 0;
    return line.replace(regex, function (match) {
        i += 1;
        if (i === n) return value;
        return match;
    });
}

function getFiles(filelist: FileList) {
    const files: (File | null)[] = []
    const length = filelist.length;
    let i = 0;
    while (i < length) {
        files[i] = filelist.item(i);
        i++;
    }
    return files
}

export async function loadFiles(db: AsyncDuckDB, filelist: FileList | undefined) {
    if (filelist) {
        const files = getFiles(filelist);
        let result: {}[] = []

        let csv: string | undefined
        // create a clean CSV
        await Promise.all(files.map((file) => file!.text()))
            .then((texts) => {
                let raw = texts.join('\r\n');
                let lines = raw
                    .split('\r\n')
                    .map((line) => createTimestamps(line, /,/g, ' ', 2));
                csv = lines.join('\r\n');
            });

        // preprocess
        await db.registerFileText('raw.csv', csv!);
        const conn = await db.connect();
        await conn.query(`
        create sequence id_seq start 1;

        drop table if exists traction;
        create table traction as 
            with unpivoted as (
                unpivot 'raw.csv'
                on columns(* exclude (column00, column01))
                into
                    name col
                    value force
            ),
            diff as (
                select
                    epoch(u.column01)*1000 as t,
                    u.force as force,
                    lead(epoch(u.column01), 10) over (order by u.column00) - epoch(u.column01) as delta,
                    cast(substring(u.col, 7) as int) - 2 as frame
                from unpivoted u
            ),
            corrected as (
                select
                    nextval('id_seq') :: int as id,
                    frame,
                    delta,
                    t + frame*delta*100 as abs_time,
                    epoch_ms(abs_time) as timestamp,
                    force :: int as force,
                    'A' as sensor
                from diff d
            ),
            result as (
                select
                    c.*,
                    c.abs_time - first(c.abs_time) over (order by c.abs_time) as rel_time,
                    rel_time/1000 as t
                from corrected c
            )
            select * from result;
        `);
        await conn.close();
    }
}