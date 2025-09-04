// pages/api/events.ts - Fixed Version with Event Distribution
import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { country } = req.query;
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT),
  });

  try {
    await client.connect();

    if (country) {
      // First, let's check what raw event types exist
      const rawEventTypes = await client.query(`
        SELECT 
          event_type,
          COUNT(*) as count
        FROM dtf_events
        WHERE LEFT("gsim.no", 2) = $1
          AND dstart ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$'
        GROUP BY event_type
        ORDER BY count DESC;
      `, [country]);

      console.log(`=== RAW EVENT TYPES FOR COUNTRY ${country} ===`);
      console.log(rawEventTypes.rows);

      // Query for specific country's data with ALL events per month
      const result = await client.query(`
        WITH valid_events AS (
          SELECT 
            LEFT("gsim.no", 2) as country_code,
            event_type,
            TO_TIMESTAMP(dstart, 'MM/DD/YYYY') as event_date,
            severity_count,
            geom
          FROM dtf_events
          WHERE LEFT("gsim.no", 2) = $1
            AND dstart ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$'
        ),
        mapped_events AS (
          SELECT
            country_code,
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
            AVG(severity_count) as avg_severity,
            MIN(severity_count) as min_severity,
            MAX(severity_count) as max_severity,
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
      `, [country]);

      // Log the results for debugging
      console.log(`=== DISTRIBUTED EVENTS FOR COUNTRY ${country} ===`);
      console.log(`Total records returned: ${result.rows.length}`);
      
      // Group by month to show distribution
      const monthlyDistribution = result.rows.reduce((acc, row) => {
        const key = `${row.year}-${row.month}`;
        if (!acc[key]) {
          acc[key] = {
            year: row.year,
            month: row.month,
            total_events: row.total_events_in_month,
            events: []
          };
        }
        acc[key].events.push({
          event_type: row.event_type,
          original_type: row.original_type,
          count: row.event_count,
          percentage: row.percentage,
          severity: row.severity
        });
        return acc;
      }, {} as Record<string, any>);
      
      console.log('Sample monthly distributions:');
      Object.entries(monthlyDistribution).slice(0, 5).forEach(([key, data]) => {
        console.log(`${key}:`, data);
      });

      res.status(200).json(result.rows);
    } else {
      // Query for country aggregates (one per country)
      const result = await client.query(`
        SELECT 
          LEFT("gsim.no", 2) as country_code,
          COUNT(DISTINCT EXTRACT(YEAR FROM TO_TIMESTAMP(dstart, 'MM/DD/YYYY'))) as year_count,
          MIN(EXTRACT(YEAR FROM TO_TIMESTAMP(dstart, 'MM/DD/YYYY')))::integer as first_year,
          MAX(EXTRACT(YEAR FROM TO_TIMESTAMP(dstart, 'MM/DD/YYYY')))::integer as last_year,
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom)))::json as centroid
        FROM dtf_events
        WHERE dstart ~ '^\\d{1,2}/\\d{1,2}/\\d{4}$'
        GROUP BY country_code;
      `);

      res.status(200).json(result.rows);
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: error.message,
      hint: error.hint
    });
  } finally {
    await client.end();
  }
}