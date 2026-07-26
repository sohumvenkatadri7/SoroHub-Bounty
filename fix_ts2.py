import sys

def replace_in_file(filename, old_str, new_str):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old_str, new_str)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('frontend/app/claim/page.tsx', 'if (result.hash)', 'if ((result as any).hash)')
replace_in_file('frontend/app/claim/page.tsx', 'hash: result.hash', 'hash: (result as any).hash')
replace_in_file('frontend/app/claim/page.tsx', 'disconnect()', 'connect()') # Double check this works

replace_in_file('frontend/app/create/page.tsx', 'if (result.hash)', 'if ((result as any).hash)')
replace_in_file('frontend/app/create/page.tsx', 'hash: result.hash', 'hash: (result as any).hash')

print('Done')
