import { WebSocketGameLobbyClient } from 'websocket-game-lobby-client';
import { v4 as uuidv4 } from 'uuid';
const tinycolor = require("tinycolor2");

const App = (function () {
    const gameLobby = new WebSocketGameLobbyClient({
        port: 5000
    });


    //Returns the squared Euclidean distance
    const distSq = function(x0,y0,x1,y1) {
        return (Math.pow(x1-x0,2) + Math.pow(y1-y0,2));
    }

    //Euclidean distance btwn two points
    const dist = function(x0,y0,x1,y1) {
        //return Math.sqrt(Math.pow(x1-x0,2) + Math.pow(y1-y0,2));
        return Math.sqrt(distSq(x0,y0,x1,y1));
    };

    const UI = (function() {
        //Color picker
        const ColorPicker = (function() {

            const data = {
                hue: 0
            };

            const colorSquareWrapper = document.getElementById("color-square-wrapper");
            const colorSquare = document.getElementById("color-square");
            const colorSquareCtx = colorSquare.getContext("2d");

            const huePickerWrapper = document.getElementById("hue-picker-wrapper");
            const huePicker = document.getElementById("hue-picker");
            const huePickerCtx = huePicker.getContext("2d");

            const options = {
                size: 150,

                huePicker: {
                    width: 17
                }
            };

            const init = function() {
                colorSquareWrapper.style.width = `${options.size}px`;
                colorSquareWrapper.style.height = `${options.size}px`;
                colorSquare.setAttribute("width", options.size);
                colorSquare.setAttribute("height", options.size);
                colorSquareCtx.imageSmoothingEnabled = false;

                huePickerWrapper.style.width = `${options.huePicker.width}px`;
                huePickerWrapper.style.height = `${options.size}px`;
                huePicker.setAttribute("width", 1);
                huePicker.style.width = `${options.huePicker.width}px`;     //Scale canvas with CSS
                huePicker.style.height = `${options.size}px`;     
                huePicker.setAttribute("height", options.size);
            };

            const drawHues = function() {
                let s = 100, l = 50;
                let hue = 0;
                let hexColor;
                for (let i=0; i<options.size; i++) {
                    hue = (i/options.size)*360;
                    hexColor = tinycolor({h: hue, s: s, l: l}).toHexString();
                    huePickerCtx.fillStyle = hexColor;
                    huePickerCtx.fillRect(0,i,1,1);
                }
            };


            const drawColor = function() {
                let s, l;
                let hexColor;
                //Luminance on X
                for (let i=0; i<=options.size; i++) {
                    //Saturation on Y
                    for (let j=0; j<=options.size; j++) {
                        s = Math.floor((i/options.size)*100);
                        l = 100 - Math.floor((j/options.size)*100);
                        hexColor = tinycolor({h: data.hue, s: s, l: l}).toHexString();
                        colorSquareCtx.fillStyle = hexColor;
                        colorSquareCtx.fillRect(i,j,1,1);
                    }
                }
            };

            init();
            drawHues();
            drawColor();

        })();
    })();

    const Canvas = (function () {
        //DOM references
        const mainCanvas = document.getElementById("main-canv");
        const auxCanvas = document.getElementById("aux-canv");
        const canvasWrapper = document.querySelector(".canvas-wrapper");

        const mainCtx = mainCanvas.getContext("2d");

        //Static constants
        const width = 1000;
        const height = 800;

        var canvasBbox = canvasWrapper.getBoundingClientRect();

        const updateCanvasBoundingBox = () => canvasBbox = canvasWrapper.getBoundingClientRect();

        //Binding offset vars to window resize
        window.onresize = updateCanvasBoundingBox;
;

        const setElementDims = function(el,w,h) {
            el.setAttribute("width", w);
            el.setAttribute("height", h)
        }

        // const setCanvasSize = function (w, h) {
        //     canvasEl.setAttribute("width", w);
        //     canvasEl.setAttribute("height", h);
        // };

        //Initialize canvas properties
        const init = function () {
            //setCanvasSize(width, height);
            setElementDims(mainCanvas,width,height);
            setElementDims(auxCanvas,width,height);
            
            canvasWrapper.style.width = `${width}px`;
            canvasWrapper.style.height = `${height}px`;

            updateCanvasBoundingBox();

            mainCtx.lineWidth = 10;
            mainCtx.lineCap = 'round';
        };
        init();

        //Page coord to canvas coord conversion
        const ptoc = function(c) {
            return {
                x: c.x - canvasBbox.left,
                y: c.y - canvasBbox.top
            };
        };

        //Clamps val between min and max
        const clamp = (val, min, max) => Math.max(min,Math.min(val,max));

        //Clamps a set of coords between absolute canvas coords
        const clampToCanvas = (coords) => {
            return {
                x: clamp(coords.x, canvasBbox.left, canvasBbox.right),
                y: clamp(coords.y, canvasBbox.top,  canvasBbox.bottom)
            };
        };

        //Module for managing data points for brush strokes
        const DrawData = (function () {

            /*  POINT */
            //Represents a single point to be drawn
            function Point(x, y) {
                this.x = x;
                this.y = y;
                this.next = null;
            }

            //Sets the reference to the next point
            Point.prototype.setNext = function(next) {
                this.next = next;
            };
            /*  END POINT */


            /*  STROKE */
            function Stroke() {
                this.points = [];
                this.id = uuidv4();
            }

            Stroke.prototype.addPoint = function(point) {
                if (point instanceof Point) {
                    if (this.getLatestPoint() !== null)
                        this.getLatestPoint().setNext(point);
                    this.points.push(point);
                }
                else
                    console.log(`[DrawData::Stroke::addPoint] Argument is not of type Point: type: ${typeof point}`);
            };

            Stroke.prototype.getLatestPoint = function() {
                return (this.points.length > 0) ? this.points[this.points.length-1] : null;
            };

            Stroke.prototype.getFirstPoint = function() {
                return (this.points.length > 0) ? this.points[0] : null;
            };

            Stroke.prototype.getID = function() {
                return this.id;
            };
            /* END STROKE */

            const strokes = [];

            const addStroke = function(stroke) {
                if (stroke instanceof Stroke) {
                    strokes.push(stroke);
                }
                else
                    console.log("[DrawData::addStroke] Argument is not of type Stroke");
            };

            const getStrokes = function() {
                return [...strokes];
            };

            const DrawData_exported = {
                Point: Point,
                Stroke: Stroke,
                addStroke: addStroke,
                printStrokes: () => {console.log(strokes);}
            };

            return DrawData_exported;
        })();

        const bindEventListeners = (function() {
            //Chained stroke event
            let strokeInProgress = false;
            let currentStroke = null;

            const mouseMoveBox = document.querySelector(".content");

            //const bbox = canvasWrapper.getBoundingClientRect();
            // const canvasLeft = canvasBbox.left;
            // const canvasRight = canvasBbox.left + canvasBbox.width;
            // const canvasTop = canvasBbox.top;
            // const canvasBottom = canvasBbox.top + canvasBbox.height;

            // console.log(canvasBbox);

            // console.log(`left: ${canvasLeft}
            // right: ${canvasRight}
            // top: ${canvasTop}
            // bottom: ${canvasBottom}`);
            
            //Mouse pos differential to trigger new point added
            const delta = 4;
            const deltaSq = delta*delta;

            const mouseDownHandler = function(e) {
                currentStroke = new DrawData.Stroke();
                strokeInProgress = true;
                let coords = ptoc(clampToCanvas({x: e.pageX,  y: e.pageY}));
                let newPoint = new DrawData.Point(coords.x,coords.y);
                currentStroke.addPoint(newPoint);

                mouseMoveBox.addEventListener("mousemove", mouseMoveHandler);
            }

            const mouseMoveHandler = function(e) {
                // let clampX = clamp(e.pageX, canvasLeft, canvasRight);
                // let clampY = clamp(e.pageY, canvasTop, canvasBottom);

                //let coords = {x: clampX, y: clampY};
                //let coords = ptoc({x: e.pageX,  y: e.pageY});
                // let coords = ptoc({x: clampX,  y: clampY});
                let coords = ptoc(clampToCanvas({x: e.pageX,  y: e.pageY}));
                if (strokeInProgress && currentStroke !== null) {
                    let latestPoint = currentStroke.getLatestPoint();
                    //if (dist(coords.x, coords.y, latestPoint.x, latestPoint.y) > delta
                    if (distSq(coords.x, coords.y, latestPoint.x, latestPoint.y) > deltaSq
                        || latestPoint === null) {
                        let currentPoint = new DrawData.Point(coords.x,coords.y);
                        currentStroke.addPoint(currentPoint);
                        
                        //Renderer.clear();
                        //Renderer.drawStroke(currentStroke);
                        Renderer.drawFromPoint(latestPoint);
                    }
                }
            }

            const mouseUpHandler = function() {
                if (strokeInProgress) {
                    mouseMoveBox.removeEventListener("mousemove", mouseMoveHandler);
                    strokeInProgress = false;
                    DrawData.addStroke(currentStroke);
                    strokeInProgress = null;

                    DrawData.printStrokes();    //Testing
                    //Renderer.drawStroke(currentStroke);
                }
            }

            return function() {
                mainCanvas.addEventListener("mousedown", mouseDownHandler);
                mouseMoveBox.addEventListener("mouseup", mouseUpHandler);
            };
        })();
        bindEventListeners();


        const Renderer = (function() {
            const drawStroke = function(stroke) {
                if (stroke instanceof DrawData.Stroke) {
                    let currentPoint = stroke.getFirstPoint();
                    mainCtx.moveTo(currentPoint.x,currentPoint.y);
                    do {
                        currentPoint = currentPoint.next;
                        mainCtx.lineTo(currentPoint.x,currentPoint.y);
                    }
                    while (currentPoint.next !== null);
                    mainCtx.stroke();
                }
            };

            const drawFromPoint = function(point) {
                if (point instanceof DrawData.Point) {
                    let currentPoint = point;
                    mainCtx.moveTo(currentPoint.x,currentPoint.y);
                    do {
                        currentPoint = currentPoint.next;
                        mainCtx.lineTo(currentPoint.x,currentPoint.y);
                    }
                    while (currentPoint.next !== null);
                    mainCtx.stroke();
                    return currentPoint;
                }
                return null;
            }

            const updateStroke = function(stroke) {
                if (stroke instanceof DrawData.Stroke)
                    strokesInProgess[stroke.id] = stroke.getLatestPoint();
            };

            const clear = function() {
                mainCtx.clearRect(0,0,width,height);
            }

            const strokesInProgress = {};

            //Represents a stroke in progress, with data expected to be arriving over time
            /*function StrokeStream(stroke) {
                this.boundStroke = null;
                this.lastPoint = null;
                if (typeof stroke !== 'undefined' && stroke instanceof DrawData.Stroke) {
                    this.boundStroke = stroke;
                    this.lastPoint = stroke.getLatestPoint();
                }
            }

            StrokeStream.prototype.bindStroke = function(stroke) {
                this.boundStroke = stroke;
                this.lastPoint = stroke.getLatestPoint();
            }

            StrokeStream.prototype.update = function() {
                
            }

            let strokeStreams = [];*/

            const Renderer_exported = {
                drawStroke: drawStroke,
                drawFromPoint: drawFromPoint,
                clear: clear
            };
            
            return Renderer_exported;
        })();

        const Canvas_exported = {
            width: width,
            height: height,
            init: init
        };

        return Canvas_exported;
    })();

    // document.getElementById("game-create").addEventListener("click", () => {
    //     gameLobby.send('create');
    //     console.log(gameLobby);
    // });

})();