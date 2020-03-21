import argparse
import json
import random
import sys
import time
from pathlib import Path

SLEEP = 1

def check_leafness(all_titles, json_file):

    changes = 0
    with open(json_file) as f:
        suspects = json.load(f)

    for suspect in suspects:

        uri = f"/{suspect['locale']}/docs/{suspect['slug']}"
        if uri not in all_titles:
            print("HOPELESS!", uri)
            continue

        leaf = True
        for key in all_titles.keys():
            if key.startswith(uri) and key != uri:
                leaf = False

        if suspect['leaf'] != leaf:
            print(suspect['leaf'], leaf, suspect['locale'], suspect['slug'])
            suspect['leaf'] = leaf
            changes += 1

    if changes:
        with open(json_file, 'w') as f:
            json.dump(suspects, f, indent=2)



def run(all_titles_file, locales=None):
    with open(all_titles_file) as f:
        all_titles = json.load(f)
    folder = Path('public/suspects')
    folders = []

    for fn in folder.iterdir():
        if fn.name == 'summary.json' or fn.name == 'inception.json':
            continue

        if locales:
            if fn.name.split('.json')[0] not in locales:
                continue
        else:
            folders.append(fn)

    if not folders:
        raise ValueError('No folders to loop over!')

    random.shuffle(folders)
    for folder in folders:
        print("FOLDER:", folder.name)
        check_leafness(all_titles, folder)


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "all_titles_file", help="e.g. /path/to/yari/content/_all_titles.json",
    )
    parser.add_argument(
        "locales",
        help="specific locales",
        nargs="*",
    )
    return parser


def main():
    parser = get_parser()
    args = parser.parse_args()
    run(Path(args.all_titles_file), locales=args.locales)

if __name__ == "__main__":
    sys.exit(main())
