from grab_from_libgen import LibgenSearch
import re


def search_handler(rq):
    query = rq["query"]
    format_ = rq["format"]
    searchby = rq["searchby"]
    searchcat = rq["searchcat"]
    searchlang = rq["searchlang"]
    search_result = libsearch(query, format_, searchby, searchcat, searchlang)
    return search_result


# LibgenSearch has some filtering for fiction results, but not for non-fiction.
# This is a limitation on Libgen's end.


def nonfiction_filter(lbr, format_, searchcat, searchlang):
    results = []
    for value in lbr.values():

        lang = value["language"].lower()
        # verify if it's queried language
        if lang == searchlang:

            if format_ == "any":
                # If format is "any", adds to results without checking for format.

                md5 = re.sub('[\\Wa-z]', "", value["mirror1"])
                value["category"] = searchcat
                value["md5"] = md5
                results.append(value)
                # "continues" this loop without running the rest of the code
                continue

            # if format is not "any" code.
            # verify extension regex, else return None
            vex = re.search(f"{format_}", value["extension"], re.IGNORECASE)

            # Adds if extension regex returns true
            if vex is not None:
                # The md5 code is uppercase and has numbers, so it's better to remove the rest of the link from the
                # string.
                md5 = re.sub('[\\Wa-z]', "", value["mirror1"])
                value["category"] = searchcat
                value["md5"] = md5

                results.append(value)
        else:
            # If the value's language is not the queried one.
            pass

    if results:
        return results
    else:
        return None


def fiction_filter(lbr, searchcat):
    # This "filter" just adds some extra info to fiction results.
    results = []
    for value in lbr.values():
        # The md5 code is uppercase and has numbers, so it's better to remove the rest of the link from the
        # string.
        md5 = re.sub('[\\Wa-z]', "", value["mirror1"])
        value["category"] = searchcat
        value["md5"] = md5
        results.append(value)

    if results:
        return results
    else:
        return None


def libsearch(query: str, format_: str, searchby: str, searchcat: str, searchlang: str):
    query = query.strip()
    # searchby is always either "title" or "author".
    # searchcat is always either "fiction" or "sci-tech".

    lang = searchlang.capitalize()

    # grab-from-libgen uses different names for the "sort" function, depending on topic.
    # the fiction search has no "res" parameter.

    if searchcat == "fiction":
        # Fiction search uses "authors" as criteria for author search.
        if searchby == "author":
            searchby = "authors"
        if format_ == "any":
            format_ = ""
        params = {
            "q": query,
            "language": lang,
            "format": format_,
            "criteria": searchby
        }
    else:
        # if searchcat == "sci-tech"
        # "res" stands for results per page.
        # "res" only works on the newer version of grab-from-libgen.
        # Page is going to be used if the filtered results returns none.
        # Page must be a string.
        params = {
            "q": query,
            "language": lang,
            "column": searchby,
            "res": "100"
        }

    try:
        lbs = LibgenSearch(searchcat, **params)
    except IndexError:
        return 400

    # Libgen results, returns an OrderedDict:
    try:
        lbr = lbs.get_results()
        if len(lbr) == 0:
            return 400

    except IndexError:
        return 400

    # Returns filtered results
    if searchcat == "fiction":
        filtered_results = fiction_filter(lbr, searchcat)
        return filtered_results
    else:
        filtered_results = nonfiction_filter(lbr, format_, searchcat, searchlang)
        return filtered_results
