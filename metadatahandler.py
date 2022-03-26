from bs4 import BeautifulSoup
import requests
import re

MIRROR_SOURCES = ["GET", "Cloudflare", "IPFS.io", "Infura", "Pinata"]
headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 '
                      'Safari/537.36',
    }
libup = True


# This very useful function is an altered excerpt from libgen-api, from harrison-broadbent.
# https://github.com/harrison-broadbent/libgen-api/blob/master/libgen_api/libgen_search.py
# Searching by MD5 is useful because even if you don't have the book's mirror, you can still see it's page
# by using the librarylol or libgenrocks + md5 url.
# The functions are separate to limit the numbers of scrapes on links.

def libcheck():
    # This function checks if libgen is down. For some reason I was using threads for this, but it's better
    # to just run this every search call. It's more resource-heavy tho.
    # Making this request without a valid header will return an 503 error.
    global libup
    try:
        test = requests.head("https://libgen.rocks/", headers=headers, timeout=(5, 24))
        # This makes 503 raises an HTTPError Exception.
        test.raise_for_status()
        libup = True
        print("Libgenrocks is fine.")
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
        print(err)
        print("Libgenrocks is down, too slow or can't handle the request. Using 3lib.")
        libup = False


def resolve_metadata(mirror1, md5):
    # Uses a librarylol link to take the download links.
    # It also scrapes the book's description.
    # Ideally, this should only be done once the users actually wants to download a book.
    # It needs to be done periodically, since librarylol will block if you abuse it.
    # 2000ms between each call is probably safe.

    page = requests.get(mirror1)
    soup = BeautifulSoup(page.text, "html.parser")
    links = soup.find_all("a", string=MIRROR_SOURCES)
    # Selects the last div, which is the description div.
    descdiv = soup.select("div:last-of-type")[1].text
    # Removes "Description:" from the book's description.
    desc = re.sub("Description:", "", descdiv)
    download_links = {link.string: link["href"] for link in links}
    # Removes the GET because it redirects to librarylol.
    download_links.pop("GET")
    return download_links, desc


def resolve_cover(md5):
    # Uses a md5 to take the cover link from Libgenrocks.
    # Librarylol uses CORS, so no scraping for covers on there.
    # If you make too many requests, libgenrocks will temporarily block you.
    # This scrapes for a single cover link, so use it with caution.
    # 1500-2000ms between each call is probably safe.
    # It also scrapes for 3lib if librock is down. Must run libcheck before this.
    # I personally believe it's better to send an empty cover than to keep the user waiting.
    # Making this request without a valid header will return an 503 error.

    global libup
    librock = "https://libgen.rocks/ads.php?md5=" + md5
    _3lib = "https://3lib.net/md5/" + md5
    page = None

    # Tries librock, if it's down or too slow, uses 3lib instead.
    if libup:
        try:
            page = requests.get(librock, headers=headers, timeout=27)
        except requests.exceptions.HTTPError:
            print("Librocks is down, even if libcheck didn't say so.")
            page = requests.get(_3lib, headers=headers, timeout=27)
            libup = False

    else:
        page = requests.get(_3lib, timeout=27)
    print(page)
    soup = BeautifulSoup(page.text, "html.parser")

    if libup:
        try:
            cover = soup.find("img")
            print(cover)
            return "https://libgen.rocks" + cover["src"]
        except KeyError:
            return None
    else:

        try:
            cover = soup.find("img", {"class": "cover"})
            # 3lib returns a very small cover on the search page, this changes the url to render the bigger one.
            cover_url = re.sub("covers100", "covers299", cover["data-src"])
            print(cover_url)
        except KeyError:
            return None
        return cover_url
