#!/usr/bin/env python3
import re
import sys

def convert_line(line):
    # Remove leading/trailing whitespace
    line = line.rstrip('\n')
    # Remove arrow symbols
    if line.strip() == '↓':
        return None
    # Check for numbered steps like "1. ", "2. " etc.
    # Also handle sub-steps like "3-1.", "3-2-1."
    # We'll keep the numbering but need to adjust indentation.
    # Instead, we'll convert to markdown list with dashes and dots.
    # We'll do this in a second pass.
    return line

def parse_scenario(text):
    lines = text.split('\n')
    output = []
    for line in lines:
        conv = convert_line(line)
        if conv is not None:
            output.append(conv)
    # Now process the output lines to convert numbering
    result = []
    for line in output:
        # Match main numbered steps: digits followed by dot and space
        m = re.match(r'^(\d+)\.\s+(.*)', line)
        if m:
            # Main step
            result.append(f"{m.group(1)}. {m.group(2)}  ")
            continue
        # Match sub-step: digit-digit etc.
        m = re.match(r'^ (\d+-\d+)\.\s+(.*)', line)
        if m:
            # First level sub-step: dash
            result.append(f"   - {m.group(2)}")
            continue
        # Match sub-sub-step: digit-digit-digit
        m = re.match(r'^ (\d+-\d+-\d+)\.\s+(.*)', line)
        if m:
            # Second level sub-step: middle dot
            result.append(f"     · {m.group(2)}")
            continue
        # If line starts with spaces but not numbered, treat as continuation?
        # For now keep as is
        result.append(line)
    return '\n'.join(result)

def main():
    with open('/tmp/scenario7.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    # Remove the header lines (first 5 lines?)
    lines = content.split('\n')
    # Find the line that starts with "1. 관리자 로그인"
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('1. 관리자 로그인'):
            start_idx = i
            break
    # Keep from start_idx to end
    scenario_lines = lines[start_idx:]
    # Join back
    scenario_text = '\n'.join(scenario_lines)
    # Parse
    converted = parse_scenario(scenario_text)
    print(converted)

if __name__ == '__main__':
    main()