import { WebSocketGameLobbyClient } from 'websocket-game-lobby-client';
import { v4 as uuidv4 } from 'uuid';

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

    const Canvas = (function () {
        //DOM references
        const mainCanvas = document.getElementById("main-canv");
        const auxCanvas = document.getElementById("aux-canv");
        const canvasWrapper = document.querySelector(".canvas-wrapper");

        const mainCtx = mainCanvas.getContext("2d");

        //Static constants
        const width = 1600;
        const height = 900;

        // const offsetLeft = mainCanvas.offsetLeft;
        // const offsetTop = mainCanvas.offsetTop;

        var offsetLeft = canvasWrapper.getBoundingClientRect().left;
        var offsetTop = canvasWrapper.getBoundingClientRect().top;

        //Binding offset vars to window resize
        window.onresize = () => {
            offsetLeft = canvasWrapper.getBoundingClientRect().left;
            offsetTop = canvasWrapper.getBoundingClientRect().top;
        };

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

            mainCtx.lineWidth = 10;
            mainCtx.lineCap = 'round';
        };

        //Page coord to canvas coord conversion
        const ptoc = function(c) {
            return {
                x: c.x - offsetLeft,
                y: c.y - offsetTop
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
            
            //Mouse pos differential to trigger new point added
            const delta = 4;
            const deltaSq = delta*delta;

            const mouseDownHandler = function(e) {
                currentStroke = new DrawData.Stroke();
                strokeInProgress = true;
                let coords = ptoc({x: e.pageX,  y: e.pageY});
                let newPoint = new DrawData.Point(coords.x,coords.y);
                currentStroke.addPoint(newPoint);

                mainCanvas.addEventListener("mousemove", mouseMoveHandler);
            }

            const mouseMoveHandler = function(e) {
                let coords = ptoc({x: e.pageX,  y: e.pageY});
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
                    mainCanvas.removeEventListener("mousemove", mouseMoveHandler);
                    strokeInProgress = false;
                    DrawData.addStroke(currentStroke);
                    strokeInProgress = null;

                    DrawData.printStrokes();    //Testing
                    //Renderer.drawStroke(currentStroke);
                }
            }

            return function() {
                mainCanvas.addEventListener("mousedown", mouseDownHandler);
                mainCanvas.addEventListener("mouseup", mouseUpHandler);
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

    Canvas.init();

    // document.getElementById("game-create").addEventListener("click", () => {
    //     gameLobby.send('create');
    //     console.log(gameLobby);
    // });

})();