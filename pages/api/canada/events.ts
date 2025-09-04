// pages/api/canada/events.ts - CORRECTED VERSION
import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { province } = req.query;
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT),
  });

  try {
    await client.connect();

    if (province) {
      // Query for specific province's detailed events
      const result = await client.query(`
        WITH valid_events AS (
          SELECT 
            province_code,
            event_type,
            TO_DATE(dstart, 'MM/DD/YYYY') as event_date,
            severity_count,
            geom
          FROM canada_province_events
          WHERE province_code = $1
            AND dstart IS NOT NULL
            AND dstart ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$'
        ),
        mapped_events AS (
          SELECT
            province_code,
            EXTRACT(YEAR FROM event_date)::integer as year,
            EXTRACT(MONTH FROM event_date)::integer as month,
            event_date,
            severity_count,
            geom,
            event_type as original_type,
            CASE 
              WHEN event_type = 'D' THEN 'Drought'
              WHEN event_type = 'F' THEN 'Flood'
              WHEN event_type = 'DtoF' THEN 'DtoF'
              WHEN event_type = 'D&F' THEN 'DroughtFlood'
              ELSE event_type
            END as mapped_event_type
          FROM valid_events
        ),
        event_distribution AS (
          SELECT
            year,
            month,
            mapped_event_type,
            original_type,
            COUNT(*) as event_count,
            AVG(severity_count::integer) as avg_severity,
            MIN(severity_count::integer) as min_severity,
            MAX(severity_count::integer) as max_severity,
            ST_AsGeoJSON(ST_Centroid(ST_Collect(geom)))::json as centroid
          FROM mapped_events
          GROUP BY year, month, mapped_event_type, original_type
        ),
        monthly_totals AS (
          SELECT
            year,
            month,
            SUM(event_count) as total_events_in_month
          FROM event_distribution
          GROUP BY year, month
        )
        SELECT
          ed.year,
          ed.month,
          ed.mapped_event_type as event_type,
          ed.original_type,
          ed.event_count,
          ed.avg_severity as severity,
          ed.min_severity,
          ed.max_severity,
          ed.centroid,
          mt.total_events_in_month,
          ROUND((ed.event_count::decimal / mt.total_events_in_month * 100), 1) as percentage
        FROM event_distribution ed
        JOIN monthly_totals mt ON ed.year = mt.year AND ed.month = mt.month
        ORDER BY ed.year, ed.month, ed.event_count DESC;
      `, [province]);

      res.status(200).json(result.rows);
    } else {
      // Query for province aggregates (one per province) - FIXED
      const result = await client.query(`
        WITH valid_events AS (
          SELECT 
            province_code,
            TO_DATE(dstart, 'MM/DD/YYYY') as event_date,
            event_type,
            severity_count::integer as severity_count,
            geom
          FROM canada_province_events
          WHERE dstart IS NOT NULL
            AND dstart ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$'
        )
        SELECT 
          province_code,
          COUNT(DISTINCT EXTRACT(YEAR FROM event_date)) as year_count,
          MIN(EXTRACT(YEAR FROM event_date))::integer as first_year,
          MAX(EXTRACT(YEAR FROM event_date))::integer as last_year,
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom)))::json as centroid,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'D' THEN 1 END) as drought_events,
          COUNT(CASE WHEN event_type = 'F' THEN 1 END) as flood_events,
          COUNT(CASE WHEN event_type = 'DtoF' THEN 1 END) as dtof_events,
          COUNT(CASE WHEN event_type = 'D&F' THEN 1 END) as drought_flood_events,
          AVG(severity_count) as avg_severity
        FROM valid_events
        GROUP BY province_code;
      `);

      res.status(200).json(result.rows);
    }
  } catch (error: any) {
    console.error('Canada API error:', error);
    res.status(500).json({ 
      error: error.message,
      hint: error.hint
    });
  } finally {
    await client.end();
  }
}