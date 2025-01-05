import { Hono } from 'hono';

interface Env {
	DB: D1Database;
  }

const app = new Hono<{ Bindings: Env }>();

app.get('/stations', async (c) => {
  try {
    const db = c.env.DB as D1Database;

    const query = `
      SELECT
        s.id AS stationId,
        s.stationName,
        s.reading,
        s.lineName,
        s.location,
        GROUP_CONCAT(wr.wrongReading) AS wrongReadings
      FROM 
        stations s
      LEFT JOIN 
        wrong_readings wr ON s.id = wr.stationId
      GROUP BY 
        s.id;
    `;

    const { results } = await db.prepare(query).all();

    // wrongReadings を配列に変換
    const formattedResults = results.map((row) => ({
      ...row,
      wrongReadings: (row.wrongReadings as string) ? (row.wrongReadings as string).split(',') : [],
    }));

    return c.json(formattedResults);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return c.json({ error: 'Failed to fetch stations' }, 500);
  }
});

// Hono アプリを fetch メソッドとしてエクスポート
export default {
  fetch: app.fetch,
};
