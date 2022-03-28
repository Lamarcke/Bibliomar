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


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/cover/<md5>')
def cover(md5):
    try:
        response = make_response(resolve_cover(md5))
        if response is None:
            return "https://libgen.rocks/img/blank.png"
        return response
    except TypeError:
        return "https://libgen.rocks/img/blank.png"


@app.route('/search', methods=["GET", "POST"])
def search():
    # Checks if libgenrocks is down.
    libcheck()
    # Clear the session to avoid bugs.
    session.clear()
    list_ = search_handler(request.get_json())
    if list_ is None:
        abort(400)
    if list_ == 400:
        abort(400)

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
        if metadata == 401:
            abort(401)
        session["book_dlinks"] = metadata[0]
        session["book_desc"] = metadata[1]
        return make_response("Ok"), 200

    # if request.method == "GET"
    if session["book_info"] and session["book_dlinks"]:
        book_info = session["book_info"]
        book_dlinks = session["book_dlinks"]
        book_desc = session["book_desc"]
        # If the user has both session cookies, then render the page.

        if book_desc == "" or None:
            book_desc = "Sem descrição."

        if book_info["language"] == "Portuguese":
            book_info["language"] = "Português"

        else:
            # if book_info["language"] == "English"
            book_info["language"] = "Inglês"

        return render_template("book.html", book_info=book_info, d_links=book_dlinks,
                               book_desc=book_desc)

    return abort(401)


@app.route('/newhere')
def newhere():
    return render_template("newhere.html")


@app.route('/about')
def about():
    return render_template("about.html")


if __name__ == '__main__':
    app.run()
