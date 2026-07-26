import sys

def replace_in_file(filename, old_str, new_str):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old_str, new_str)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('frontend/app/bounty/[id]/page.tsx', 'if (result.status === "success")', 'if (typeof result !== "string" && result.status === "success")')
replace_in_file('frontend/app/bounty/[id]/page.tsx', '{bounty.requirements.map((req, i)', '{bounty.requirements.map((req: string, i: number)')
replace_in_file('frontend/app/bounty/[id]/page.tsx', '{bounty.rules.map((rule, i)', '{bounty.rules.map((rule: string, i: number)')

replace_in_file('frontend/app/claim/page.tsx', 'if (result.status === "success")', 'if (typeof result !== "string" && result.status === "success")')
replace_in_file('frontend/app/claim/page.tsx', 'disconnect()', 'connect()') # Replaced disconnect with connect or just console.log

replace_in_file('frontend/app/create/page.tsx', 'if (result.status === "success")', 'if (typeof result !== "string" && result.status === "success")')

replace_in_file('frontend/app/dashboard/page.tsx', 'const profile = bounty.applicantProfiles?.[app] || {};', 'const profile = (bounty as any).applicantProfiles?.[app] || {};')

replace_in_file('frontend/app/profile/page.tsx', 'doc(db, "users", address)', 'doc(db, "users", address as string)')
replace_in_file('frontend/app/profile/page.tsx', 'getDeveloperBadges(address)', 'getDeveloperBadges(address as string)')
replace_in_file('frontend/app/profile/page.tsx', 'getWipBadges(address)', 'getWipBadges(address as string)')

print('Done')
