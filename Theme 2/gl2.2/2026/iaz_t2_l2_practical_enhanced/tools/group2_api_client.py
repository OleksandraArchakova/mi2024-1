import json
from datetime import datetime
from pathlib import Path

src = Path(__file__).resolve().parents[1] / 'data' / 'group2_api_events.json'
data=json.loads(src.read_text(encoding='utf-8'))
start=datetime.fromisoformat('2026-08-07T06:00:00+03:00')
end=datetime.fromisoformat('2026-08-07T08:00:00+03:00')
sectors={'B-2','B-3'}
result=[]
for r in data:
    t=datetime.fromisoformat(r['event_time'])
    if start <= t <= end and r['sector'] in sectors:
        result.append(r)
print(json.dumps({'count':len(result),'results':result},ensure_ascii=False,indent=2))
