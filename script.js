// TODO: Implement download function for the SVG
// TODO?: Expand the project: Let users move the nodes around
// TODO?: Use arrows instead of lines to indicate the direction


class CircleLoc { 
    constructor(xLoc, yLoc) { 
        this.xLoc = xLoc; 
        this.yLoc = yLoc; 
    }
}

// resetting the circles data in localstorage (not needed atm)
// localStorage.setItem("circles", JSON.parse("[]"));

SELECT_MODE = 0; // don't change!!
UPDATE_REAL_TIME = true; // change if you want to update the edges in real time while removing

SVG.on(document, 'DOMContentLoaded', function() {
    // defining the graph and adding the button to DOM 
    const draw = SVG().addTo('body').size("100vw", "95vh");
    const graph = document.querySelector("svg");
    const container = document.createElement("div"); 
    container.classList.add("container");
    
    addButton("btn-danger", "Clear", container); 
    addButton("btn-primary", "Download", container);
    addButton("btn-secondary", "Remove", container); 

    // create input for no. of connections
    let numberInput = document.createElement("input"); 
    let noConnections = localStorage.getItem("noConnections") || 4;
    localStorage.setItem("noConnections", noConnections);
    numberInput.classList.add("form-control"); 
    numberInput.classList.add("w-25"); 
    numberInput.type = "number";
    numberInput.value = noConnections; 
    numberInput.min = 0; 
    container.append(numberInput); 
    document.body.append(container);

    const clearBtn = document.querySelector(".btn-danger");
    const downloadBtn = document.querySelector(".btn-primary");
    const removeBtn = document.querySelector(".btn-secondary");
    const connectionsInput = document.querySelector("input.form-control"); 

    // setting initial stage of the graph
    let circles = JSON.parse(localStorage.getItem("circles") || "[]");
    for (circle of circles) { 
        draw.circle(20, 20).move(circle.xLoc, circle.yLoc).fill("#000").stroke("#fff");
    }

    // adding a new circle on click and updating the storage
    graph.addEventListener("click", e => {
        if (SELECT_MODE != 0) return;
        let circles = JSON.parse(localStorage.getItem("circles") || "[]");
        let xLoc = e.clientX; 
        let yLoc = e.clientY; 
        let newCircle = new CircleLoc(xLoc, yLoc); 
        circles.push(newCircle); 
        draw.circle(20, 20).move(xLoc, yLoc).fill("#000").stroke("#fff");
        if (UPDATE_REAL_TIME) removeEdges();
        drawEdges(circles);
        addCircleHovers();
        localStorage.setItem("circles", JSON.stringify(circles));
    })

    // implementing clear functionality
    clearBtn.addEventListener("click", e => {
        localStorage.setItem("circles", JSON.parse("[]"));
        location.reload();
    })

    removeBtn.addEventListener("click", e => {
        if (removeBtn.innerHTML == "Done") {
            SELECT_MODE = 0;
            updateCircles(done=true);
            removeBtn.innerHTML = "Remove";
            return; 
        }
        removeBtn.innerHTML = "Done";
        SELECT_MODE = 1; 
        let allCircles = document.querySelectorAll("svg circle"); 
        for (let circle of allCircles) {
            circle.setAttribute("fill", "#ff0000");
            circle.addEventListener("click", e => {
                e.target.remove();
                if (UPDATE_REAL_TIME) updateCircles(done=false);
            })
        }
    })

    downloadBtn.addEventListener("click", e=> {
        let curGraph = document.querySelector("svg"); 
        curGraph.setAttribute("style", "background-color:navy");
        let outputText = curGraph.outerHTML; 
        console.log(outputText);
        curGraph.setAttribute("style", "");
        downloadBtn.href = makeTextFile(outputText);
    })

    connectionsInput.addEventListener("change", e => {
        localStorage.setItem("noConnections", connectionsInput.value);
        removeEdges();
        let circles = JSON.parse(localStorage.getItem("circles") || "[]");
        drawEdges(circles); 
    })

    // setting the initial stage
    drawEdges(circles);
    addCircleHovers();

    // function for drawing all the edges
    function drawEdges(circles) {
        let noConnections = parseInt(localStorage.getItem("noConnections")) + 1; 

        // All Closest Nodes DOCS
        /*
            Indices 
                - Node (xLoc, yLoc)
                - Closest Nodes
                    - Distance
                    - Node (xLoc, yLoc)
        */ 
        let allClosestNodes = new Map();
        for (let i=0;i<circles.length;i++) { 
            let circle = circles[i]; 
            // create a map for the 5 closest nodes
            let closestNodes = new Map();
            for (otherCircle of circles) {

                //check their distance and pop the further ones
                let curDistance = getDistance(circle, otherCircle);  
                let curMaxDistance = maxDistance(closestNodes); 
                if (closestNodes.size < noConnections) { 
                    closestNodes.set(curDistance, otherCircle); 
                }
                else if (curDistance < curMaxDistance) {
                    closestNodes.delete(curMaxDistance); 
                    closestNodes.set(curDistance, otherCircle); 
                }
            }
            // loop through the 5 closest nodes and do double lines
            for (node of closestNodes.values()) {
                draw.line(node.xLoc+10, node.yLoc+10, circle.xLoc+10, circle.yLoc+10).stroke("#fff");
            }

            allClosestNodes.set(circle, Array.from(closestNodes.entries())); 
        }
        localStorage.setItem("connections", JSON.stringify(Array.from(allClosestNodes.entries())));
        let allConnections = JSON.parse(localStorage.getItem("connections") || "[]");
    }

    function removeEdges() {
        const allLines = document.querySelectorAll("line");
        for (const line of allLines) {
            line.remove();
        }
    }

    function updateCircles(done) {
        let circles = []; 
        for (let circle of document.querySelectorAll("circle")) {
            circles.push(new CircleLoc(circle.cx.animVal.value-10, circle.cy.animVal.value-10)); 
            if (done) circle.setAttribute("fill", "#000000");
        }
        localStorage.setItem("circles", JSON.stringify(circles));
        removeEdges();
        drawEdges(circles); 
    }

    // adding hovers (used right after creating new set of circles)
    function addCircleHovers() {
        for (circle of document.querySelectorAll("circle")) {
            circle.addEventListener("mouseover", e=> {
                if (SELECT_MODE != 0) return;
                e.target.setAttribute("stroke", "#ff7824");
                let xValue = e.target.cx.animVal.value;
                let yValue = e.target.cy.animVal.value;
                let allConnections = JSON.parse(localStorage.getItem("connections") || "[]");

                // loop over to find the circle
                for (let circle of allConnections) { 
                    let curCircle = circle[0]; 
                    let closestCircles = circle[1];
                    if (curCircle.xLoc == xValue-10 && curCircle.yLoc == yValue-10) {}  
                    else continue; 
                    for (let closeCircle of closestCircles) {
                        let distance = closeCircle[0]; 
                        if (distance == 0) continue; 
                        let highlightCircle = closeCircle[1]; 
                        let specificNode = document.querySelector(`[cx="${highlightCircle.xLoc+10}"][cy="${highlightCircle.yLoc+10}"]`);
                        specificNode.setAttribute("fill", "#ff7824"); 
                    }
                }
            })
            circle.addEventListener("mouseout", e=> {
                if (SELECT_MODE != 0) return;
                e.target.setAttribute("stroke", "#fff");
                for (let circle of document.querySelectorAll("circle")) {
                    circle.setAttribute("fill", "#000000");
                }
            })
        }    
    }
})


// adding the clear button to the bottom
function addButton(_class, text, container) { 
    let button = document.createElement("button"); 
    if (text == "Download") {
        button = document.createElement("a"); 
        button.setAttribute("download", "graph.svg"); 
    }
    button.classList.add("btn"); 
    button.classList.add(_class); 
    button.innerHTML = text; 
    container.append(button);
}

// getting the current max distance in node connections
function maxDistance(nodes) {
    maxValue = -1; 
    for (const x of nodes.keys()) {
        if (x > maxValue) maxValue = x; 
    }
    return maxValue; 
}

// returns the Cartesian distance between two CircleLoc objects
function getDistance(circle1, circle2) { 
    return Math.sqrt(Math.pow(circle1.xLoc-circle2.xLoc, 2) + Math.pow(circle1.yLoc-circle2.yLoc, 2)); 
}

// function to create a graph svg file
var textFile = null,
  makeTextFile = function (text) {
    // var data = new Blob([text], {type: 'image/svg+xml'});
    var data = new Blob([text], {type: 'application/xml'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    return textFile;
  };
