import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

import { queries as q } from './queries';

import { toObject } from '$lib/db';

export async function load(db: AsyncDuckDB, filelist: FileList | undefined) {

    const log = {
        all: true,
        files: false,
        csv: false,
        metadata: false,
        sensors: false,
        queries: false
    }

    // LOAD FILES

    // unpack filelist

    if (!filelist) return;
    const files = getFiles(filelist);
    if (log.files || log.all) console.log({ filelist, files });

    // clean the csv

    interface Csv {
        raw?: string;
        clean?: string;
    }

    let csv: Csv = { raw: undefined, clean: undefined };

    // join date and time columns into a timestamp
    await Promise.all(files.map((file) => file!.text()))
        .then((texts) => {
            csv.raw = texts.join('\r\n');
            let lines = csv.raw
                .split('\r\n')
                .map((line) => createTimestamps(line, /,/g, ' ', 2));
            csv.clean = lines.join('\r\n');
        });

    // use the clean csv as input
    await db.registerFileText('input.csv', csv.clean!);

    if (log.csv || log.all) console.log(csv);

    // start the connection

    const conn = await db.connect();

    // produce metadata

    const schema = toObject(await conn.query(`describe select * from input.csv;`));
    const sample = toObject(await conn.query(`select * from input.csv limit 100;`));
    const columns = schema.map((col) => col.column_name);

    const sampleCount = columns.length - 2;
    const sampleRate = 10;
    const sensorCount = sampleCount / sampleRate;

    const idColumns = [...columns].splice(0, 2);
    const signalColumns = [...columns].splice(2, sampleCount);

    const metadata = {
        schema,
        sample,
        columns,
        idColumns,
        signalColumns,
        sampleCount,
        sampleRate,
        sensorCount
    }

    if (log.metadata || log.all) {
        console.log(metadata);
        console.table(metadata.sample);
    }

    if (metadata.sampleCount % 10 !== 0) {
        throw new Error(
            `Malformed data: the number of signal columns (${metadata.sampleCount}) is not a multiple of 10`
        );
    }

    // Identify the columns for each sensor

    let sensors = [];
    let allColumns = [...metadata.signalColumns];
    for (let i = 0; i < metadata.sensorCount; i++) {
        console.log(allColumns)
        sensors.push({
            id: i + 1,
            signalColumns: allColumns.splice(0, 10)
        });
    }

    if (log.sensors || log.all) {
        console.log(sensors);
    }

    // Execute queries

    // logging template
    const step = async (name: string, query: string) => {
        if (log.queries || log.all) {
            console.log(`Executed ${name} query`, query);
        }
        const result = await conn.query(query);
        if (log.queries || log.all) {
            console.log(`Results of ${name} query`, result);
            console.table(toObject(result))
        }
    }

    // queries

    // create the time table
    await step('time', q.time);

    // create the traction table
    await step('traction', q.traction(sensors));

    // collate traction
    await step('traction_collated', q.traction_collated);


    let collated = toObject(await conn.query('select * from traction_collated limit 1000;'));
    console.log('collated')
    console.table(collated)

    // Close connection

    await conn.close();

    return {
        csv,
        metadata,
        sensors
    }
}

// utilities

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
    return files;
}