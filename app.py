from flask import Flask, render_template, request, make_response, abort, session
from metadatahandler import resolve_cover, resolve_metadata, libcheck
from search import search_handler
from os import urandom
import threading
import json

app = Flask(__name__)
app.secret_key = urandom(32)


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
    # Checks if libraryrocks is down when the user searchs. It will then be used by the
    # cover service.
    libcheck()
    session.clear()
    list_ = search_handler(request.get_json())
    if list_ is None:
        print("List is none on endpoint.")
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
        metadata = resolve_metadata(request_data["mirror1"])
        session["d_links"] = metadata[0]
        session["book_desc"] = metadata[1]
        return make_response("Ok")

    if session["book_info"] and session["d_links"]:
        # If the user has both session cookies, then render the page.

        if session["book_desc"] is None:
            session["book_desc"] = "Sem descrição."

        return render_template("book.html", book_info=session["book_info"], d_links=session["d_links"],
                               book_desc=session["book_desc"])
    return abort(400)


@app.route('/newhere')
def newhere():
    return render_template("newhere.html")


@app.route('/about')
def about():
    return render_template("about.html")


if __name__ == '__main__':
    app.run()
