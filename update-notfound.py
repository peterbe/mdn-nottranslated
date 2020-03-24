import argparse
import json
import random
import sys
import time
from pathlib import Path
from collections import defaultdict

import requests

SLEEP = 1

def check_locale(json_file, limit=40, slugs=None):
    state_file = f'/tmp/update-notfound.{json_file.name}.log'

    previous_slugs_done = []
    try:
        with open(state_file) as f:
            for line in f:
                previous_slugs_done.append(line.strip())
    except FileNotFoundError:
        pass

    changes = 0
    with open(json_file) as f:
        suspects = json.load(f)

    subset = []
    for suspect in suspects:
        if suspect['slug'] in previous_slugs_done:
            continue
        if slugs and suspect['slug'] not in slugs:
            continue
        subset.append(suspect)

    print(f"{len(subset)} suspects")
    random.shuffle(subset)

    delete = []
    checked = {}

    subset.sort(key=lambda x: x.get('_checked', 0))

    done_slugs = []
    for suspect in subset[:limit]:
        if suspect['leaf']:
            # print("CHECKED?", suspect.get('_checked'))
            if suspect.get('_checked'):
                how_long_ago = int(time.time()) - suspect['_checked']
                one_day = 60 * 60 * 1
                if how_long_ago < one_day:
                    print(f"checked {suspect['locale']}/{suspect['slug']} too recently ({how_long_ago/ 60:.1f}min)")
                    continue
            locale = suspect['locale']
            slug = suspect['slug']
            wiki_url = f'https://wiki.developer.mozilla.org/{locale}/docs/{slug}'
            r = requests.head(wiki_url)
            print(r.status_code, wiki_url, suspect['leaf'])
            if r.status_code == 404:
                delete.append(suspect['slug'])
            else:
                checked[suspect['slug']] = int(time.time())
            time.sleep(SLEEP)
            done_slugs.append(suspect['slug'])

    changes = len(delete)
    suspects = [x for x in suspects if x['slug'] not in delete]
    for s in suspects:
        if s['slug'] in checked:
            s['_checked'] = checked[s['slug']]
            changes += 1

    if changes:
        with open(json_file, 'w') as f:
            json.dump(suspects, f, indent=2)

    with open(state_file, 'w') as f:
        for slug in done_slugs:
            f.write(f'{slug}\n')


def run(locales=None, limit=10, logfile=None):
    only = None
    if logfile:
        only = defaultdict(list)
        with open(logfile) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                locale, slug= line.split('\t')[:2]
                only[locale].append(slug)

    folder = Path('public/suspects')
    folders = []

    previous_folder_names = []
    state_file = '/tmp/update-notfound.log'
    if not logfile:
        try:
            with open(state_file) as f:
                for line in f:
                    previous_folder_names.append(line.strip())
        except FileNotFoundError:
            pass

    for fn in folder.iterdir():
        if fn.name == 'summary.json' or fn.name == 'inception.json':
            continue

        if locales:
            if fn.name.split('.json')[0] not in locales:
                continue
        elif only:
            if fn.name.split('.json')[0] not in only:
                continue
        else:
            if fn.name in previous_folder_names:
                print("We did", fn.name, "last time")
                continue
        folders.append(fn)

    if not folders:
        raise ValueError('No folders to loop over!')

    random.shuffle(folders)
    done_folder_names = []
    for folder in folders[:limit]:
        print("FOLDER:", folder.name)
        slugs = None
        if only:
            slugs = only[folder.name.split('.json')[0]]
        check_locale(folder, slugs=slugs)
        done_folder_names.append(folder.name)

    if not locales and not logfile:
        with open(state_file, 'w') as f:
            for foldername in done_folder_names:
                f.write(f'{foldername}\n')


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "locales",
        help="specific locales",
        nargs="*",
    )
    parser.add_argument(
        "--limit",
        help="number of random locales",
        type=int,
        default=10,
    )
    parser.add_argument(
        "--logfile",
        help="logfile full of deletion logs",
    )
    return parser


def main():
    parser = get_parser()
    args = parser.parse_args()
    run(locales=args.locales, limit=args.limit, logfile=args.logfile)

if __name__ == "__main__":
    sys.exit(main())
