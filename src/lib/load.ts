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
                    name frame
                    value force
            ),
            diff as (
                select
                    u.*,
                    lead(epoch(column01), 10) over (order by column00) - epoch(column01) as time_diff,
                    epoch(column01) - first(epoch(column01)) over (order by column00) as time
                from unpivoted u
            ),
            corrected as (
                select
                    cast(nextval('id_seq') as int) as id,
                    time_diff,
                    epoch(column01)*1000 + (substring(frame, 7) :: INT - 2)*time_diff*100 as t,
                    epoch_ms(epoch(column01)*1000 + (substring(frame, 7) :: INT - 2)*time_diff*100) as timestamp,
                    cast(force as int) as force,
                    'A' as sensor
                from diff
            )
            select * from corrected;
        `);
        await conn.close();
    }
}