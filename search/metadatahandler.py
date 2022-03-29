from grab_from_libgen.search_config import get_request_headers
from bs4 import BeautifulSoup
import requests
import re

MIRROR_SOURCES = ["GET", "Cloudflare", "IPFS.io", "Infura", "Pinata"]
_3libup = True


# These very useful function are an altered excerpt from libgen-api, from harrison-broadbent.
# https://github.com/harrison-broadbent/libgen-api/blob/master/libgen_api/libgen_search.py
# Searching by MD5 is useful because even if you don't have the book's mirror, you can still see it's page
# by using the librarylol or libgenrocks + md5 url.
# The functions are separate to limit the numbers of scrapes on links.

def resolve_metadata(mirror1):
    # Uses a librarylol link to take the download links.
    # It also scrapes the book's description.
    # Ideally, this should only be done once the users actually wants to download a book.
    # It needs to be done periodically, since librarylol will block if you abuse it.
    # 2000ms between each call is probably safe.
    try:
        page = requests.get(mirror1, headers=get_request_headers(), timeout=60)
        page.raise_for_status()
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
        print("Error in Librarylol: ", err)
        return 501

    soup = BeautifulSoup(page.text, "html.parser")
    links = soup.find_all("a", string=MIRROR_SOURCES)
    # Selects the last div, which is the description div.
    descdiv = soup.select("div:last-of-type")[1].text
    # Removes "Description:" from the book's description.
    desc = re.sub("Description:", "", descdiv)
    download_links = {link.string: link["href"] for link in links}
    # Removes the GET because it redirects to librarylol.
    try:
        download_links.pop("GET")
    except AttributeError:
        pass

    if download_links is None:
        return 401
    return download_links, desc


def libcheck():
    # This function checks if libgenrocks is down. For some reason I was using threads for this, but it's better
    # to just run this every search call. It's more resource-heavy tho.
    # Making this request without a valid header will return an 503 error.
    global _3libup
    try:
        test = requests.head("https://3lib.net/", headers=get_request_headers(), timeout=(6, 12))
        # This makes 503 raises an HTTPError Exception.
        test.raise_for_status()
        _3libup = True
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
        print(err)
        print("3lib is down, too slow or can't handle the request. Using libgenrocks.")
        _3libup = False


def resolve_cover(md5):
    # Uses a md5 to take the cover link from 3lib.
    # Librarylol uses CORS, so no scraping for covers on there.
    # If you make too many requests, 3lib will temporarily block you.
    # And so will libgenrocks.
    # They also don't like when you load too many images at the same time. (e.g. using a cache)
    # This scrapes for a single cover link, so use it with caution.
    # 1500-2000ms between each call is probably safe.
    # It also scrapes for 3lib if librock is down. Must run libcheck() before this.
    # I personally believe it's better to send an empty cover than to keep the user waiting.
    # Making this request without a valid header will return an 503 error.

    global _3libup
    librock = "https://libgen.rocks/ads.php?md5=" + md5
    _3lib = "https://3lib.net/md5/" + md5
    page = None

    # Tries 3lib, if it's down or too slow, uses libgenrocks instead.
    if _3libup:
        try:
            page = requests.get(_3lib, headers=get_request_headers(), timeout=20)
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
            print("3lib is down... error is ", err)
            page = requests.get(librock, headers=get_request_headers(), timeout=30)
            _3libup = False

    else:
        page = requests.get(librock, headers=get_request_headers(), timeout=30)

    soup = BeautifulSoup(page.text, "html.parser")
    elapsed_time = int(page.elapsed.total_seconds())
    if _3libup:
        # if 3lib is up
        cover = soup.find("img", {"class": "cover"})
        try:
            # 3lib returns a very small cover on the search page, this changes the url to render the bigger one.
            cover_url = re.sub("covers100", "covers299", cover["data-src"])
        except KeyError:
            try:
                cover_url = re.sub("covers100", "covers200", cover["data-src"])
            except KeyError:
                return None

        if cover_url == "/img/cover-not-exists.png":
            return None
    else:
        # if 3lib is down
        try:
            cover = soup.find("img")
            cover_url = "https://libgen.rocks" + cover["src"]
        except KeyError:
            return None

    results = {
        "cover": cover_url,
        "elapsed_time": elapsed_time
    }
    return results
