from csv import DictReader
from datetime import datetime
from pathlib import Path

src = Path(__file__).resolve().parents[1] / 'data' / 'group3_formal_reports.csv'
allowed_sectors={'B-2','B-3'}
allowed_means={'artillery','mortar','rocket'}

def validate(r):
    e=[]
    try: datetime.fromisoformat(r['event_time'])
    except ValueError: e.append('event_time: expected ISO-8601')
    if r['sector'] not in allowed_sectors: e.append('sector: missing or not allowed')
    try:
        x=int(r['grid_x']); y=int(r['grid_y'])
        if not (0 <= x <= 99 and 0 <= y <= 99): e.append('grid: expected 0..99')
    except ValueError: e.append('grid: expected integers')
    if r['means'] not in allowed_means: e.append('means: not allowed')
    try:
        rounds=int(r['rounds'])
        if rounds < 0: e.append('rounds: negative')
    except ValueError: e.append('rounds: expected integer')
    return e

with src.open(encoding='utf-8') as f:
    rows=list(DictReader(f))
for r in rows:
    errors=validate(r)
    print(r['report_id'], 'OK' if not errors else ' | '.join(errors))
