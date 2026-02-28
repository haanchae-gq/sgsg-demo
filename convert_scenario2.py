#!/usr/bin/env python3
import re
import sys

def get_level(line):
    """Return indentation level (number of leading spaces) and stripped line."""
    stripped = line.lstrip(' ')
    indent = len(line) - len(stripped)
    return indent, stripped

def convert_scenario(content):
    lines = content.split('\n')
    output = []
    # State
    for line in lines:
        if line.strip() == '↓':
            continue
        indent, stripped = get_level(line)
        # Determine if numbered step
        # Pattern: digit dot, digit-digit dot, digit-digit-digit dot
        m = re.match(r'^(\d+(?:-\d+)*)\.\s*(.*)', stripped)
        if m:
            # Count hyphens to determine level
            num_hyphens = m.group(1).count('-')
            if num_hyphens == 0:
                # Main step
                output.append(('  ' * indent) + f"{m.group(1)}. {m.group(2)}  ")
            elif num_hyphens == 1:
                # First sub-step
                output.append(('  ' * indent) + f"- {m.group(2)}")
            elif num_hyphens == 2:
                # Second sub-step
                output.append(('  ' * indent) + f"  · {m.group(2)}")
            else:
                # Fallback
                output.append(('  ' * indent) + f"{m.group(1)}. {m.group(2)}")
        elif stripped.startswith('- '):
            # Dash line (third level)
            # Indent relative to parent? We'll assume same indent as previous line plus 2
            output.append(('  ' * indent) + f"    - {stripped[2:]}")
        else:
            # Regular text, keep as is
            if stripped:
                output.append(('  ' * indent) + stripped)
            else:
                output.append('')
    return '\n'.join(output)

def main():
    with open('/tmp/scenario7.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    # Find start of steps
    lines = content.split('\n')
    start = 0
    for i, line in enumerate(lines):
        if line.startswith('1. 관리자 로그인'):
            start = i
            break
    scenario = '\n'.join(lines[start:])
    converted = convert_scenario(scenario)
    print(converted)

if __name__ == '__main__':
    main()