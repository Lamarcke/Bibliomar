import werkzeug.exceptions
from flask import Flask, render_template, request, make_response, abort, session
from search.metadatahandler import resolve_cover, resolve_metadata, libcheck
from search.search import search_handler
from os import urandom
import json

app = Flask(__name__)
app.secret_key = urandom(32)


@app.errorhandler(werkzeug.exceptions.InternalServerError)
def internal_error(e):
    print(e)
    return render_template("500.html"), 500


@app.errorhandler(werkzeug.exceptions.BadGateway)
def internal_error(e):
    print(e)
    return render_template("500.html"), 502


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/cover/<md5>')
def cover(md5):
    try:
        cover_result = resolve_cover(md5)
        if cover_result is None:
            cover_result = {
                "cover": "https://libgen.rocks/img/blank.png",
                "elapsed_time": 5
            }
            return make_response(cover_result)

        cover_json = json.dumps(cover_result)
        response = make_response(cover_json)
        return response

    except TypeError:
        cover_result = {
            "cover": "https://libgen.rocks/img/blank.png",
            "elapsed_time": 5
        }
        return cover_result


@app.route('/search', methods=["GET", "POST"])
def search():
    # Checks if libgenrocks is down.
    libcheck()
    # Clear the session to avoid bugs.
    session.clear()
    list_ = search_handler(request.get_json())

    if list_ == 400 or None:
        return abort(400)

    list_json = json.dumps(list_)
    response = make_response(list_json)
    response.headers["Content-type"] = "application/json"
    return response


@app.route('/book/', methods=["GET", "POST"])
def book():
    if request.method == "POST":
        request_data = request.get_json()
        request_data["extension"] = request_data["extension"].upper()
        session["book_info"] = request_data
        # Scrapes download links and book's description.
        metadata = resolve_metadata(request_data["mirror1"])

        if metadata == 501:
            return abort(501)

        session["book_dlinks"] = metadata[0]
        session["book_desc"] = metadata[1]

        if session["book_info"] is None:
            return abort(501)

        return make_response("Ok"), 200

    else:
        # if request.method == "GET"
        try:
            # Those two are the most important.
            # If the user has both session cookies, then render the page.
            book_info = session["book_info"]
            book_dlinks = session["book_dlinks"]
            # This one is secondary.
            try:
                book_desc = session["book_desc"]
                if book_desc == "" or None:
                    book_desc = "Sem descrição."

            except AttributeError:
                book_desc = "Sem descrição."

            if book_info["language"] == "Portuguese":
                book_info["language"] = "Português"

            else:
                # if book_info["language"] == "English"
                book_info["language"] = "Inglês"

            return render_template("book.html", book_info=book_info, d_links=book_dlinks,
                                   book_desc=book_desc)
        except AttributeError:
            return abort(502)
        except KeyError:
            return abort(502)


@app.route('/newhere')
def newhere():
    return render_template("newhere.html")


@app.route('/about')
def about():
    return render_template("about.html")


if __name__ == '__main__':
    app.run()
