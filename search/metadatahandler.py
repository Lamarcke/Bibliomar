from grab_from_libgen.search_config import get_request_headers
from bs4 import BeautifulSoup
import requests
import re

MIRROR_SOURCES = ["GET", "Cloudflare", "IPFS.io", "Infura", "Pinata"]
librockup = True


def libcheck():
    # This function checks if libgenrocks is down. For some reason I was using threads for this, but it's better
    # to just run this every search call. It's more resource-heavy tho.
    # Making this request without a valid header will return an 503 error.
    global librockup
    try:
        test = requests.head("https://libgen.rocks/", headers=get_request_headers(), timeout=(5, 16))
        # This makes 503 raises an HTTPError Exception.
        test.raise_for_status()
        librockup = True
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
        print(err)
        print("Libgenrocks is down, too slow or can't handle the request. Using 3lib.")
        librockup = False


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
        return 401

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
    # It also scrapes for 3lib if librock is down. Must run libcheck() before this.
    # I personally believe it's better to send an empty cover than to keep the user waiting.
    # Making this request without a valid header will return an 503 error.

    global librockup
    librock = "https://libgen.rocks/ads.php?md5=" + md5
    _3lib = "https://3lib.net/md5/" + md5
    page = None

    # Tries librock, if it's down or too slow, uses 3lib instead.
    if librockup:
        try:
            page = requests.get(librock, headers=get_request_headers(), timeout=30)
        except requests.exceptions.HTTPError:
            print("Librocks is down, even if libcheck didn't say so.")
            page = requests.get(_3lib, headers=get_request_headers(), timeout=30)
            librockup = False

    else:
        page = requests.get(_3lib, headers=get_request_headers(), timeout=30)
    soup = BeautifulSoup(page.text, "html.parser")

    if librockup:
        try:
            cover = soup.find("img")
            return "https://libgen.rocks" + cover["src"]
        except KeyError:
            return None
    else:
        # if libgenrocks is down
        try:
            cover = soup.find("img", {"class": "cover"})
            # 3lib returns a very small cover on the search page, this changes the url to render the bigger one.
            cover_url = re.sub("covers100", "covers299", cover["data-src"])
        except KeyError:
            return None
        return cover_url
