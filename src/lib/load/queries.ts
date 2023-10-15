import type { Sensor } from "$lib/types";

// time basis
const time = /*sql*/`
    create table time as
        select
            column01 as current,
            first_value(column01) over (order by current) as firstval,
            lead(column01, 1) over (order by current)  as nextup,
            epoch(nextup) - epoch(current) as diff
        from input.csv
        order by column01;
`;

const unpivot = (cols: string[], id: string | number = '') => /*sql*/`                
            unpivoted${id} as (
                unpivot 'input.csv'
                on ${cols.join(', ')}
                into
                    name column_id
                    value signal
            ),
            sensor${id} as (
                select
                    *,
                    cast(substring(u.column_id, 7) as int) - 2 as frame
                from unpivoted${id} u
            )`;

const unpivoted = (sensors: Sensor[]): string[] =>
    sensors.map((sensor) => unpivot(sensor.signalColumns, sensor.id));

const timeCorrection = (sensor: Sensor) => /*sql*/`
        select
            '${sensor.id}' as sensor,
            s.column00 as id,
            s.column01 as timestamp,
            epoch(s.column01)*1000 as epoch,
            s.frame as frame,
            t.diff as diff,
            epoch(s.column01) - epoch(t.firstval) + s.frame*t.diff/10 :: float as t,
            s.signal as signal
        from sensor${sensor.id} s
        join time t on s.column01 = t.current
`

const selectUnion = (sensors: Sensor[], mapping: (sensor: Sensor) => any) =>
    sensors.map(mapping).join(`    union by name`);

const traction = (sensors: Sensor[]) => /*sql*/`
    create or replace table traction as (    
        with
            ${unpivoted(sensors).join(',')}
        ${selectUnion(sensors, timeCorrection)}
    );
    insert into traction
            select
                'total' as sensor,
                id,
                any_value(timestamp),
                any_value(epoch),
                any_value(frame),
                any_value(diff),
                t,
                sum(signal) as signal
            from traction
            group by t, id;
`;

const traction_collated = /*sql*/`
    create or replace table traction_collated as (
        pivot traction on sensor using sum(signal);
    )
`

export const queries = {
    time,
    traction,
    traction_collated
}