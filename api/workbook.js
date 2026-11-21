import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';

const MAX_BYTES = 3 * 1024 * 1024;
function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET','PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({error:'Method not allowed'});
  }
  if (!process.env.DATABASE_URL || !process.env.APP_PASSWORD) {
    return res.status(503).json({error:'Server environment is not configured'});
  }
  if (req.method === 'PUT') {
    if (!/^\d{4}$/.test(process.env.APP_PASSWORD)) {
      return res.status(503).json({error:'APP_PASSWORD must be exactly four digits'});
    }
    if (!sameSecret(req.headers['x-app-password'], process.env.APP_PASSWORD)) {
      return res.status(401).json({error:'Unauthorized'});
    }
  }
  try {
    const sql=neon(process.env.DATABASE_URL);
    if(req.method==='GET'){
      const rows=await sql`SELECT data, version, updated_at FROM workbooks WHERE id = 'primary'`;
      if(!rows.length) return res.status(404).json({error:'DB에 저장된 계산표가 없습니다. 먼저 DB 저장을 실행하세요.'});
      return res.status(200).json({workbook:rows[0].data,version:rows[0].version,updatedAt:rows[0].updated_at});
    }
    if(Number(req.headers['content-length']||0)>MAX_BYTES) return res.status(413).json({error:'Workbook exceeds 3MB limit'});
    const payload=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const data=payload?.workbook;
    const version=payload?.version;
    if(!data || !Array.isArray(data.sheets) || !data.sheets.length || !Number.isInteger(data.activeSheetIndex) || data.activeSheetIndex<0 || data.activeSheetIndex>=data.sheets.length) {
      return res.status(400).json({error:'Invalid workbook'});
    }
    const json=JSON.stringify(data);
    if(Buffer.byteLength(json,'utf8')>MAX_BYTES) return res.status(413).json({error:'Workbook exceeds 3MB limit'});
    if(version!==null && (!Number.isSafeInteger(version) || version<1)) return res.status(400).json({error:'Invalid version'});
    const rows=await sql`
      INSERT INTO workbooks (id, data, version, updated_at)
      VALUES ('primary', ${json}::jsonb, 1, now())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, version = workbooks.version + 1, updated_at = now()
      WHERE workbooks.version = ${version}
      RETURNING version, updated_at
    `;
    if(!rows.length) return res.status(409).json({error:'Workbook version conflict. Load current database data before saving.'});
    return res.status(200).json({ok:true,version:rows[0].version,updatedAt:rows[0].updated_at});
  } catch(err){
    console.error('workbook API error:',err);
    if(err instanceof SyntaxError) return res.status(400).json({error:'Invalid JSON'});
    return res.status(500).json({error:'Database operation failed'});
  }
}
