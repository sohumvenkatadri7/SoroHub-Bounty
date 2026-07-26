import sys

with open('frontend/app/bounty/[id]/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

escrow_sidebar = lines[457:646]
new_lines = lines[:457] + lines[646:]

for i, line in enumerate(new_lines):
    if 'flex flex-col lg:flex-row justify-between items-start gap-8 mb-12' in line:
        new_lines[i] = line.replace('flex flex-col lg:flex-row justify-between items-start gap-8 mb-12', 'flex flex-col mb-8')
    if 'className="flex-1"' in line:
        new_lines[i] = line.replace('className="flex-1"', '')
    if '<div className="flex flex-col gap-6">' in line and i > 400:
        target_idx = i + 1
        new_lines = new_lines[:target_idx] + escrow_sidebar + new_lines[target_idx:]
        break

with open('frontend/app/bounty/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done restructuring')
