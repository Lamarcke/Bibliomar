
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

/* Surprisingly, handles errors. */
const errorHandler = (res) => {
    let errorDiv = document.createElement("div");
    errorDiv.id = "errordiv";
    errorDiv.className = "d-flex flex-row flex-wrap justify-content-center";
    errorRow.append(errorDiv);
    let errorP = document.createElement("p");

    if (res.status === 400){
        clearResultsDiv();
        clearPaginationDiv();
        clearErrorDiv();
        errorP.className = "text-warning mt-5";
        errorP.innerText = "Opa, não conseguimos encontrar nada com esses termos. Que tal procurar em outra categoria ou formato?";
    }

    else if (res.status === 401){
        clearResultsDiv();
        clearPaginationDiv();
        clearErrorDiv();
        errorP.className = "text-danger mt-5";
        errorP.innerText = "Ops, ocorreu um erro ao conectar ao servidor de download. " +
            "Verifique sua conexão e tente novamente.";
    }

    else if (res.status === 500){
        clearResultsDiv();
        clearPaginationDiv();
        clearErrorDiv();
        errorP.className = "text-danger mt-5";
        errorP.innerText = "Ops, algo deu errado. Verifique sua conexão e tente novamente.";

    }

    else{
        clearResultsDiv();
        clearPaginationDiv();
        errorP.className = "text-danger mt-5";
        errorP.innerText = "Ops, algo deu errado.";
    }

    errorDiv.append(errorP);


}

const coverHandler = async (md5) => {
    let ajax = await fetch(`/cover/${md5}`);
    if (ajax.ok){
        return ajax.text();
    }
    /* Returns blank image if the promise rejects */
    return "https://libgen.rocks/img/blank.png";
}

const redirectToBook = () => {
    fetch("/book/")
        .then((r) => {
            if(r.ok){
                return window.open("/book/", "_blank")
            }
            return errorHandler(r)
    })
}

const moreInfoHandler = (moreInfoElement, bookInfo) => {

    /* This function makes a post request to save the clicked book info into a session cookie.
    * Since you can't redirect with fetch itself, you need to manually do so making a get request
    * to the endpoint.
     */

    moreInfoElement.addEventListener("click", (evt) => {
        let currentBook = bookInfo
        clearErrorDiv()
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
                console.log("First r is ok")
                return "ok"
            }
            return errorHandler(r)
        }).then(redirectToBook)

    })
}

const resultsHandler = async (data, lengthStart, lengthEnd) => {
    clearResultsDiv();
    clearErrorDiv()
    /* Don't clean paginationDiv here. */
    /* Only removes the newhere button if the query returns something */
    newhere.remove();
    let resultsdiv = document.createElement("div");
    resultsdiv.id = "resultsdiv";
    resultsdiv.className = "d-flex flex-wrap flex-row justify-content-center mt-5";
    resultsRow.append(resultsdiv);

    /* Creates loading info and spinner. */
    let loadingDiv = document.createElement("div")
    loadingDiv.className = "d-flex flex-wrap flex-row justify-content-center"
    resultsdiv.append(loadingDiv)
    let loadingP = document.createElement("p");
    loadingP.className = "text-info";
    loadingP.innerText = "Estamos carregando seus livros, isso pode demorar um pouco...";
    let loadingBreak = document.createElement("div");
    loadingBreak.className = "break";
    let loadingSpinner = document.createElement("p");
    loadingSpinner.className = "spinner-border";
    loadingDiv.append(loadingP, loadingBreak, loadingSpinner);
    let break_ = document.createElement("div");
    break_.className = "break";
    resultsdiv.append(break_);
    let bookInfo;
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

        let cover = await coverHandler(md5)

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
        * It's used to avoid messing with the backend and being blocked from libgenrocks.
        * In the context of this specific app, it works.
        * The for loop will wait for 2000ms BEFORE trying to get the book's cover, the function iteself
        * may take longer than this. */

        if (i !== lengthEnd){
            /* Doing this removes the 2 sec waiting time after the last request. */
            await sleep(4000)
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
                return resultsHandler(data, x, lengthE)
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
    loadingP.className = "text-info";
    loadingP.innerText = "Estamos enviando sua solicitação ao servidor...";
    let loadingBreak = document.createElement("div");
    loadingBreak.className = "break";
    let loadingSpinner = document.createElement("p");
    loadingSpinner.className = "spinner-border";
    loadingDiv.append(loadingP, loadingBreak, loadingSpinner);

    let formData = new FormData(searchForm)
    let searchFieldValue = searchField.value
    let jsonObject = {
        format: formData.get("format"),
        searchby: formData.get("searchby"),
        searchcat: formData.get("searchcat"),
        searchlang: formData.get("searchlang"),
        query: searchFieldValue
    }

    fetch("/search", {
        method: "POST",
        body: JSON.stringify(jsonObject),
        headers: {
            "Content-type": "application/json"
        }
    }).then((r) => {
        if (r.ok){
            return r.json()
        }
        return errorHandler(r)
    }).then((data) => {
        if (data !== undefined){
            return paginationHandler(data);
        }
    })

}

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
