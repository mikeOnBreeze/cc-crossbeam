#!/usr/bin/env python3
"""assemble-manifest.py — Assemble page JSON fragments into binder-manifest.json

Usage: python3 assemble-manifest.py <vision-dir> <output-path>

Reads all page-NN.json files from <vision-dir>, extracts project metadata
from the cover sheet fragment (the one with a "_project" key), and assembles
into a single binder-manifest.json.

Exit codes:
  0 = success, no issues
  1 = assembled with issues (orchestrator should review)
  2 = fatal error (no fragments found, etc.)
"""

import json
import glob
import sys
import os


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 assemble-manifest.py <vision-dir> <output-path>")
        print("  Assembles page-*.json fragments into binder-manifest.json")
        sys.exit(2)

    vision_dir = sys.argv[1]
    output_path = sys.argv[2]

    # Find all page JSON fragments
    pattern = os.path.join(vision_dir, "page-*.json")
    fragment_files = sorted(glob.glob(pattern))

    if not fragment_files:
        print(f"Error: No page-*.json files found in {vision_dir}")
        sys.exit(2)

    print(f"Found {len(fragment_files)} page fragments in {vision_dir}")

    project = None
    pages = []
    errors = []

    for fpath in fragment_files:
        basename = os.path.basename(fpath)
        try:
            with open(fpath, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            errors.append(f"{basename}: JSON parse error - {e}")
            continue

        # Extract project metadata if present (cover sheet)
        if "_project" in data:
            if project is not None:
                errors.append(f"{basename}: duplicate _project (already found in another fragment)")
            project = data.pop("_project")
            print(f"  Project metadata extracted from {basename}")

        # Validate required fields
        required = ["page_number", "sheet_id", "sheet_title", "category",
                     "subcategory", "description", "key_content", "topics",
                     "drawing_zones"]
        missing = [field for field in required if field not in data]
        if missing:
            errors.append(f"{basename}: missing fields - {', '.join(missing)}")

        # Validate field types
        if "key_content" in data and not isinstance(data["key_content"], list):
            errors.append(f"{basename}: key_content should be an array")
        if "topics" in data and not isinstance(data["topics"], list):
            errors.append(f"{basename}: topics should be an array")
        if "drawing_zones" in data and not isinstance(data["drawing_zones"], list):
            errors.append(f"{basename}: drawing_zones should be an array")

        pages.append(data)

    # Sort by page number
    pages.sort(key=lambda p: p.get("page_number", 0))

    # Check for gaps in page numbering
    page_numbers = [p.get("page_number", 0) for p in pages]
    if page_numbers:
        expected = list(range(1, max(page_numbers) + 1))
        missing_pages = set(expected) - set(page_numbers)
        if missing_pages:
            errors.append(f"Missing page numbers: {sorted(missing_pages)}")

    # Warn if no project metadata found
    if project is None:
        errors.append("No _project metadata found in any fragment (expected in cover sheet)")
        project = {}

    # Build manifest
    manifest = {
        "project": project,
        "pages": pages
    }

    # Write output
    with open(output_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Cross-page consistency report
    addresses = {}
    for p in pages:
        addr = p.get("title_block_address")
        if addr:
            addresses[addr] = addresses.get(addr, 0) + 1
    if addresses:
        majority_addr = max(addresses, key=addresses.get)
        project_addr = project.get("address", "")
        print(f"\n  Address consistency ({len(addresses)} unique value(s) across {sum(addresses.values())} pages):")
        for addr, count in sorted(addresses.items(), key=lambda x: -x[1]):
            marker = " ← majority" if addr == majority_addr and len(addresses) > 1 else ""
            print(f"    \"{addr}\" × {count}{marker}")
        if len(addresses) > 1:
            errors.append(f"Address inconsistency: {len(addresses)} different addresses found across pages. "
                          f"Majority ({addresses[majority_addr]}/{sum(addresses.values())}): \"{majority_addr}\". "
                          f"Orchestrator MUST verify and use majority-vote value.")
        if project_addr and project_addr != majority_addr and addresses.get(majority_addr, 0) > 1:
            errors.append(f"Project address \"{project_addr}\" differs from majority title block address "
                          f"\"{majority_addr}\" ({addresses[majority_addr]}/{sum(addresses.values())} pages). "
                          f"Likely cover sheet hallucination — orchestrator MUST fix.")
    else:
        errors.append("No title_block_address found on any page (cannot verify address consistency)")

    # Summary
    print(f"\nAssembled manifest: {output_path}")
    print(f"  Project: {project.get('address', 'UNKNOWN')}")
    print(f"  Pages: {len(pages)}")
    print(f"  Key content items: {sum(len(p.get('key_content', [])) for p in pages)}")

    categories = {}
    for p in pages:
        cat = p.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    print(f"  Categories: {', '.join(f'{k} ({v})' for k, v in sorted(categories.items()))}")

    if errors:
        print(f"\n{len(errors)} issue(s) found:")
        for e in errors:
            print(f"  - {e}")
        print("\nOrchestrator should review binder-manifest.json and fix issues.")
        sys.exit(1)
    else:
        print("\n  No issues found.")


if __name__ == "__main__":
    main()
