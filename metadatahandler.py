from bs4 import BeautifulSoup
import requests
import re

MIRROR_SOURCES = ["GET", "Cloudflare", "IPFS.io", "Infura", "Pinata"]
libup = True


# This very useful function is an altered excerpt from libgen-api, from harrison-broadbent.
# https://github.com/harrison-broadbent/libgen-api/blob/master/libgen_api/libgen_search.py
# Searching by MD5 is useful because even if you don't have the book's mirror, you can still see it's page
# by using the librarylol or libgenrocks + md5 url.
# The functions are separate to limit the numbers of scrapes on links.

def libcheck():
    # This function runs on a separate thread to check if librocks is down or slow
    # every x minutes, if it's down, the site should use 3lib instead.
    # Otherwise, every cover request would check if librocks is up, thus slowing down the books loading.
    # There's probably a better way to do this.
    global libup
    try:
        requests.head("https://libgen.rocks/", timeout=27)
        libup = True
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
    # Uses libgenrock's get for backup, since sometimes all servers on Liblol are down.
    download_links["GET"] = "https://libgen.rocks/get.php?md5=" + md5
    return download_links, desc


def resolve_cover(md5):
    # Uses a md5 to take the cover link from Libgenrocks.
    # Librarylol uses CORS, so no scraping for covers on there.
    # If you make too many requests, libgenrocks will temporarily block you.
    # This scrapes for a single cover link, so use it with caution.
    # 1500-2000ms between each call is probably safe.
    # It also scrapes for 3lib if librock is down.
    # I personally believe it's better to send an empty cover than to keep the user waiting.
    # Since I'm using heroku's free tier as a hosting solution, the timeout needs a lot of headroom

    global libup
    librock = "https://libgen.rocks/ads.php?md5=" + md5
    _3lib = "https://3lib.net/md5/" + md5
    page = None

    # Tries librock, if it's down or too slow, uses 3lib instead.
    if libup:
        try:
            page = requests.get(librock, timeout=27)

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.HTTPError) as err:
            print(err)
            libup = False
            page = requests.get(_3lib, timeout=27)
    else:

        page = requests.get(_3lib, timeout=27)

    soup = BeautifulSoup(page.text, "html.parser")
    if libup:
        try:
            cover = soup.find("img", src=True)
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
