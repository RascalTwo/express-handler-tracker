/* Window Engine - MIT License - Copyright (c) 2019 Gauthier Staehler */

const metaTag = document.createElement("meta");
metaTag.name = "viewport";
metaTag.content = "user-scalable=0";
document.getElementsByTagName("head")[0].appendChild(metaTag);

const lastWindow = document.getElementsByClassName("windowGroup")[0].lastElementChild.id.substring(6);
const active = document.getElementsByClassName("window");

for (let i = 1; i <= lastWindow; i++) {
    createWindow(i);
}

function createWindow(id) {
    let windowID = document.getElementById("window" + id);
    let headerID = windowID.firstElementChild;
    headerID.id = "window" + id + "header";

    const customContainer = document.createElement('span')
    document.getElementById("window" + id + "header").appendChild(customContainer);

    let createCloseButton = document.createElement("b");
    createCloseButton.id = "closeButton" + id;
    createCloseButton.innerHTML = "×";
    document.getElementById("window" + id + "header").appendChild(createCloseButton);
    document.getElementById("closeButton" + id).onclick = function () {
        fadeOut(windowID);
        document.getElementById("button" + id).className = '';
    };
    document.getElementById("button" + id).onclick = function () {
        const opening = windowID.style.display !== "initial";
        this.classList.toggle('btn-success', opening);
        if (!opening) {
            this.classList.remove('btn-secondary');
            fadeOut(windowID);
        } else {
            fadeIn(windowID);
        }
    };
    dragElement(windowID);
}

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if ("ontouchstart" in document.documentElement) {
        var pos1touch = 0,
            pos2touch = 0,
            pos3touch = 0,
            pos4touch = 0;
    }
    if (document.getElementById(elmnt.id + "header")) {
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        document.getElementById(elmnt.id + "header").ontouchstart = dragMouseDown;
    }

    function dragMouseDown(e) {
        if (!"ontouchstart" in document.documentElement) {
            e.preventDefault();
        }
        pos3 = e.clientX;
        pos4 = e.clientY;
        if ("ontouchstart" in document.documentElement) {
            try {
                pos3touch = e.touches[0].clientX;
                pos4touch = e.touches[0].clientY;
            } catch (error) { }
        }
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
        activeWindow(document.getElementById(elmnt.id));
    }

    function elementDrag(e) {
        e.preventDefault();
        if ("ontouchstart" in document.documentElement) {
            pos1touch = pos3touch - e.touches[0].clientX;
            pos2touch = pos4touch - e.touches[0].clientY;
            pos3touch = e.touches[0].clientX;
            pos4touch = e.touches[0].clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2touch) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1touch) + "px";
        } else {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

function fadeIn(elmnt) {
    elmnt.style.opacity = 0;
    elmnt.style.display = "initial";
    if (elmnt.classList.contains("fade")) {
        var opacity = 0;
        var timer = setInterval(function () {
            opacity += 30 / 70;
            if (opacity >= 1) {
                clearInterval(timer);
                opacity = 0.9;
            }
            elmnt.style.opacity = opacity;
            activeWindow(elmnt);
        }, 50);
    } else {
        elmnt.style.opacity = "0.9";
        activeWindow(elmnt);
    }
}

function fadeOut(elmnt) {
    if (elmnt.classList.contains("fade")) {
        var opacity = 1;
        var timer = setInterval(function () {
            opacity -= 30 / 70;
            if (opacity <= 0) {
                clearInterval(timer);
                opacity = 0;
                elmnt.style.display = "none";
            }
            elmnt.style.opacity = opacity;
        }, 50);
    } else {
        elmnt.style.display = "none";
        activeWindow(elmnt);
    }
}

function activeWindow(elmnt) {
    for (let i = active.length - 1; i > -1; i--) {
        active[i].classList.remove("windowActive");
    }
    elmnt.classList.add("windowActive");
    const wid = elmnt.id.split('window')[1]
    setTimeout(() => {
        document.querySelectorAll('[id^="button"]').forEach(b => b.classList.remove('btn-secondary'))
        localStorage.setItem(`window${wid}-style`, elmnt.getAttribute('style'));
        if (elmnt.style.display === "none") return;
        document.querySelector(`#button${wid}`).classList.add('btn-secondary')
    }, 500)
}


const observer = new MutationObserver(mutations => {
    for (const { target: w } of mutations) {
        localStorage.setItem(`${w.id}-style`, w.getAttribute('style'));
    }
})
document.querySelectorAll('.window').forEach(w => observer.observe(w, { attributeFilter: ['class'] }))

function renderInitialWindows() {
    document.querySelector('#window1').setAttribute('style', window.localStorage.getItem("window1-style") || '');
    document.querySelector('#window2').setAttribute('style', window.localStorage.getItem("window2-style") || '');
    document.querySelector('#window3').setAttribute('style', window.localStorage.getItem("window3-style") || '');
    document.querySelector('#window4').setAttribute('style', window.localStorage.getItem("window4-style") || '');
    document.querySelector('#window5').setAttribute('style', window.localStorage.getItem("window5-style") || '');
    document.querySelector('#window6').setAttribute('style', window.localStorage.getItem("window6-style") || '');
    document.querySelector('#window7').setAttribute('style', window.localStorage.getItem("window7-style") || '');
    document.querySelector('#button1').className = +document.querySelector('#window1').style.opacity ? 'btn-success' : ''
    document.querySelector('#button2').className = +document.querySelector('#window2').style.opacity ? 'btn-success' : ''
    document.querySelector('#button3').className = +document.querySelector('#window3').style.opacity ? 'btn-success' : ''
    document.querySelector('#button4').className = +document.querySelector('#window4').style.opacity ? 'btn-success' : ''
    document.querySelector('#button5').className = +document.querySelector('#window5').style.opacity ? 'btn-success' : ''
    document.querySelector('#button6').className = +document.querySelector('#window6').style.opacity ? 'btn-success' : ''
    document.querySelector('#button7').className = +document.querySelector('#window7').style.opacity ? 'btn-success' : ''
}
renderInitialWindows()

document.querySelector('#button1').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window1-style`, document.querySelector('#window' + 1).getAttribute('style')), 1000));
document.querySelector('#button2').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window2-style`, document.querySelector('#window' + 2).getAttribute('style')), 1000));
document.querySelector('#button3').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window3-style`, document.querySelector('#window' + 3).getAttribute('style')), 1000));
document.querySelector('#button4').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window4-style`, document.querySelector('#window' + 4).getAttribute('style')), 1000));
document.querySelector('#button5').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window5-style`, document.querySelector('#window' + 5).getAttribute('style')), 1000));
document.querySelector('#button6').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window6-style`, document.querySelector('#window' + 6).getAttribute('style')), 1000));
document.querySelector('#button7').addEventListener('click', () => setTimeout(() => localStorage.setItem(`window7-style`, document.querySelector('#window' + 7).getAttribute('style')), 1000));
document.querySelector('#reset-windows').addEventListener('click', () => {
    for (const child of document.querySelector('.windowGroup').children) {
        child.removeAttribute('style');
    }
    for (let i = 1; i <= 7; i++) {
        document.querySelector('#button' + i).className = '';
        setTimeout((i) => localStorage.setItem(`window${i}-style`, document.querySelector('#window' + i).getAttribute('style')), 1000, i);
    }
})
document.querySelectorAll('.window').forEach(w => w.addEventListener('click', e => activeWindow(e.currentTarget)));