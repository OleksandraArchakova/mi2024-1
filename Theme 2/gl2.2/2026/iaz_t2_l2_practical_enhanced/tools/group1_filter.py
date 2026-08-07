from csv import DictReader, DictWriter
from datetime import datetime
from pathlib import Path

src = Path(__file__).resolve().parents[1] / 'data' / 'group1_internet_events.csv'
out = Path('group1_result.csv')
start = datetime.fromisoformat('2026-08-07T06:00:00+03:00')
end = datetime.fromisoformat('2026-08-07T08:00:00+03:00')
sectors = {'B-2','B-3'}

with src.open(encoding='utf-8') as f:
    rows = list(DictReader(f))

selected=[]
seen=set()
for r in rows:
    t=datetime.fromisoformat(r['event_time'])
    if not (start <= t <= end and r['sector'] in sectors):
        continue
    signature=(r['event_time'],r['sector'],r['grid_x'],r['grid_y'],r['means'],r['rounds'])
    r['duplicate_flag']='yes' if signature in seen else 'no'
    seen.add(signature)
    selected.append(r)

with out.open('w',newline='',encoding='utf-8') as f:
    w=DictWriter(f,fieldnames=list(selected[0].keys()))
    w.writeheader(); w.writerows(selected)

print(f'Selected {len(selected)} records; result: {out.resolve()}')
