import { defineConfig, loadEnv } from 'vite';

function buildTagoUrl(query, serviceKey) {
  const baseUrl = 'https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo';
  const params = new URLSearchParams({
    pageNo: query.get('pageNo') || '1',
    numOfRows: query.get('numOfRows') || '40',
    _type: 'json',
    depPlaceId: query.get('depPlaceId') || 'NAT010000',
    arrPlaceId: query.get('arrPlaceId') || 'NAT014445',
    depPlandTime: query.get('depPlandTime') || '',
  });
  const safeKey = serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey);
  return `${baseUrl}?serviceKey=${safeKey}&${params.toString()}`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [{
      name: 'tago-train-api',
      configureServer(server) {
        server.middlewares.use('/api/train-timetable', async (req, res) => {
          try {
            const serviceKey = env.TAGO_SERVICE_KEY || env.VITE_TAGO_SERVICE_KEY;
            if (!serviceKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ ok: false, message: 'TAGO_SERVICE_KEY가 .env에 없습니다.' }));
              return;
            }

            const requestUrl = new URL(req.url || '', 'http://localhost');
            const tagoUrl = buildTagoUrl(requestUrl.searchParams, serviceKey);
            const response = await fetch(tagoUrl, {
              headers: {
                Accept: 'application/json, text/plain, */*',
                'User-Agent': 'MAK-Link-Train-Timetable/1.0',
              },
            });
            const body = await response.text();

            res.statusCode = response.ok ? 200 : response.status;
            res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json; charset=utf-8');

            if (!response.ok) {
              res.end(JSON.stringify({ ok: false, status: response.status, body: body.slice(0, 500) }));
              return;
            }

            res.end(body);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, message: error.message }));
          }
        });
      },
    }],
  };
});
