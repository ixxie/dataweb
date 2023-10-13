import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

const log = {
    io: false,
    timeQuery: false,
    diffQuery: false,
    mainQuery: false,
    preproc: false
}

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
    if (!filelist) {
        return;
    }
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
    // assess the number of sensors
    const schema = await conn.query(`describe select * from raw.csv;`);
    const columns = schema.toArray().map((row) => row.toJSON().column_name);
    const dataColumns = columns.splice(2);
    const sampleCount = dataColumns.length;
    const sampleRate = 10;
    const sensorCount = sampleCount / sampleRate;

    let sensorA = undefined, sensorB = undefined;
    if (sensorCount >= 1) {
        sensorA = dataColumns.splice(10);
    }
    if (sensorCount >= 2) {
        sensorB = dataColumns.splice(0, 10);
    }

    const preproc = { schema, columns, dataColumns, sampleCount, sampleRate, sensorCount }

    if (log.preproc) {
        console.log(preproc)
    }

    // time basis
    const time = /*sql*/`
        create table time as
            select
                column01 as current,
                first_value(column01) over (order by current) as firstval,
                lead(column01, 1) over (order by current)  as nextup,
                epoch(nextup) - epoch(current) as diff
            from raw.csv
            order by column01;
    `;
    if (log.timeQuery) {
        console.log(time)
    }
    await conn.query(time);

    // conditional query
    const unpivoted1 = /*sql*/`                
            with unpivoted1 as (
                unpivot 'raw.csv'
                on column02, column03, column04, column05, column06, column07, column08, column09, column10, column11
                into
                    name col
                    value signal
            ),
            sensorA as (
                select
                    *,
                    cast(substring(u1.col, 7) as int) - 2 as frame
                from unpivoted1 u1
            ),`;
    const unpivoted2 = sensorCount >= 2 ? /*sql*/`                
            unpivoted2 as (
                unpivot 'raw.csv'
                on column12, column13, column14, column15, column16, column17, column18, column19, column20, column21
                into
                    name col
                    value signal
            ),            
            sensorB as (
                select
                    *,
                    cast(substring(u2.col, 7) as int) - 12 as frame
                from unpivoted2 u2
            ),` : ``;
    const diff = /*sql*/`${unpivoted1}${unpivoted2 ?? ''}
            diff as (
                select
                    nextval('id_seq') :: int as id,
                    epoch(sA.column01)*1000 as epoch,
                    sA.frame as frame,
                    t.diff as diff,
                    epoch(sA.column01)*1000 - epoch(t.firstval)*1000  + sA.frame*t.diff*100 :: float as t,
                    sA.signal as sensorA,
                    ${sensorCount >= 2 ? 'sB.signal as sensorB,' : ''}
                from sensorA sA
                ${sensorB ? 'join sensorB sB on sA.column00 = sB.column00 and sA.frame = sB.frame' : ''}
                join time t on sA.column01 = t.current
                order by sA.column00, sA.col
            )`;
    const diffQuery = /*sql*/`
        create sequence id_seq start 1;

        drop table if exists raw;
        create table raw as
            ${diff}
            select * from diff
            order by frame, epoch;
    `
    if (log.diffQuery) {
        console.log(diffQuery)
    }
    await conn.query(diffQuery);

    // main query
    const finalQuery = /*sql*/`
        create sequence id_seq start 1;

        drop table if exists traction;
        create table traction as
            select
                t/100 :: float as t,
                sensorA :: int as sensorA,
                ${sensorCount >= 2 ? 'sensorB :: int as sensorB' : ''}
            from raw;
    `
    if (log.mainQuery) {
        console.log(finalQuery);
    }
    await conn.query(finalQuery);

    // logging
    if (log.io) {
        const input = await conn.query('select * from raw.csv limit 2500;')
        console.table(input.toArray().map(row => row.toJSON()))
        const output = await conn.query('select * from traction limit 2500;')
        console.table(output.toArray().map(row => row.toJSON()))
    }

    // end
    await conn.close();

    return preproc;
}