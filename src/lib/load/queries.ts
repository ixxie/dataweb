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

const correct = (sensor: Sensor) => /*sql*/`
        select
            '${sensor.id}' as sensor,
            epoch(s.column01)*1000 as epoch,
            s.frame as frame,
            t.diff as diff,
            epoch(s.column01) - epoch(t.firstval) + s.frame*t.diff/10 :: float as t,
            s.signal as signal
        from sensor${sensor.id} s
        join time t on s.column01 = t.current
`

const corrected = (sensors: Sensor[]) => sensors.map(correct).join(`    union by name`);

const traction = (sensors: Sensor[]) => /*sql*/`
    create or replace table traction as (    
        with ${unpivoted(sensors).join(',')} ${corrected(sensors)}
    );
    insert into traction
            select
                'total' as sensor,
                any_value(epoch),
                any_value(frame),
                any_value(diff),
                t,
                sum(signal) as signal
            from traction
            group by t;
`;

const total = /*sql*/`
    insert into traction
            select
                'total' as sensor,
                epoch,
                frame,
                diff,
                t,
                sum(signal) as signal
            from traction
            group by t;
`


const fromJoined = (sensors: Sensor[]) => /*sql*/`
    from sensor${sensors[0].id} s
    ${sensors
        .splice(1)
        .map((sensor) => `join sensor${sensor.id} s${sensor.id} on s.column01 = s${sensor.id}.column01`)
        .join(`
        `)
    }
`;

const oldtotal = (sensors: Sensor[]) => /*sql*/`
        select
            'total' as sensor,
            epoch(s.column01)*1000 as epoch,
            s.frame as frame,
            t.diff as diff,
            epoch(s.column01) - epoch(t.firstval) + s.frame*t.diff/10 as t,
            sum(s.signal) as signal
        ${fromJoined(sensors)}
        join time t on s.column01 = t.current
        group by s.column01, s.frame, t.diff
`

export const queries = {
    time,
    traction,
    total
}