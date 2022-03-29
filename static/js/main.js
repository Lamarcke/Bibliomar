
/* Sleeping function */
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* Deletes result and pagination div, basically */
const clearResultsDiv = () => {
    try{
        let resultsDiv = document.getElementById("resultsdiv");
        resultsDiv.remove();

    }catch (e){
        if (e === TypeError){
            return console.log("ResultsDiv already empty.");
        }
    }

}

const clearPaginationDiv = () => {
    try{
        let paginationDiv = document.getElementById("paginationdiv");
        paginationDiv.remove();


    }catch (e){
        if (e === TypeError){
            return console.log("PaginationDiv already empty.");
        }
    }
}

const clearErrorDiv = () => {
    try{
        let errorDiv = document.getElementById("errordiv");
        errorDiv.remove();


    }catch (e){
        if (e === TypeError){
            return console.log("ErrorDiv already empty.");
        }
    }
}

/* Surprisingly, handles errors. */
const errorHandler = (res) => {
    clearResultsDiv();
    clearPaginationDiv();
    clearErrorDiv();
    let errorDiv = document.createElement("div");
    errorDiv.id = "errordiv";
    errorDiv.className = "d-flex flex-row flex-wrap justify-content-center";
    errorRow.append(errorDiv);
    let errorP = document.createElement("p");

    if (res.status === 400){
        errorP.className = "note note-warning text-dark mt-5";
        errorP.innerText = "Opa, não conseguimos encontrar nada com esses termos. Que tal procurar em outra categoria ou formato?";
    }

    else if (res.status === 500){
        errorP.className = "note note-danger text-dark mt-5";
        errorP.innerText = "Ops, algo deu errado. Verifique sua conexão e tente novamente.";

    }

    else if (res.status === 501){
        errorP.className = "note note-danger text-dark mt-5";
        errorP.innerText = "Ops, ocorreu um erro ao conectar ao servidor de download. " +
            "Verifique sua conexão e tente novamente.";
    }

    else if (res.status === 502){
        errorP.className = "note note-danger text-dark mt-5";
        errorP.innerText = "Ops, ocorreu um ao acessar as informações do seu livro. " +
            "Por favor, realize a pesquisa novamente.";
    }

    else{
        errorP.className = "note note-danger text-dark mt-5";
        errorP.innerText = "Ops, algo deu errado.";
    }

    return errorDiv.append(errorP);


}

const coverHandler = async (md5) => {
    let ajax = await fetch(`/cover/${md5}`);
    let ajaxtext
    if (ajax.ok){
        return ajax.json();
    }else{
        /* Returns blank image if the promise rejects */
        return {
            "cover": "https://libgen.rocks/img/blank.png",
            "elapsed_time": 5
        }
    }

}

const moreInfoHandler = (moreInfoElement, bookInfo) => {

    /* This function makes a post request to save the clicked book info into a session cookie.
    * Since you can't redirect with fetch itself, you need to manually do so making a get request
    * to the endpoint.
     */

    moreInfoElement.addEventListener("click", (evt) => {
        let currentBook = bookInfo

        evt.preventDefault()
        /* A click will trigger the fetch, and it will try itself two times before exiting. */
        fetch(`/book/`, {
            method: "POST",
            body: JSON.stringify(currentBook),
            credentials: "same-origin",
            headers: {
                "Content-type": "application/json",
            },

        }).then((r) => {
            if (r.ok) {
                return
            }
            return errorHandler(r)
        }).then(() => {
            fetch("/book/")
                .then((r) => {
                    if(r.ok){
                        return window.open("/book/", "_blank")
                    }
                    return errorHandler(r)

                })
        })

    })
}

const resultsHandler = async (data, lengthStart, lengthEnd) => {
    clearResultsDiv();
    clearErrorDiv();
    /* Don't clean paginationDiv here. */
    /* Only removes the newhere button if the query returns something */
    newhere.remove();
    let bookInfo;
    let cover;
    let elapsed_time;
    let resultsdiv = document.createElement("div");
    resultsdiv.id = "resultsdiv";
    resultsdiv.className = "d-flex flex-wrap flex-row justify-content-center mt-5";
    resultsRow.append(resultsdiv);

    /* Creates loading info and spinner. */
    let loadingDiv = document.createElement("div")
    loadingDiv.className = "d-flex flex-wrap flex-row justify-content-center"
    resultsdiv.append(loadingDiv)
    let loadingP = document.createElement("p");
    loadingP.className = "note note-info text-dark";
    loadingP.innerText = "Estamos baixando as informações dos seus livros, isso pode demorar um pouco...";
    let loadingBreak = document.createElement("div");
    loadingBreak.className = "break";
    let loadingSpinner = document.createElement("p");
    loadingSpinner.className = "spinner-border";
    loadingDiv.append(loadingP, loadingBreak, loadingSpinner);
    let break_ = document.createElement("div");
    break_.className = "break";
    resultsdiv.append(break_);

    for (let i = lengthStart; i < lengthEnd; i++) {
        if (i % 3 === 0) {
            /* Every three iterations, and on the first one, execute this code that adds a break every 3 books. */
            /* Useful for desktop, mobile adds breaks after each book. */
            let break_ = document.createElement("div");
            break_.className = "break";
            resultsdiv.append(break_);
        }

        let md5 = data[i]["md5"]
        let extension;
        let size;

        /* For non-fiction results */
        if (data[i].hasOwnProperty("extension")) {
            extension = data[i]["extension"];
            size = data[i]["size"];
        /* For fiction results */
        } else {
            /* Matches everything before the / */
            extension = data[i]["file"].match(/.*\//g);
            extension = extension.join("");
            /* Removes a space and / */
            extension = extension.replace(" /", "");

            /* Matches everything after the / */
            size = data[i]["file"].match(/\/.*/g);
            size = size.join("");
            /* Removes / and a space */
            size = size.replace("/ ", "")
        }

        let coverCached = coverCache.getItem(md5)

        if (coverCached){
            cover = coverCache.getItem(md5)

        }else{
            let coverResults = await coverHandler(md5)
            cover = coverResults.cover
            elapsed_time = coverResults.elapsed_time
            /* Adds to cover cache */
            coverCache.setItem(md5, cover)
        }

        bookInfo = {
            "title": data[i]["title"],
            "authors": data[i]["author(s)"],
            "language": data[i]["language"],
            "mirror1": data[i]["mirror1"],
            "category": data[i]["category"],
            "cover": cover,
            "md5": md5,
            "extension": extension,
            "size": size

        }



        /* Info that will not be sent to the backend */

        let bookFigure = document.createElement("figure");
        bookFigure.className = "figure";
        resultsdiv.append(bookFigure);

        let bookImg = document.createElement("img");
        bookImg.className = "figure-img resultimg";
        bookImg.src = cover;

        let bookCaption = document.createElement("figcaption");
        bookCaption.className = "figure-caption text-wrap text-light bookcaption border border-dark border-top-0";
        /* Quite the code to add onclick events to both title and "more info" */
        bookCaption.innerHTML = `<p class="mx-2"><strong>Título: </strong>${bookInfo.title}</p>` +
            `<span class='text-start mx-2'><strong>Autor(a)(s): </strong>${bookInfo.authors}</span>` +
            `<p class='mx-2'><strong>Arquivo: </strong>${bookInfo.extension.toUpperCase()}, ${bookInfo.size}</p>`;

        let moreInfoDiv = document.createElement("div");
        moreInfoDiv.className = "text-center";
        let moreInfoLink = document.createElement("a")
        moreInfoLink.className = "mb-1 btn btn-secondary btn-rounded"
        moreInfoLink.innerText = "Mais informações"
        moreInfoDiv.append(moreInfoLink)
        moreInfoHandler(moreInfoLink, bookInfo)
        bookCaption.append(moreInfoDiv);
        bookFigure.append(bookImg, bookCaption);

        /* The sleep function freezes the event loop for x ms, so it's bad practice.
        * (it actually only blocks this for loop.)
        * It's used to avoid messing with the backend and being blocked from 3lib or libgenrocks.
        * In the context of this specific app, it works.
        * The for loop will wait for x ms BEFORE trying to get the book's cover, the function iteself
        * may take longer than this. */

        /* Checks (again) if cover was already cached. */
        /* Still waits a bit because 3lib/libgenrocks doesn't like when you load too many images at the same time...
        * This still gives the impression that the page loads almost instantly. */

        if (coverCached){
            await sleep(500)
        }else{
            /* If not, wait a bit before making the next request */
            /* Doing this removes the x sec waiting time after the last request. */
            if (i !== lengthEnd){
                if (elapsed_time <= 3){
                    /* If the functions returns the cover in a less than or in a 3 seconds request
                    * (this is calculated on the backend) then wait for 3000ms before making the next request. */
                    await sleep(3000)
                }else if (elapsed_time === 4){
                    /* If it takes more time, still waits 1.5 sec, gotta be patient. */
                    await sleep(1500)
                }else{
                    /* More than that, and just proceeds. */
                }
            }
        }




    }
    loadingSpinner.remove()
    loadingP.className = "text-success";
    loadingP.innerText = "Tudo pronto. Boa leitura!"
    setTimeout(() => loadingDiv.remove(), 5000)
}

const paginationHandler = (data) => {
    /* Shows pagination div */
    clearResultsDiv();
    clearPaginationDiv();
    clearErrorDiv();
    let paginationDiv = document.createElement("div");
    paginationDiv.id = "paginationdiv"
    paginationDiv.className = "d-flex flex-row justify-content-center mt-3";
    let paginationNav = document.createElement("nav");
    let paginationUl = document.createElement("ul");
    paginationUl.className = "pagination";
    paginationRow.append(paginationDiv);
    paginationDiv.append(paginationNav)
    paginationNav.append(paginationUl)
    let pn = 0;

    for (let x = 0; x < data.length; x++){

        /* If x is equal to 0, or is divisible by 10. */
        if (x === 0 || x % 10 === 0){
            /* This runs every 11 iterations. */
            pn += 1;
            let paginationLi = document.createElement("li");
            if (x === 0){
                paginationLi.className = "page-item active";
            }else{
                paginationLi.className = "page-item"
            }

            let paginationA = document.createElement("a")
            paginationA.className = "page-link text-light paginationlinks"
            paginationA.innerText = `${pn}`
            paginationA.addEventListener("click", () => {
                /* Removes the active class from all others pages */
                let thisPn = pn
                let pageItems = Array.from(document.getElementsByClassName("page-item"))
                pageItems.forEach((el) => {
                    el.className = "page-item"
                })

                let lengthE = x + 10
                if (lengthE >= data.length){
                lengthE = data.length;
                }

                /* Changes this element's class to active. */
                let thisPageIndex = x / 10
                let thisPage = pageItems[thisPageIndex]
                thisPage.className = "page-item active"
                return resultsHandler(data, x, lengthE, thisPn)
            })

            paginationUl.append(paginationLi);
            paginationLi.append(paginationA);

        }
    }

    let lengthE = 10
    if (lengthE >= data.length){
        lengthE = data.length;
    }
    /* Renders the first page. */
    return resultsHandler(data, 0, lengthE)
}

const searchHandler = (evt) => {
    evt.preventDefault();
    clearResultsDiv();
    clearPaginationDiv();
    clearErrorDiv()
    let resultsdiv = document.createElement("div");
    resultsdiv.id = "resultsdiv";
    resultsdiv.className = "d-flex flex-wrap flex-row justify-content-center mt-5";
    resultsRow.append(resultsdiv);

    let loadingDiv = document.createElement("div");
    loadingDiv.className = "d-flex flex-wrap flex-row justify-content-center"
    resultsdiv.append(loadingDiv);
    let loadingP = document.createElement("p");
    loadingP.className = "note note-info text-dark";
    loadingP.innerText = "Estamos enviando sua solicitação ao servidor...";
    let loadingBreak = document.createElement("div");
    loadingBreak.className = "break";
    let loadingSpinner = document.createElement("p");
    loadingSpinner.className = "spinner-border";
    loadingDiv.append(loadingP, loadingBreak, loadingSpinner);

    let formData = new FormData(searchForm)
    let searchFieldValue = searchField.value
    let searchObject = {
        format: formData.get("format"),
        searchby: formData.get("searchby"),
        searchcat: formData.get("searchcat"),
        searchlang: formData.get("searchlang"),
        query: searchFieldValue
    }
    let searchString = JSON.stringify(searchObject)
    let searchCacheValue = searchCache.getItem(searchString)

    /* If this search is cached (we save the exact same json object on the cache), runs this */
    if(searchCacheValue){
        let searchCacheParsed = JSON.parse(searchCacheValue)
        /* Loads the cached request and avoids making a new request to the back-end. */
        return paginationHandler(searchCacheParsed)
    }

    fetch("/search", {
        method: "POST",
        body: searchString,
        headers: {
            "Content-type": "application/json"
        }
    }).then((r) => {
        if (r.ok){
            return r.json();
        }
        return errorHandler(r);
    }).then((data) => {
        if (data !== undefined){
            /* Converts data object to String, so it's storable on the sessionCache */
            let dataString = JSON.stringify(data)
            /* Sets "searchString" : "dataString" on searchCache */
            searchCache.setItem(searchString, dataString)
            return paginationHandler(data);
        }
    })

}

/* Disables author search for non-fiction */
const authorSearchHandler = () => {
    searchCatFiction.addEventListener("click", () => {
        searchByAuthorInput.disabled = false
        searchByAuthorLabel.className = ""

    })

    searchCatNonFiction.addEventListener("click", () => {
        searchByAuthorInput.disabled = true
        searchByAuthorLabel.className = "text-muted"
    })
}

/* The coverCache is now an localStorage object, it will persist between browser closes.
* The searchCache only lasts as long as the browser is open. */
let coverCache = window.localStorage
let searchCache = window.sessionStorage
let searchForm = document.getElementById("searchform");
let searchField = document.getElementById("searchfield");
let resultsRow = document.getElementById("resultsrow");
let paginationRow = document.getElementById("paginationrow");
let errorRow = document.getElementById("errorrow")
let newhere = document.getElementById("newhere");
let searchCatFiction = document.getElementById("searchcatfiction");
let searchCatNonFiction = document.getElementById("searchcatnonfiction");
let searchByAuthorInput = document.getElementById("searchbyauthorinput");
let searchByAuthorLabel = document.getElementById("searchbyauthorlabel");



searchForm.addEventListener("submit", searchHandler);
authorSearchHandler();
